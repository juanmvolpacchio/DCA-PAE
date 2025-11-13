const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const regression = require("regression");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.sqlite");
const JSON_PATH = path.join(__dirname, "df_final.json");
const BACKUP_PATH = path.join(__dirname, "data.sqlite.backup-curves");

console.log("=== Curve Migration from JSON Script ===");
console.log(`Database: ${DB_PATH}`);
console.log(`JSON Source: ${JSON_PATH}`);

// Create backup
console.log("\n1. Creating backup...");
fs.copyFileSync(DB_PATH, BACKUP_PATH);
console.log(`   ✓ Backup created: ${BACKUP_PATH}`);

// Load JSON data
console.log("\n2. Loading JSON data...");
let jsonData;
try {
  const jsonContent = fs.readFileSync(JSON_PATH, "utf8");
  jsonData = JSON.parse(jsonContent);
  console.log(`   ✓ Loaded ${jsonData.length} entries from JSON`);
} catch (error) {
  console.error("   ✗ Error loading JSON:", error.message);
  process.exit(1);
}

// Exponential fitter function (same as frontend)
function exponentialFitter(dataArr) {
  const refinedArr = dataArr.map((d) => (!d ? 0.0001 : d));

  const coefs = regression.exponential(
    refinedArr.map((qo, i) => [i + 1, qo]),
    {
      precision: 20,
    }
  );

  return [coefs.equation[0], -coefs.equation[1]];
}

// Calculate curve parameters from production data starting at a specific date
function calculateCurveParams(productionData, cutDate, injectionDate) {
  const { efec_oil_prod, month } = productionData;

  const cutDateTime = new Date(cutDate);
  const injectionDateTime = injectionDate ? new Date(injectionDate) : null;

  // Check if cut date equals injection date (within same day)
  const isCutDateEqualInjection = injectionDateTime &&
    cutDateTime.toISOString().split('T')[0] === injectionDateTime.toISOString().split('T')[0];

  let startIndex;

  if (isCutDateEqualInjection) {
    // Find the PEAK (highest production point) after the cut date
    console.log(`     ℹ Cut date equals injection date - searching for peak`);

    // Get all indices after cut date
    const indicesAfterCut = month
      .map((m, idx) => ({ date: new Date(m), idx }))
      .filter(({ date }) => date >= cutDateTime)
      .map(({ idx }) => idx);

    if (indicesAfterCut.length === 0) {
      console.log(`     ⚠ No production data found on or after ${cutDate}`);
      return null;
    }

    // Find the index with maximum production value
    startIndex = indicesAfterCut.reduce((maxIdx, currentIdx) => {
      const currentValue = efec_oil_prod[currentIdx] || 0;
      const maxValue = efec_oil_prod[maxIdx] || 0;
      return currentValue > maxValue ? currentIdx : maxIdx;
    }, indicesAfterCut[0]);

    console.log(`     ℹ Peak found at index ${startIndex} with value ${efec_oil_prod[startIndex]}`);
  } else {
    // Find the NEXT production point on or after the cut date
    startIndex = month.findIndex((m) => {
      const prodDate = new Date(m);
      return prodDate >= cutDateTime;
    });

    if (startIndex === -1) {
      console.log(`     ⚠ No production data found on or after ${cutDate}`);
      return null;
    }
  }

  // Use the actual production date as start_date (not the cut date)
  const actualStartDate = month[startIndex];

  // Get production data from startDate onwards
  const segmentData = efec_oil_prod.slice(startIndex);

  // Filter out undefined/null values and limit to avoid last 5 points (as per frontend logic)
  const filteredData = segmentData
    .slice(0, Math.max(1, segmentData.length - 5))
    .filter((value) => value !== undefined && value !== null && !isNaN(value));

  if (filteredData.length < 3) {
    console.log(`     ⚠ Not enough data points (${filteredData.length}) after filtering`);
    return null;
  }

  // Calculate qo and dea using exponential fitting
  try {
    const [qo, dea] = exponentialFitter(filteredData);

    return {
      qo: Number(qo.toFixed(2)),
      dea: Number(dea.toFixed(4)),
      start_date: actualStartDate,
      dataPoints: filteredData.length,
      cutDate: cutDate, // Keep original cut date for reference
      injectionDate: injectionDate,
      usedPeakMethod: isCutDateEqualInjection,
    };
  } catch (error) {
    console.log(`     ⚠ Error fitting curve: ${error.message}`);
    return null;
  }
}

