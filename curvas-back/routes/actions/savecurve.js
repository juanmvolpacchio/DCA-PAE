// Express handler: POST /curves
// Expects body: { name, qo, dea, t, well, user_id }
const { run } = require("../../db");

module.exports = async function saveCurveHandler(req, res, next) {
  try {
    const { name, qo, dea, t, well, user_id } = req.body || {};

    if (
      !name ||
      !well ||
      qo === undefined ||
      dea === undefined ||
      t === undefined ||
      user_id === undefined
    ) {
      return res
        .status(400)
        .json({ error: "name, well, qo, dea, t, user_id are required" });
    }

    const result = await run(
      `INSERT INTO saved_curve VALUES(?, ?, ?, ?, ?, ?, ?) 
            ON CONFLICT(id) DO UPDATE SET name = ?, qo = ?, dea = ?, t = ?, well = ?, user_id = ?;`,
      [
        name + well,
        name,
        qo,
        dea,
        t,
        well,
        user_id,
        name,
        qo,
        dea,
        t,
        well,
        user_id,
      ]
    );

    return res.status(201).json({
      success: true,
      curve: {
        id: result.id,
        name,
        well,
        qo: Number(qo),
        dea: Number(dea),
        t: Number(t),
        user_id: Number(user_id),
      },
    });
  } catch (err) {
    if (err && err.message && err.message.includes("UNIQUE")) {
      return res
        .status(409)
        .json({ error: "curve with same name and well already exists" });
    }
    return next(err);
  }
};
