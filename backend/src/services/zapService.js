const axios = require("axios");

// ZAP configuration and timeouts
const ZAP_BASE = process.env.ZAP_BASE_URL || "http://localhost:8080";
const ZAP_API_KEY = process.env.ZAP_API_KEY || "";
const POLL_INTERVAL = 2000; // 2 sec so progress logs are frequent
// Full scan: runs to 100% with optional safety cap. Set ZAP_FULL_SCAN_PHASE_MS (0 = no cap, default 600000 = 10 min).
const POLL_TIMEOUT_MS =
  process.env.ZAP_FULL_SCAN_PHASE_MS === undefined ||
  process.env.ZAP_FULL_SCAN_PHASE_MS === ""
    ? 600000
    : Number(process.env.ZAP_FULL_SCAN_PHASE_MS);
// Quick scan: prototype only; stops after N sec per phase. Not for production (see docs/PRODUCTION.md).
const QUICK_SCAN_PHASE_MS = 30000; // 30 sec per phase

const sleep = ms => new Promise(r => setTimeout(r, ms));

function zapParams(params) {
  const p = { ...params };
  if (ZAP_API_KEY) p.apikey = ZAP_API_KEY;
  return p;
}

function wrapZapError(err, context) {
  if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
    throw new Error(
      `ZAP is not reachable at ${ZAP_BASE}. Start ZAP in Docker first. Original: ${err.message}`
    );
  }
  const msg = err.response?.data?.message || err.message;
  throw new Error(`${context}: ${msg}`);
}

async function runZapScan(targetUrl, options = {}) {
  const quickScan = !!options.quickScan;
  // Full scan: run to 100%; optional cap. Quick scan: time-limited (prototype only).
  const spiderMaxMs = quickScan ? QUICK_SCAN_PHASE_MS : POLL_TIMEOUT_MS;
  const ascanMaxMs = quickScan ? QUICK_SCAN_PHASE_MS : POLL_TIMEOUT_MS;
  const useTimeCap = spiderMaxMs > 0; // 0 = no cap, run to 100% only

  console.log(
    `[ZAP] Target: ${targetUrl} | Mode: ${quickScan ? "quick (~1 min)" : "full"}`
  );

  // 1. Spider
  let spiderRes;
  try {
    spiderRes = await axios.get(
      `${ZAP_BASE}/JSON/spider/action/scan/`,
      { params: zapParams({ url: targetUrl, recurse: true }) }
    );
  } catch (err) {
    wrapZapError(err, "Spider start failed");
  }

  const spiderId = spiderRes.data.scan;
  if (spiderId == null) {
    throw new Error("Spider did not start. Check target URL and ZAP logs.");
  }

  console.log("[ZAP] Spider started, polling progress...");
  let spiderProgress = 0;
  const spiderPhaseStart = Date.now();
  while (spiderProgress < 100) {
    if (useTimeCap && Date.now() - spiderPhaseStart > spiderMaxMs) {
      console.log(
        "[ZAP] Spider phase time limit reached, proceeding with current crawl."
      );
      break;
    }
    await sleep(POLL_INTERVAL);
    try {
      const statusRes = await axios.get(
        `${ZAP_BASE}/JSON/spider/view/status/`,
        { params: zapParams({ scanId: spiderId }) }
      );
      spiderProgress = Number(statusRes.data.status) || 0;
      if (spiderProgress < 100) {
        console.log(`[ZAP] Spider: ${spiderProgress}%`);
      }
    } catch (err) {
      wrapZapError(err, "Spider status failed");
    }
  }
  console.log("[ZAP] Spider phase done (100% or time limit).");

  // 2. Active Scan
  let ascanRes;
  try {
    ascanRes = await axios.get(
      `${ZAP_BASE}/JSON/ascan/action/scan/`,
      { params: zapParams({ url: targetUrl, recurse: true }) }
    );
  } catch (err) {
    wrapZapError(err, "Active scan start failed");
  }

  const ascanId = ascanRes.data.scan;
  if (ascanId == null) {
    throw new Error("Active scan did not start. Check target URL and ZAP logs.");
  }

  console.log("[ZAP] Active scan started, polling progress...");
  let ascanProgress = 0;
  const ascanPhaseStart = Date.now();
  while (ascanProgress < 100) {
    if (useTimeCap && Date.now() - ascanPhaseStart > ascanMaxMs) {
      console.log(
        "[ZAP] Active scan phase time limit reached, fetching results."
      );
      break;
    }
    await sleep(POLL_INTERVAL);
    try {
      const statusRes = await axios.get(
        `${ZAP_BASE}/JSON/ascan/view/status/`,
        { params: zapParams({ scanId: ascanId }) }
      );
      ascanProgress = Number(statusRes.data.status) || 0;
      if (ascanProgress < 100) {
        console.log(`[ZAP] Active scan: ${ascanProgress}%`);
      }
    } catch (err) {
      wrapZapError(err, "Active scan status failed");
    }
  }
  console.log("[ZAP] Active scan phase done (100% or time limit).");

  // 3. Fetch results
  console.log("[ZAP] Fetching report...");
  let alertsRes;
  try {
    alertsRes = await axios.get(
      `${ZAP_BASE}/JSON/core/view/alerts/`,
      { params: zapParams({ baseurl: targetUrl }) }
    );
  } catch (err) {
    wrapZapError(err, "Fetch alerts failed");
  }

  const alerts = alertsRes.data?.alerts;
  const count = Array.isArray(alerts) ? alerts.length : 0;
  console.log(`[ZAP] Done. Alerts: ${count}`);
  return Array.isArray(alerts) ? alerts : [];
}

module.exports = { runZapScan };