// Promisify database operations
function dbRun(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbGet(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Main migration logic
async function migrateData() {
  const db = new sqlite3.Database(DB_PATH);

  try {
    console.log("\n3. Processing wells and generating curves...");

    // Get unique pozos from JSON
    const uniqueWells = [...new Set(jsonData.map((entry) => entry.pozo))];
    console.log(`   Found ${uniqueWells.length} unique wells in JSON`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Always use user_id = 1 for migrated curves
    const userId = 1;

    for (const entry of jsonData) {
      const { pozo, fecha_corte, fecha_inyeccion, fecha_evento_buffered, fecha_sist_buffered } = entry;

      if (!pozo || !fecha_corte) {
        console.log(`   ⚠ Skipping entry: missing pozo or fecha_corte`);
        skipCount++;
        continue;
      }

      console.log(`\n   Processing: ${pozo}`);
      console.log(`     Cut date: ${fecha_corte}`);
      if (fecha_inyeccion) {
        console.log(`     Injection date: ${fecha_inyeccion}`);
      }
      if (fecha_evento_buffered) {
        console.log(`     Event date: ${fecha_evento_buffered}`);
      }
      if (fecha_sist_buffered) {
        console.log(`     System date: ${fecha_sist_buffered}`);
      }

      // Check if well exists in database
      const wellExists = await dbGet(
        db,
        "SELECT name FROM well WHERE name = ?",
        [pozo]
      );

      if (!wellExists) {
        console.log(`     ⚠ Well ${pozo} not found in database, skipping`);
        skipCount++;
        continue;
      }

      // Get production data for this well
      const prodData = await dbAll(
        db,
        `SELECT month, efec_oil_prod
         FROM well_production
         WHERE well = ?
         ORDER BY month ASC`,
        [pozo]
      );

      if (prodData.length === 0) {
        console.log(`     ⚠ No production data found for ${pozo}`);
        skipCount++;
        continue;
      }

      // Transform data to match frontend format
      const productionData = {
        month: prodData.map((row) => row.month),
        efec_oil_prod: prodData.map((row) => row.efec_oil_prod),
      };

      // Calculate curve parameters
      const curveParams = calculateCurveParams(productionData, fecha_corte, fecha_inyeccion);

      if (!curveParams) {
        console.log(`     ✗ Could not calculate curve parameters`);
        errorCount++;
        continue;
      }

      console.log(`     ✓ Calculated params: qo=${curveParams.qo}, dea=${curveParams.dea}`);
      console.log(`     Method: ${curveParams.usedPeakMethod ? 'PEAK (injection date match)' : 'NEXT POINT'}`);
      console.log(`     Cut date: ${curveParams.cutDate} → Start date: ${curveParams.start_date}`);
      console.log(`     Data points used: ${curveParams.dataPoints}`);

      // Determine event type based on fecha_corte
      let eventType = "Desconocido";

      // Helper function to compare dates (ignoring time)
      const isSameDate = (date1, date2) => {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
      };

      if (isSameDate(fecha_corte, fecha_evento_buffered)) {
        eventType = "Intervención";
      } else if (isSameDate(fecha_corte, fecha_inyeccion)) {
        eventType = "Inyección";
      } else if (isSameDate(fecha_corte, fecha_sist_buffered)) {
        eventType = "Sistema de Extracción";
      }

      // Format cut date as DD/MM/YYYY
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const formattedCutDate = formatDate(fecha_corte);
      const comment = `Fecha Inicio seleccionada por ${eventType}\nFecha de corte: ${formattedCutDate}`;

      console.log(`     Event type: ${eventType}`);
      console.log(`     Comment: ${comment.replace('\n', ' | ')}`);

      // Save curve to database
      const curveName = "Curva Base Oil";
      const curveId = `${curveName}${pozo}`;

      try {
        await dbRun(
          db,
          `INSERT OR REPLACE INTO saved_curve
           (id, name, qo, dea, start_date, well, user_id, comment, created_at, fluid_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
          [
            curveId,
            curveName,
            curveParams.qo,
            curveParams.dea,
            curveParams.start_date,
            pozo,
            userId,
            comment,
            "oil"
          ]
        );

        console.log(`     ✓ Curve saved to database`);
        successCount++;
      } catch (error) {
        console.log(`     ✗ Error saving curve: ${error.message}`);
        errorCount++;
      }
    }

    console.log("\n4. Migration Summary:");
    console.log(`   ✓ Successful: ${successCount} curves created`);
    console.log(`   ⚠ Skipped: ${skipCount} entries`);
    console.log(`   ✗ Errors: ${errorCount} entries`);

    // Verify final count
    const totalCurves = await dbGet(
      db,
      "SELECT COUNT(*) as count FROM saved_curve WHERE fluid_type = 'oil'"
    );
    console.log(`   Total oil curves in database: ${totalCurves.count}`);

  } catch (error) {
    console.error("\n✗ Migration failed:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log("\n=== Migration completed successfully ===");
    console.log(`Backup available at: ${BACKUP_PATH}`);
  })
  .catch((error) => {
    console.error("\n=== Migration failed ===");
    console.error(error);
    process.exit(1);
  });
