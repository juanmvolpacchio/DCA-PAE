// Express handler: DELETE /curves
// Accepts body or query: { name, well }
const { run } = require("../../db");

module.exports = async function deleteCurveHandler(req, res, next) {
  try {
    const { name, well } = Object.keys(req.body || {}).length
      ? req.body
      : req.query;

    if (!name || !well) {
      return res.status(400).json({ error: "name and well are required" });
    }

    const result = await run(`DELETE FROM saved_curve WHERE id = ?;`, [
      name + well,
    ]);

    if (!result.changes) {
      return res.status(404).json({ error: "curve not found" });
    }

    return res.status(200).json({ success: true, deleted: { name, well } });
  } catch (err) {
    return next(err);
  }
};
