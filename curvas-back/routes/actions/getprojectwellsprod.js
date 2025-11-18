// Express handler: GET /projects/:projectName/wells/prod
// GET /projects/:projectName/wells/:wellNames/prod
const { all } = require("../../db");

/**
 * Get production data for wells in a project
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
module.exports = async function getProjectWellsProductionHandler(req, res, next) {
  try {
    const { projectName, wellNames } = req.params;

    if (!projectName) {
      return res.status(400).json({ error: "projectName is required" });
    }

    let rows;

    if (wellNames) {
      // Get production for specific wells
      const wellList = wellNames.split(',').map(w => w.trim());
      const placeholders = wellList.map(() => '?').join(',');

      rows = await all(
        `SELECT wp.*
         FROM well_production wp
         JOIN well w ON wp.well = w.name
         WHERE w.proyecto = ?
         AND wp.well IN (${placeholders})
         ORDER BY wp.well ASC, wp.month ASC;`,
        [projectName, ...wellList]
      );
    } else {
      // Get production for all wells in the project
      rows = await all(
        `SELECT wp.*
         FROM well_production wp
         JOIN well w ON wp.well = w.name
         WHERE w.proyecto = ?
         ORDER BY wp.well ASC, wp.month ASC;`,
        [projectName]
      );
    }

    if (rows && rows.length > 0) {
      // If single well, return format matching getwellprod.js
      if (wellNames && !wellNames.includes(',')) {
        const payload = {
          well: rows[0].well,
          month: rows.map((wp) => wp.month),
          efec_oil_prod: rows.map((wp) => Number(wp.efec_oil_prod)),
          efec_gas_prod: rows.map((wp) => Number(wp.efec_gas_prod)),
          efec_water_prod: rows.map((wp) => Number(wp.efec_water_prod)),
        };
        return res.status(200).json(payload);
      }

      // For multiple wells, group by month and sum values
      const grouped = {};
      for (const row of rows) {
        const month = row.month;
        if (!grouped[month]) {
          grouped[month] = {
            efec_oil_prod: 0,
            efec_gas_prod: 0,
            efec_water_prod: 0,
          };
        }
        grouped[month].efec_oil_prod += Number(row.efec_oil_prod);
        grouped[month].efec_gas_prod += Number(row.efec_gas_prod);
        grouped[month].efec_water_prod += Number(row.efec_water_prod);
      }

      // Convert to array format
      const months = Object.keys(grouped).sort();
      const payload = {
        well: `${projectName} (múltiples pozos)`,
        month: months,
        efec_oil_prod: months.map(m => grouped[m].efec_oil_prod),
        efec_gas_prod: months.map(m => grouped[m].efec_gas_prod),
        efec_water_prod: months.map(m => grouped[m].efec_water_prod),
      };

      return res.status(200).json(payload);
    }

    return res.status(200).json({
      well: projectName,
      month: [],
      efec_oil_prod: [],
      efec_gas_prod: [],
      efec_water_prod: [],
    });
  } catch (err) {
    return next(err);
  }
};
