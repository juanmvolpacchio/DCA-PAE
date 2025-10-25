const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.sqlite");
const AWS_REGION = process.env.AWS_REGION;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_KEY = process.env.S3_KEY || "backups/data.sqlite";
const BACKUP_INTERVAL_MS = Number(
  process.env.S3_BACKUP_INTERVAL_MS || 10 * 60 * 1000
);

setInterval(() => {
  backupToS3();
}, BACKUP_INTERVAL_MS);

function getS3Client() {
  return AWS_REGION && S3_BUCKET ? new S3Client({ region: AWS_REGION }) : null;
}

async function backupToS3() {
  const s3 = getS3Client();
  if (!s3) {
    console.error("S3 client not initialized");
    return;
  }
  try {
    fs.readFile(DB_PATH, (err, data) => {
      if (err) throw err;
      s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: S3_KEY,
          Body: data,
          ContentType: "application/octet-stream",
        })
      );
    });
  } catch (err) {
    console.error("S3 backup failed:", err);
  }
}

async function downloadDatabaseFromS3() {
  const s3 = getS3Client();
  if (!s3) {
    throw new Error("S3 client not initialized");
  }

  try {
    // Verificar si el archivo backup existe
    await s3.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: S3_KEY,
      })
    );
  } catch (err) {
    if (err.name === "NotFound") {
      throw new Error(`Backup file not found: ${S3_KEY}`);
    }
    throw err;
  }

  // Descargar el archivo backup
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: S3_KEY,
    })
  );

  // Leer el stream y convertirlo a buffer
  const chunks = [];
  await new Promise((resolve, reject) => {
    response.Body.on("data", (chunk) => chunks.push(chunk));
    response.Body.on("end", resolve);
    response.Body.on("error", reject);
  });

  const backupData = Buffer.concat(chunks);

  // Escribir el backup como nueva base de datos
  fs.writeFileSync(DB_PATH, backupData);

  return {
    success: true,
    message: "Database downloaded from backup successfully",
  };
}

async function initializeDatabase() {
  // Verificar si el archivo de base de datos existe localmente
  if (!fs.existsSync(DB_PATH)) {
    console.log(
      "Local database not found, attempting to download from backup..."
    );

    const s3 = getS3Client();
    if (s3) {
      try {
        await downloadDatabaseFromS3();
        console.log("Database downloaded from backup successfully");
      } catch (err) {
        console.error("Failed to download database from backup:", err.message);
        console.log("Creating empty database...");
        // Si no se puede descargar, crear una base de datos vacía
        fs.writeFileSync(DB_PATH, "");
      }
    } else {
      console.log("S3 not configured, creating empty database...");
      // Si S3 no está configurado, crear una base de datos vacía
      fs.writeFileSync(DB_PATH, "");
    }
  } else {
    console.log("Local database found, using existing database");
  }
}

// Inicializar la base de datos y luego crear la conexión
let db;

async function createDatabaseConnection() {
  await initializeDatabase();
  db = new sqlite3.Database(DB_PATH);
  console.log("Database connection established");
}

// Inicializar la conexión
createDatabaseConnection().catch((err) => {
  console.error("Database initialization failed:", err);
  // Crear conexión de emergencia con base de datos vacía
  db = new sqlite3.Database(DB_PATH);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
  initializeDatabase,
  close: () =>
    new Promise((resolve, reject) => {
      db.close(async (err) => {
        if (err) reject(err);
        try {
          await backupToS3();
        } catch (_) {}
        resolve();
      });
    }),
};
