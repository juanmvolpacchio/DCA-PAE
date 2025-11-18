// Express handler: GET /projects/:projectName/analysis
const { all } = require("../../db");

/**
 * Calculate extrapolated production using exponential decline curve
 * @param {number} qo - Initial production rate
 * @param {number} dea - Decline rate (exponential)
 * @param {string} startDate - Start date of the curve (ISO format)
 * @param {string} fromDate - Start date for calculation (ISO format)
 * @param {string} toDate - End date for calculation (ISO format)
 * @returns {number} Total extrapolated production for the period
 */
function calculateExtrapolatedProduction(qo, dea, startDate, fromDate, toDate) {
  const curveStart = new Date(startDate);
  const periodStart = new Date(fromDate);
  const periodEnd = new Date(toDate);

  // Calculate months from curve start to period start
  const monthsFromStart = Math.max(
    0,
    (periodStart.getFullYear() - curveStart.getFullYear()) * 12 +
      (periodStart.getMonth() - curveStart.getMonth())
  );

  // Calculate number of months in the period
  const monthsInPeriod =
    (periodEnd.getFullYear() - periodStart.getFullYear()) * 12 +
    (periodEnd.getMonth() - periodStart.getMonth()) +
    1;

  let totalProduction = 0;

  // Sum monthly production: q(t) = qo * e^(-dea * t)
  for (let i = 0; i < monthsInPeriod; i++) {
    const t = monthsFromStart + i;
    const monthlyProduction = qo * Math.exp(-dea * t);
    totalProduction += monthlyProduction;
  }

  return totalProduction;
}

/**
 * Get the last production date across all wells
 */
async function getLastProductionDate() {
  const result = await all(
    "SELECT MAX(month) as lastMonth FROM well_production;"
  );
  return result[0]?.lastMonth || null;
}

module.exports = async function getProjectAnalysisHandler(req, res, next) {
  try {
    const { projectName } = req.params;
    const { fechaDesde, fechaHasta, fluidType = "oil" } = req.query;

    if (!projectName) {
      return res.status(400).json({ error: "projectName is required" });
    }

    if (!fechaDesde || !fechaHasta) {
      return res.status(400).json({ error: "fechaDesde and fechaHasta are required" });
    }

    // Validate fluid type
    const validFluidTypes = ["oil", "gas", "water"];
    if (!validFluidTypes.includes(fluidType)) {
      return res.status(400).json({ error: "Invalid fluidType. Must be oil, gas, or water" });
    }

    // Get all wells in the project
    const wells = await all("SELECT name FROM well WHERE proyecto = ?;", [
      projectName,
    ]);

    if (!wells || wells.length === 0) {
      return res.status(404).json({ error: "No wells found for this project" });
    }

    // Map fluid type to database column
    const fluidColumnMap = {
      oil: "efec_oil_prod",
      gas: "efec_gas_prod",
      water: "efec_water_prod",
    };

    const fluidColumn = fluidColumnMap[fluidType];

    const results = [];

    // Process each well
    for (const well of wells) {
      const wellName = well.name;

      // Get the saved curve for this fluid type
      const curve = await all(
        `SELECT * FROM saved_curve
         WHERE well = ? AND fluid_type = ?
         ORDER BY created_at DESC
         LIMIT 1;`,
        [wellName, fluidType]
      );

      if (!curve || curve.length === 0) {
        // No curve saved for this well/fluid type, skip
        continue;
      }

      const { qo, dea, start_date } = curve[0];

      // Get actual production data for the period
      // Use strftime to match year-month regardless of day
      const productionData = await all(
        `SELECT month, ${fluidColumn} as production
         FROM well_production
         WHERE well = ?
         AND strftime('%Y-%m', month) >= ?
         AND strftime('%Y-%m', month) <= ?
         ORDER BY month ASC;`,
        [wellName, fechaDesde, fechaHasta]
      );

      // Calculate total actual production
      const volumeProduced = productionData.reduce(
        (sum, row) => sum + (Number(row.production) || 0),
        0
      );

      // Calculate extrapolated production
      const volumeExtrapolated = calculateExtrapolatedProduction(
        qo,
        dea,
        start_date,
        fechaDesde,
        fechaHasta
      );

      // Calculate delta
      const delta = volumeExtrapolated - volumeProduced;

      results.push({
        well: wellName,
        volumeProduced: Number(volumeProduced.toFixed(2)),
        volumeExtrapolated: Number(volumeExtrapolated.toFixed(2)),
        delta: Number(delta.toFixed(2)),
      });
    }

    // Get last production date for default values
    const lastProductionDate = await getLastProductionDate();

    return res.status(200).json({
      projectName,
      fluidType,
      fechaDesde,
      fechaHasta,
      lastProductionDate,
      wells: results,
    });
  } catch (err) {
    return next(err);
  }
};
