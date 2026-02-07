const path = require("path");
const fs = require("fs").promises;
const { runZapScan } = require("../services/zapService");
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs').promises;
const execPromise = util.promisify(exec);
const cors = require("cors");

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

async function runSastScan(req, res) {
  const { repoUrl, gitUsername, gitToken, semgrepToken, branch = 'main' } = req.body;

  if (!repoUrl || !semgrepToken) {
    return res.status(400).json({ error: 'Repository URL and Semgrep token are required' });
  }

  const scanId = Date.now().toString();
  const workDir = path.resolve(__dirname, 'scans', scanId);
  const reportsDir = path.join(workDir, 'reports');
  const repoPath = path.join(workDir, 'repo');

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(reportsDir, { recursive: true });

    //Build Auth URL
    let authRepoUrl = repoUrl;
    if (gitUsername && gitToken) {
      const url = new URL(repoUrl);
      authRepoUrl = `${url.protocol}//${gitUsername}:${gitToken}@${url.host}${url.pathname}`;
    }

    console.log(`Cloning into: ${repoPath}`);
    await execPromise(`git clone --depth 1 --branch ${branch} ${authRepoUrl} .`, { cwd: repoPath });

    console.log('Running Semgrep scan...');

    // -w /src: Sets the working directory inside the container
    // --user $(id -u): Optional, ensures the report file isn't owned by 'root'
    const reportFile = 'semgrep-report.json';
    const dockerCmd = `docker run --rm \
      -v "${repoPath}:/src" \
      -v "${reportsDir}:/reports" \
      -w /src \
      -e SEMGREP_APP_TOKEN=${semgrepToken} \
      semgrep/semgrep:latest \
      semgrep scan --config auto --json --output /reports/${reportFile}`;

    try {
      
      await execPromise(dockerCmd, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 });
      console.log("Semgrep finished with 0 findings.");
    } catch (cmdError) {
      //Semgrep returns 1 if findings are found; we only throw if the file is missing
      const reportPath = path.join(reportsDir, reportFile);
      try {
        await fs.access(reportPath);
        console.log('Semgrep completed with findings.');
      } catch (e) {
        throw new Error(`Semgrep failed and no report was generated: ${cmdError.message}`);
      }
    }

    const jsonContent = await fs.readFile(path.join(reportsDir, reportFile), 'utf-8');
    const jsonReport = JSON.parse(jsonContent);
    console.log(jsonReport);

    res.json({
      success: true,
      scanId,
      jsonReport,
      summary: {
        totalFindings: jsonReport.results?.length || 0,
        errors: jsonReport.errors?.length || 0,
        pathsScanned: jsonReport.paths?.scanned?.length || 0
      }
    });

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ 
      error: 'Scan failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
  finally {
     await fs.rm(repoPath, { recursive: true });
  }
};

async function runContainerScan(req, res) {
  const { imageName } = req.body;

  if (!imageName) {
    return res.status(400).json({ error: 'Image name (e.g., "alpine:latest") is required' });
  }

  const scanId = Date.now().toString();
  const workDir = path.resolve(__dirname, 'scans', `trivy-${scanId}`);
  const reportsDir = path.join(workDir, 'reports');
  const reportFile = 'trivy-report.json';
  const reportPath = path.join(reportsDir, reportFile);

  try {
    // 1. Create directory for the report
    await fs.mkdir(reportsDir, { recursive: true });

    console.log(`Starting Trivy scan for image: ${imageName}`);

    const dockerCmd = `docker run --rm \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v "${reportsDir}:/reports" \
      -v trivy-cache:/root/.cache/ \
      aquasec/trivy:latest \
      image --format json --output /reports/${reportFile} \
      --scanners vuln,misconfig \
      --image-config-scanners misconfig \
      ${imageName}`;

    await execPromise(dockerCmd, { timeout: 300000, maxBuffer: 1024 * 1024 * 20 });

    // 3. Read and Parse the report
    const jsonContent = await fs.readFile(reportPath, 'utf-8');
    const jsonReport = JSON.parse(jsonContent);

    // 4. Summarize Results
    let totalVulnerabilities = 0;
    let totalMisconfigs = 0;

    if (jsonReport.Results) {
      jsonReport.Results.forEach(res => {
        totalVulnerabilities += res.Vulnerabilities?.length || 0;
        totalMisconfigs += res.Misconfigurations?.length || 0;
      });
    }

    res.json({
      success: true,
      scanId,
      image: imageName,
      summary: {
        totalVulnerabilities,
        totalMisconfigs,
      },
      details: jsonReport.Results 
    });

  } catch (error) {
    console.error('Trivy Scan error:', error);
    res.status(500).json({ 
      error: 'Container scan failed', 
      details: error.message 
    });
  } finally {
    // await fs.rm(workDir, { recursive: true, force: true });
  }
};

module.exports = {
  runSastScan,
  runDastScan,
  runContainerScan
};

