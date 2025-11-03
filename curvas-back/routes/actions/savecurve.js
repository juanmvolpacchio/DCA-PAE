// Express handler: POST /curves
// Expects body: { name, qo, dea, t, well, user_id, comment (optional) }
const { run } = require("../../db");

module.exports = async function saveCurveHandler(req, res, next) {
  try {
    const { name, qo, dea, t, well, user_id, comment } = req.body || {};

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
      `INSERT INTO saved_curve (id, name, qo, dea, t, well, user_id, comment, created_at)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = ?, qo = ?, dea = ?, t = ?, well = ?, user_id = ?, comment = ?, created_at = datetime('now');`,
      [
        name + well,
        name,
        qo,
        dea,
        t,
        well,
        user_id,
        comment || null,
        name,
        qo,
        dea,
        t,
        well,
        user_id,
        comment || null,
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
        comment: comment || null,
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
