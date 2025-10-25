// Express handler: GET /wells
const { all } = require("../../db");

module.exports = async function getAllWellsHandler(req, res, next) {
  try {
    const wells = await all("SELECT * FROM well;");
    return res.status(200).json({ wells });
  } catch (err) {
    return next(err);
  }
};
