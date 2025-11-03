var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// Actions
const login = require("./actions/login");
const logout = require("./actions/logout");
const saveCurve = require("./actions/savecurve");
const deleteCurve = require("./actions/deletecurve");
const getWells = require("./actions/getwells");
const getAllWellsProd = require("./actions/getAllWellsProd");
const getWell = require("./actions/getwell");
const getWellProd = require("./actions/getwellprod");
const getWellSavedCurves = require("./actions/getwellsavedcurves");

// Auth
router.post("/login", login);
router.post("/logout", logout);

// Curves
router.post("/curves", saveCurve);
router.delete("/curves", deleteCurve);

// Wells
router.get("/wells", getWells);
router.get("/wells/:well", getWell);
router.get("/wells/:wellsprod", getAllWellsProd);
router.get("/wells/:well/prod", getWellProd);
router.get("/wells/:well/curves", getWellSavedCurves);

module.exports = router;
