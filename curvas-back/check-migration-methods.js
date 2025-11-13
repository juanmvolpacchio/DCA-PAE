const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("data.sqlite");

db.all(
  "SELECT COUNT(*) as count, CASE WHEN comment LIKE '%Peak method%' THEN 'Peak' WHEN comment LIKE '%Next point%' THEN 'Next Point' ELSE 'Other' END as method FROM saved_curve WHERE fluid_type = 'oil' GROUP BY method",
  (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Curvas por método:");
      rows.forEach((r) => {
        console.log(`  ${r.method}: ${r.count} curvas`);
      });
    }

    db.all(
      "SELECT well, name, qo, dea, start_date, comment FROM saved_curve WHERE fluid_type = 'oil' AND comment LIKE '%Peak method%' LIMIT 3",
      (err, rows) => {
        if (err) {
          console.error(err);
        } else {
          console.log("\nEjemplos de curvas con método PEAK:");
          rows.forEach((r) => {
            console.log(`  ${r.well}:`);
            console.log(`    qo=${r.qo}, dea=${r.dea}`);
            console.log(`    start_date=${r.start_date}`);
            console.log(`    ${r.comment}`);
          });
        }

        db.all(
          "SELECT well, name, qo, dea, start_date, comment FROM saved_curve WHERE fluid_type = 'oil' AND comment LIKE '%Next point%' LIMIT 3",
          (err, rows) => {
            if (err) {
              console.error(err);
            } else {
              console.log("\nEjemplos de curvas con método NEXT POINT:");
              rows.forEach((r) => {
                console.log(`  ${r.well}:`);
                console.log(`    qo=${r.qo}, dea=${r.dea}`);
                console.log(`    start_date=${r.start_date}`);
                console.log(`    ${r.comment}`);
              });
            }
            db.close();
          }
        );
      }
    );
  }
);
