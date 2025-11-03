const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.sqlite");
const BACKUP_PATH = path.join(__dirname, "data.sqlite.backup");

console.log("=== Database Migration Script ===");
console.log(`Database: ${DB_PATH}`);

// Create backup
console.log("\n1. Creating backup...");
fs.copyFileSync(DB_PATH, BACKUP_PATH);
console.log(`   ✓ Backup created: ${BACKUP_PATH}`);

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  console.log("\n2. Starting migration...");

  // Step 1: Drop unused tables
  console.log("   - Dropping unused tables...");
  db.run("DROP TABLE IF EXISTS curves;", (err) => {
    if (err) {
      console.error("   ✗ Error dropping curves:", err.message);
    } else {
      console.log("   ✓ Dropped table: curves");
    }
  });

  db.run("DROP TABLE IF EXISTS users;", (err) => {
    if (err) {
      console.error("   ✗ Error dropping users:", err.message);
    } else {
      console.log("   ✓ Dropped table: users");
    }
  });

  // Step 2: Create new saved_curve table with additional columns
  console.log("   - Creating new saved_curve table...");
  db.run(
    `CREATE TABLE saved_curve_new (
      id TEXT PRIMARY KEY,
      name TEXT,
      qo REAL,
      dea REAL,
      t REAL,
      well TEXT,
      user_id INTEGER,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
    (err) => {
      if (err) {
        console.error("   ✗ Error creating new table:", err.message);
        db.close();
        return;
      }
      console.log("   ✓ Created table: saved_curve_new");

      // Step 3: Copy existing data
      console.log("   - Migrating existing data...");
      db.run(
        `INSERT INTO saved_curve_new (id, name, qo, dea, t, well, user_id, comment, created_at)
         SELECT id, name, qo, dea, t, well, user_id, NULL, datetime('now') FROM saved_curve;`,
        function (err) {
          if (err) {
            console.error("   ✗ Error migrating data:", err.message);
            db.close();
            return;
          }
          console.log(`   ✓ Migrated ${this.changes} rows`);

          // Step 4: Drop old table
          console.log("   - Dropping old saved_curve table...");
          db.run("DROP TABLE saved_curve;", (err) => {
            if (err) {
              console.error("   ✗ Error dropping old table:", err.message);
              db.close();
              return;
            }
            console.log("   ✓ Dropped old table");

            // Step 5: Rename new table
            console.log("   - Renaming new table...");
            db.run(
              "ALTER TABLE saved_curve_new RENAME TO saved_curve;",
              (err) => {
                if (err) {
                  console.error("   ✗ Error renaming table:", err.message);
                  db.close();
                  return;
                }
                console.log("   ✓ Renamed table");

                // Verify migration
                console.log("\n3. Verifying migration...");
                db.all("PRAGMA table_info(saved_curve);", (err, cols) => {
                  if (err) {
                    console.error("   ✗ Error verifying:", err.message);
                  } else {
                    console.log("   ✓ New saved_curve columns:");
                    cols.forEach((c) => {
                      console.log(`     - ${c.name}: ${c.type}`);
                    });
                  }

                  db.close();
                  console.log("\n=== Migration completed successfully ===");
                  console.log(
                    `Backup available at: ${BACKUP_PATH}`
                  );
                });
              }
            );
          });
        }
      );
    }
  );
});
