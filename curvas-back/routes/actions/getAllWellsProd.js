// Express handler: GET /production/all
const { all } = require("../../db");

/**
 * Retrieves all production records from the well_production table.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
module.exports = async function getAllWellsProductionDataHandler(
  req,
  res,
  next
) {
  try {
    // 1. Query the database for ALL records in the well_production table
    const rows = await all("SELECT * FROM well_production;", []);

    if (rows && rows.length > 0) {
      // 2. Format the data to match the expected structure for the client-side aggregation.
      // NOTE: We return an array of objects here, where each object has the 'well' identifier.
      // The client-side code will be responsible for grouping and summing by 'month'.
      const payload = rows.map((wp) => ({
        well: wp.well, // Keep the well identifier
        month: wp.month,
        efec_oil_prod: Number(wp.efec_oil_prod),
        efec_gas_prod: Number(wp.efec_gas_prod),
        efec_water_prod: Number(wp.efec_water_prod),
        // Include any other production columns needed for aggregation
      }));

      return res.status(200).json(payload);
    }

    // 3. Return an empty array if no data is found
    return res.status(200).json([]);
  } catch (err) {
    // 4. Pass errors to the Express error handler
    return next(err);
  }
};
