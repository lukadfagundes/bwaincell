const fs = require('fs');
const path = require('path');

/**
 * Trinity Dashboard Data Generator
 * Collects CI/CD metrics and generates data for dashboard consumption
 */

// Environment variables from GitHub Actions
const env = {
  GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY || 'trinity-method/trinity-dashboard',
  GITHUB_REF_NAME: process.env.GITHUB_REF_NAME || 'main',
  GITHUB_SHA: process.env.GITHUB_SHA || 'unknown',
  GITHUB_ACTOR: process.env.GITHUB_ACTOR || 'unknown',
  GITHUB_WORKFLOW: process.env.GITHUB_WORKFLOW || 'CI Pipeline',
  GITHUB_RUN_ID: process.env.GITHUB_RUN_ID || '0',
  GITHUB_RUN_NUMBER: process.env.GITHUB_RUN_NUMBER || '0',
  BUILD_STATUS: process.env.BUILD_STATUS || 'success',
};

// Helper functions
function parseCoverage() {
  const coverage = {
    overall: 0,
    javascript: 0,
    python: 0,
    rust: 0,
    lines: 0,
    statements: 0,
    functions: 0,
    branches: 0,
    files: [],
  };

  // Try to parse JavaScript/TypeScript coverage
  try {
    const coverageSummaryPath = path.join('artifacts', 'coverage-report', 'coverage-summary.json');
    if (fs.existsSync(coverageSummaryPath)) {
      const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      if (summary.total) {
        coverage.overall = summary.total.lines?.pct || 0;
        coverage.javascript = summary.total.lines?.pct || 0;
        coverage.lines = summary.total.lines?.pct || 0;
        coverage.statements = summary.total.statements?.pct || 0;
        coverage.functions = summary.total.functions?.pct || 0;
        coverage.branches = summary.total.branches?.pct || 0;
      }

      // Get file-level coverage
      Object.keys(summary).forEach(file => {
        if (file !== 'total') {
          coverage.files.push({
            name: file,
            coverage: summary[file].lines?.pct || 0,
          });
        }
      });
    } else {
      // Try alternative coverage location
      const altCoveragePath = path.join('coverage', 'coverage-summary.json');
      if (fs.existsSync(altCoveragePath)) {
        const summary = JSON.parse(fs.readFileSync(altCoveragePath, 'utf8'));
        if (summary.total) {
          coverage.overall = summary.total.lines?.pct || 0;
          coverage.javascript = summary.total.lines?.pct || 0;
        }
      }
    }
  } catch (error) {
    console.log('Could not parse JavaScript coverage:', error.message);
  }

  // Try to parse Python coverage
  try {
    const pythonCoveragePath = path.join('artifacts', 'python-coverage', 'coverage.json');
    if (fs.existsSync(pythonCoveragePath)) {
      const pythonCov = JSON.parse(fs.readFileSync(pythonCoveragePath, 'utf8'));
      coverage.python = pythonCov.totals?.percent_covered || 0;

      // Update overall if we have multiple language coverages
      if (coverage.javascript > 0 && coverage.python > 0) {
        coverage.overall = (coverage.javascript + coverage.python) / 2;
      } else if (coverage.python > 0) {
        coverage.overall = coverage.python;
      }
    }
  } catch (error) {
    console.log('Could not parse Python coverage:', error.message);
  }

  // Try to parse Rust coverage (if using tarpaulin or similar)
  try {
    const rustCoveragePath = path.join('artifacts', 'rust-coverage', 'cobertura.xml');
    if (fs.existsSync(rustCoveragePath)) {
      // Basic XML parsing for line-rate attribute
      const rustCovXml = fs.readFileSync(rustCoveragePath, 'utf8');
      const lineRateMatch = rustCovXml.match(/line-rate="([0-9.]+)"/);
      if (lineRateMatch) {
        coverage.rust = parseFloat(lineRateMatch[1]) * 100;

        // Update overall with Rust coverage
        const coverages = [coverage.javascript, coverage.python, coverage.rust].filter(c => c > 0);
        if (coverages.length > 0) {
          coverage.overall = coverages.reduce((a, b) => a + b, 0) / coverages.length;
        }
      }
    }
  } catch (error) {
    console.log('Could not parse Rust coverage:', error.message);
  }

  return coverage;
}

