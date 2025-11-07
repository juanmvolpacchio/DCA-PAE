// Express handler: POST /curves
// Expects body: { name, qo, dea, start_date, well, user_id, fluid_type, comment (optional) }
const { run } = require("../../db");

module.exports = async function saveCurveHandler(req, res, next) {
  try {
    const { name, qo, dea, start_date, well, user_id, fluid_type, comment } = req.body || {};

    // Validate required fields
    if (
      !name ||
      !well ||
      qo === undefined ||
      dea === undefined ||
      !start_date ||
      user_id === undefined ||
      !fluid_type
    ) {
      return res
        .status(400)
        .json({ error: "name, well, qo, dea, start_date, user_id, fluid_type are required" });
    }

    // Validate fluid_type
    if (!['oil', 'gas', 'water'].includes(fluid_type)) {
      return res
        .status(400)
        .json({ error: "fluid_type must be 'oil', 'gas', or 'water'" });
    }

    const compositeId = name + well + fluid_type;

    const result = await run(
      `INSERT INTO saved_curve (id, name, qo, dea, start_date, well, user_id, fluid_type, comment, created_at)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = ?, qo = ?, dea = ?, start_date = ?, well = ?, user_id = ?, fluid_type = ?, comment = ?, created_at = datetime('now');`,
      [
        compositeId,
        name,
        qo,
        dea,
        start_date,
        well,
        user_id,
        fluid_type,
        comment || null,
        name,
        qo,
        dea,
        start_date,
        well,
        user_id,
        fluid_type,
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
        start_date,
        user_id: Number(user_id),
        fluid_type,
        comment: comment || null,
      },
    });
  } catch (err) {
    if (err && err.message && err.message.includes("UNIQUE")) {
      return res
        .status(409)
        .json({ error: "curve with same name, well, and fluid_type already exists" });
    }
    return next(err);
  }
};
