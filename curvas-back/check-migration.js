const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("data.sqlite");

db.all(
  "SELECT COUNT(*) as count FROM saved_curve WHERE fluid_type = 'oil' AND comment LIKE 'Migrated from df_final.json%'",
  (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Curvas migradas:", rows[0].count);
    }

    db.all(
      "SELECT well, name, qo, dea, start_date FROM saved_curve WHERE fluid_type = 'oil' AND comment LIKE 'Migrated from df_final.json%' LIMIT 5",
      (err, rows) => {
        if (err) {
          console.error(err);
        } else {
          console.log("\nEjemplos de curvas creadas:");
          rows.forEach((r) => {
            console.log(`  ${r.well}: qo=${r.qo}, dea=${r.dea}, start_date=${r.start_date}`);
          });
        }
        db.close();
      }
    );
  }
);
