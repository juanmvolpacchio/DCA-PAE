const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.sqlite");
const BACKUP_PATH = path.join(__dirname, "data.sqlite.backup-fluid-type");

console.log("=== Database Migration Script: Add fluid_type ===");
console.log(`Database: ${DB_PATH}`);

// Create backup
console.log("\n1. Creating backup...");
fs.copyFileSync(DB_PATH, BACKUP_PATH);
console.log(`   ✓ Backup created: ${BACKUP_PATH}`);

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  console.log("\n2. Starting migration...");

  // Step 1: Create new saved_curve table with fluid_type
  console.log("   - Creating new saved_curve table with fluid_type...");
  db.run(
    `CREATE TABLE saved_curve_new (
      id TEXT PRIMARY KEY,
      name TEXT,
      qo REAL,
      dea REAL,
      start_date TEXT,
      well TEXT,
      user_id INTEGER,
      comment TEXT,
      fluid_type TEXT DEFAULT 'oil',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(name, well, fluid_type)
    );`,
    (err) => {
      if (err) {
        console.error("   ✗ Error creating new table:", err.message);
        db.close();
        return;
      }
      console.log("   ✓ Created table: saved_curve_new");

      // Step 2: Copy existing data - all existing curves are 'oil' type
      console.log("   - Migrating existing data (setting all to 'oil')...");
      db.run(
        `INSERT INTO saved_curve_new (id, name, qo, dea, start_date, well, user_id, comment, fluid_type, created_at)
         SELECT name || well || 'oil', name, qo, dea, start_date, well, user_id, comment, 'oil', created_at FROM saved_curve;`,
        function (err) {
          if (err) {
            console.error("   ✗ Error migrating data:", err.message);
            db.close();
            return;
          }
          console.log(`   ✓ Migrated ${this.changes} rows (all as 'oil' type)`);

          // Step 3: Drop old table
          console.log("   - Dropping old saved_curve table...");
          db.run("DROP TABLE saved_curve;", (err) => {
            if (err) {
              console.error("   ✗ Error dropping old table:", err.message);
              db.close();
              return;
            }
            console.log("   ✓ Dropped old table");

            // Step 4: Rename new table
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

                  // Check data
                  db.all("SELECT COUNT(*) as count, fluid_type FROM saved_curve GROUP BY fluid_type;", (err, rows) => {
                    if (err) {
                      console.error("   ✗ Error checking data:", err.message);
                    } else {
                      console.log("\n   ✓ Curves by fluid type:");
                      rows.forEach((r) => {
                        console.log(`     - ${r.fluid_type}: ${r.count} curve(s)`);
                      });
                    }

                    db.close();
                    console.log("\n=== Migration completed successfully ===");
                    console.log(`Backup available at: ${BACKUP_PATH}`);
                  });
                });
              }
            );
          });
        }
      );
    }
  );
});
