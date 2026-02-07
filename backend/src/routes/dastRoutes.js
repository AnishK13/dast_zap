const express = require("express");
const { runDastScan } = require("../controllers/dastController");

const router = express.Router();

// Dynamic Application Security Testing (DAST) scans
router.post("/scan/dast", runDastScan);

module.exports = router;

