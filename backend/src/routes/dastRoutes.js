const express = require("express");
const { runDastScan, runSastScan, runContainerScan } = require("../controllers/scanController");

const router = express.Router();

// Dynamic Application Security Testing (DAST) scans
router.post("/scan/dast", runDastScan);

router.post("/scan/sast", runSastScan);

router.post("/scan/container", runContainerScan);

module.exports = router;