function parseTestResults() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    suites: [],
  };

  // Parse Jest/Vitest results
  try {
    const testResultsPath = path.join('test-results.json');
    if (fs.existsSync(testResultsPath)) {
      const testData = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
      results.total = testData.numTotalTests || 0;
      results.passed = testData.numPassedTests || 0;
      results.failed = testData.numFailedTests || 0;
      results.skipped = testData.numPendingTests || 0;
      results.duration =
        testData.testResults?.reduce((sum, suite) => sum + (suite.perfStats?.runtime || 0), 0) || 0;

      if (testData.testResults) {
        results.suites = testData.testResults.map(suite => ({
          name: path.basename(suite.testFilePath || suite.name),
          passed: suite.numPassingTests || 0,
          failed: suite.numFailingTests || 0,
          duration: suite.perfStats?.runtime || 0,
        }));
      }
    }
  } catch (error) {
    console.log('Could not parse test results:', error.message);
  }

  // If no test results found, check for alternative formats
  if (results.total === 0) {
    try {
      // Check for JUnit XML format (common CI output)
      const junitPath = path.join('junit.xml');
      if (fs.existsSync(junitPath)) {
        const junitXml = fs.readFileSync(junitPath, 'utf8');
        const testsMatch = junitXml.match(/tests="([0-9]+)"/);
        const failuresMatch = junitXml.match(/failures="([0-9]+)"/);
        const skippedMatch = junitXml.match(/skipped="([0-9]+)"/);

        if (testsMatch) {
          results.total = parseInt(testsMatch[1]);
          results.failed = parseInt(failuresMatch?.[1] || '0');
          results.skipped = parseInt(skippedMatch?.[1] || '0');
          results.passed = results.total - results.failed - results.skipped;
        }
      }
    } catch (error) {
      console.log('Could not parse JUnit results:', error.message);
    }
  }

  return results;
}

function parseSecurityScans() {
  const security = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0,
    vulnerabilities: [],
  };

  // Parse npm audit results
  try {
    const npmAuditPath = path.join('artifacts', 'security-reports', 'npm-audit.json');
    if (fs.existsSync(npmAuditPath)) {
      const npmAudit = JSON.parse(fs.readFileSync(npmAuditPath, 'utf8'));
      if (npmAudit.metadata?.vulnerabilities) {
        const vulns = npmAudit.metadata.vulnerabilities;
        security.critical += vulns.critical || 0;
        security.high += vulns.high || 0;
        security.medium += vulns.moderate || vulns.medium || 0;
        security.low += vulns.low || 0;
        security.info += vulns.info || 0;
      }
    }
  } catch (error) {
    console.log('Could not parse npm audit:', error.message);
  }

  // Parse pip-audit results
  try {
    const pipAuditPath = path.join('artifacts', 'security-reports', 'pip-audit.json');
    if (fs.existsSync(pipAuditPath)) {
      const pipAudit = JSON.parse(fs.readFileSync(pipAuditPath, 'utf8'));
      if (Array.isArray(pipAudit)) {
        pipAudit.forEach(vuln => {
          // Map severity levels
          const severity = (vuln.severity || '').toLowerCase();
          if (severity === 'critical') security.critical++;
          else if (severity === 'high') security.high++;
          else if (severity === 'medium' || severity === 'moderate') security.medium++;
          else if (severity === 'low') security.low++;
          else security.info++;
        });
      }
    }
  } catch (error) {
    console.log('Could not parse pip-audit:', error.message);
  }

  // Parse cargo audit results
  try {
    const cargoAuditPath = path.join('artifacts', 'security-reports', 'cargo-audit.json');
    if (fs.existsSync(cargoAuditPath)) {
      const cargoAudit = JSON.parse(fs.readFileSync(cargoAuditPath, 'utf8'));
      if (cargoAudit.vulnerabilities?.list) {
        cargoAudit.vulnerabilities.list.forEach(vuln => {
          // Cargo audit uses different severity naming
          if (vuln.advisory?.severity === 'critical') security.critical++;
          else if (vuln.advisory?.severity === 'high') security.high++;
          else if (vuln.advisory?.severity === 'medium') security.medium++;
          else if (vuln.advisory?.severity === 'low') security.low++;
          else security.info++;
        });
      }
    }
  } catch (error) {
    console.log('Could not parse cargo audit:', error.message);
  }

  // Calculate total
  security.total =
    security.critical + security.high + security.medium + security.low + security.info;

  // Calculate security score (100 points minus deductions)
  security.score = Math.max(
    0,
    100 -
      (security.critical * 25 +
        security.high * 15 +
        security.medium * 5 +
        security.low * 2 +
        security.info * 1)
  );

  return security;
}

function parseBuildMetrics() {
  const metrics = {
    duration: 0,
    size: 0,
    files: 0,
    warnings: 0,
    errors: 0,
  };

  // Try to get build duration from GitHub Actions (would need to be passed as env var)
  metrics.duration = parseInt(process.env.BUILD_DURATION || '0');

  // Check build output size
  try {
    const buildDirs = ['dist', 'build', 'target/release'];
    for (const dir of buildDirs) {
      if (fs.existsSync(dir)) {
        const stats = getDirectorySize(dir);
        metrics.size += stats.size;
        metrics.files += stats.files;
      }
    }
  } catch (error) {
    console.log('Could not calculate build size:', error.message);
  }

  return metrics;
}

