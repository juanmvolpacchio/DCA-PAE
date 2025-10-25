// Express handler: GET /wells/:well/curves
const { all } = require("../../db");

module.exports = async function getWellSavedCurvesHandler(req, res, next) {
  try {
    const { well } = req.params;
    if (!well) return res.status(400).json({ error: "well is required" });

    const rows = await all(
      "SELECT sc.*, u.username FROM saved_curve AS sc LEFT JOIN user AS u ON sc.user_id = u.id WHERE well = ?;",
      [well]
    );

    return res.status(200).json({ curves: rows });
  } catch (err) {
    return next(err);
  }
};
