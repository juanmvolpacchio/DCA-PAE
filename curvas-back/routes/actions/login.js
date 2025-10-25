// Express handler: POST /login
// Expects body: { username, password }
const { get } = require("../../db");
const bcrypt = require("bcryptjs");

module.exports = async function loginHandler(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }

    const user = await get(
      "SELECT id, username, password, role FROM user WHERE username = ?",
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const ok = password === user.password;
    if (!ok) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    // Sin sesiones por ahora; devolvemos datos mínimos
    return res
      .status(200)
      .json({
        success: true,
        user: { id: user.id, username: user.username, role: user.role },
      });
  } catch (err) {
    return next(err);
  }
};