function getDirectorySize(dir) {
  let size = 0;
  let files = 0;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subDir = getDirectorySize(fullPath);
        size += subDir.size;
        files += subDir.files;
      } else {
        const stats = fs.statSync(fullPath);
        size += stats.size;
        files++;
      }
    }
  } catch (error) {
    console.log(`Error reading directory ${dir}:`, error.message);
  }

  return { size, files };
}

// Main data generation
function generateDashboardData() {
  const timestamp = new Date().toISOString();

  const data = {
    // Metadata
    timestamp,
    repository: env.GITHUB_REPOSITORY.split('/')[1],
    organization: env.GITHUB_REPOSITORY.split('/')[0],
    branch: env.GITHUB_REF_NAME,
    commit: env.GITHUB_SHA.substring(0, 7),
    commitFull: env.GITHUB_SHA,
    status: env.BUILD_STATUS,
    actor: env.GITHUB_ACTOR,
    workflow: env.GITHUB_WORKFLOW,
    runId: env.GITHUB_RUN_ID,
    runNumber: env.GITHUB_RUN_NUMBER,
    runUrl: `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,

    // Metrics
    coverage: parseCoverage(),
    tests: parseTestResults(),
    security: parseSecurityScans(),
    build: parseBuildMetrics(),

    // Health score calculation
    health: null,

    // Additional metadata
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };

  // Calculate health score (0-100)
  const healthFactors = [];

  // Coverage contributes 30%
  if (data.coverage.overall > 0) {
    healthFactors.push(Math.min(data.coverage.overall * 0.3, 30));
  } else {
    healthFactors.push(0);
  }

  // Test pass rate contributes 30%
  if (data.tests.total > 0) {
    const passRate = (data.tests.passed / data.tests.total) * 100;
    healthFactors.push(Math.min(passRate * 0.3, 30));
  } else {
    healthFactors.push(15); // Default if no tests
  }

  // Security score contributes 25%
  healthFactors.push(data.security.score * 0.25);

  // Build success contributes 15%
  healthFactors.push(data.status === 'success' ? 15 : 0);

  // Calculate final health score
  data.health = {
    score: Math.round(healthFactors.reduce((a, b) => a + b, 0)),
    factors: {
      coverage: healthFactors[0],
      tests: healthFactors[1],
      security: healthFactors[2],
      build: healthFactors[3],
    },
    level: null,
  };

  // Determine health level
  if (data.health.score >= 80) {
    data.health.level = 'healthy';
  } else if (data.health.score >= 60) {
    data.health.level = 'warning';
  } else {
    data.health.level = 'critical';
  }

  return data;
}

// Main execution
try {
  console.log('Trinity Dashboard Data Generator');
  console.log('=================================');
  console.log(`Repository: ${env.GITHUB_REPOSITORY}`);
  console.log(`Branch: ${env.GITHUB_REF_NAME}`);
  console.log(`Commit: ${env.GITHUB_SHA.substring(0, 7)}`);
  console.log('');

  const data = generateDashboardData();

  // Save to file
  const outputPath = 'dashboard-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log('Dashboard data generated successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`- Coverage: ${data.coverage.overall.toFixed(1)}%`);
  console.log(`- Tests: ${data.tests.passed}/${data.tests.total} passed`);
  console.log(`- Security Score: ${data.security.score}/100`);
  console.log(`- Health Score: ${data.health.score}/100 (${data.health.level})`);
  console.log('');
  console.log(`Output saved to: ${outputPath}`);

  // Also save a minimal version for quick access
  const minimal = {
    timestamp: data.timestamp,
    repository: data.repository,
    branch: data.branch,
    status: data.status,
    health: data.health.score,
    coverage: data.coverage.overall,
    tests: data.tests.total > 0 ? `${data.tests.passed}/${data.tests.total}` : 'N/A',
    security: data.security.score,
  };

  fs.writeFileSync('dashboard-data-minimal.json', JSON.stringify(minimal, null, 2));
} catch (error) {
  console.error('Error generating dashboard data:', error);

  // Create a minimal fallback file
  const fallback = {
    timestamp: new Date().toISOString(),
    repository: env.GITHUB_REPOSITORY.split('/')[1],
    branch: env.GITHUB_REF_NAME,
    commit: env.GITHUB_SHA.substring(0, 7),
    status: env.BUILD_STATUS || 'unknown',
    error: error.message,
    coverage: { overall: 0 },
    tests: { total: 0, passed: 0, failed: 0 },
    security: { critical: 0, high: 0, medium: 0, low: 0, score: 100 },
    health: { score: 0, level: 'unknown' },
  };

  fs.writeFileSync('dashboard-data.json', JSON.stringify(fallback, null, 2));
  console.log('Created fallback dashboard data due to error');

  // Exit with error
  process.exit(1);
}
