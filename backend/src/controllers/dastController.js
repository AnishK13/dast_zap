const { runZapScan } = require("../services/zapService");

/**
 * POST /api/scan/dast
 * Body: { url: string, quickScan?: boolean }
 */
async function runDastScan(req, res) {
  const { url, quickScan } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: "Target URL is required" });
  }

  try {
    console.log(
      `Starting ZAP scan for ${url}${quickScan ? " (quick scan)" : ""}`
    );

    const results = await runZapScan(url, { quickScan: !!quickScan });

    return res.json({
      success: true,
      target: url,
      totalFindings: results.length,
      findings: results
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "ZAP scan failed",
      details: err.message
    });
  }
}

module.exports = {
  runDastScan
};

