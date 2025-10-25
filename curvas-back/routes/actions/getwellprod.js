// Express handler: GET /wells/:well/production
const { all } = require("../../db");

module.exports = async function getWellProdDataHandler(req, res, next) {
  try {
    const { well } = req.params;
    if (!well) return res.status(400).json({ error: "well is required" });

    const rows = await all("SELECT * FROM well_production WHERE well = ?;", [
      well,
    ]);

    if (rows && rows.length > 0) {
      const payload = {
        well: rows[0].well,
        month: rows.map((wp) => wp.month),
        efec_oil_prod: rows.map((wp) => Number(wp.efec_oil_prod)),
        efec_gas_prod: rows.map((wp) => Number(wp.efec_gas_prod)),
        efec_water_prod: rows.map((wp) => Number(wp.efec_water_prod)),
      };
      return res.status(200).json(payload);
    }

    return res.status(200).json([]);
  } catch (err) {
    return next(err);
  }
};
