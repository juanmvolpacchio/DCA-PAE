const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("data.sqlite");

db.all(
  "SELECT COUNT(*) as count, fluid_type FROM saved_curve GROUP BY fluid_type",
  (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Curvas por tipo:");
      rows.forEach((r) => {
        console.log(`  ${r.fluid_type}: ${r.count}`);
      });
    }

    db.all(
      "SELECT id, well, name, qo, dea, start_date, fluid_type, comment FROM saved_curve WHERE fluid_type = 'oil' LIMIT 5",
      (err, rows) => {
        if (err) {
          console.error(err);
        } else {
          console.log("\nEjemplos de curvas oil:");
          rows.forEach((r) => {
            console.log(`  ${r.well} - ${r.name}:`);
            console.log(`    id: ${r.id}`);
            console.log(`    qo: ${r.qo}, dea: ${r.dea}`);
            console.log(`    start_date: ${r.start_date}`);
            console.log(`    comment: ${r.comment}`);
          });
        }
        db.close();
      }
    );
  }
);
