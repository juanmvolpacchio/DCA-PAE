// Express handler: POST /logout
module.exports = async function logoutHandler(req, res, next) {
  try {
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
