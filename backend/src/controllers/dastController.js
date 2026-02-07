const path = require("path");
const fs = require("fs").promises;
const { runZapScan } = require("../services/zapService");
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const cors = require("cors");

async function runDastScan(req, res) {
  const { url, quickScan } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: "Target URL is required" });
  }

  const scanId = Date.now().toString();
  const dastResultsDir = path.resolve(__dirname, "..", "scans", "dast_results");

  try {
    await fs.mkdir(dastResultsDir, { recursive: true });

    console.log(
      `Starting ZAP scan for ${url}${quickScan ? " (quick scan)" : ""}`
    );

    const findings = await runZapScan(url, { quickScan: !!quickScan });

    const report = {
      success: true,
      scanId,
      target: url,
      totalFindings: findings.length,
      findings
    };

    const reportFileName = `zap-report-${scanId}.json`;
    const reportPath = path.join(dastResultsDir, reportFileName);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`[DAST] Report saved to ${reportPath}`);

    return res.json(report);
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
  const workDir = path.resolve(__dirname, "..", "scans", scanId);
  const reportsDir = path.join(workDir, "reports");
  const repoPath = path.join(workDir, "repo");
  const sastResultsDir = path.resolve(__dirname, "..", "scans", "sast_results");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(reportsDir, { recursive: true });
    await fs.mkdir(sastResultsDir, { recursive: true });

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

    const jsonContent = await fs.readFile(path.join(reportsDir, reportFile), "utf-8");
    const jsonReport = JSON.parse(jsonContent);
    console.log(jsonReport);

    const report = {
      success: true,
      scanId,
      repoUrl,
      jsonReport,
      summary: {
        totalFindings: jsonReport.results?.length || 0,
        errors: jsonReport.errors?.length || 0,
        pathsScanned: jsonReport.paths?.scanned?.length || 0
      }
    };

    const sastReportFileName = `semgrep-report-${scanId}.json`;
    const sastReportPath = path.join(sastResultsDir, sastReportFileName);
    await fs.writeFile(sastReportPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`[SAST] Report saved to ${sastReportPath}`);

    res.json(report);

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
  const workDir = path.resolve(__dirname, "..", "scans", `trivy-${scanId}`);
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

async function runAppScan(req, res) {
  const apkPath = req?.file?.path;
  const originalName = req?.file?.originalname || 'app.apk';

  if (!apkPath) {
    return res.status(400).json({ error: 'APK file is required' });
  }

  const scanId = Date.now().toString();
  const workDir = path.resolve(__dirname, "..", "scans", `mobsf-${scanId}`);
  const reportsDir = path.join(workDir, 'reports');
  const reportFile = 'mobsf-report.json';
  const reportPath = path.join(reportsDir, reportFile);

  try {
    await fs.mkdir(reportsDir, { recursive: true });

    await execPromise('docker pull opensecurity/mobile-security-framework-mobsf:latest');

    const dockerCmd = `docker run --rm \
      -v "${apkPath}:/app/${originalName}" \
      -v "${reportsDir}:/reports" \
      opensecurity/mobile-security-framework-mobsf:latest \
      /bin/bash -lc "python3 manage.py scan_app -f /app/${originalName} -o /reports/${reportFile}"`;

    await execPromise(dockerCmd, { timeout: 600000, maxBuffer: 1024 * 1024 * 20 });

    const jsonContent = await fs.readFile(reportPath, 'utf-8');
    const jsonReport = JSON.parse(jsonContent);

    return res.json({
      success: true,
      scanId,
      file: originalName,
      summary: {
        findings: jsonReport?.findings ? Object.keys(jsonReport.findings).length : 0,
        warnings: jsonReport?.warnings ? Object.keys(jsonReport.warnings).length : 0
      },
      report: jsonReport
    });
  } catch (error) {
    console.error('MobSF Scan error:', error);
    return res.status(500).json({
      error: 'App scan failed',
      details: error.message
    });
  } finally {
    // await fs.rm(workDir, { recursive: true, force: true });
  }
}

module.exports = {
  runSastScan,
  runDastScan,
  runContainerScan,
  runAppScan
};

