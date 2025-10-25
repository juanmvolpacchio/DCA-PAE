// Express handler: GET /wells/:well
const { get } = require("../../db");

module.exports = async function getWellHandler(req, res, next) {
  try {
    const { well } = req.params;
    if (!well) return res.status(400).json({ error: "well is required" });

    const wellData = await get("SELECT * FROM well WHERE name = ?", [well]);

    if (!wellData) {
      return res.status(404).json({ error: "well not found" });
    }

    return res.status(200).json({ well: wellData });
  } catch (err) {
    return next(err);
  }
};
