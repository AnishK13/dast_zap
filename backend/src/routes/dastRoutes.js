const express = require("express");
const { runDastScan, runSastScan, runContainerScan, runAppScan } = require("../controllers/dastController");

const router = express.Router();

router.post("/scan/dast", runDastScan);

router.post("/scan/sast", runSastScan);

router.post("/scan/container", runContainerScan);

router.post("/scan/app", runAppScan);

module.exports = router;