/**
 * Calculate Readiness Score for PR
 * This script calculates the merge readiness score for a pull request
 */

const fs = require('fs');

// Weights for different metrics
const WEIGHTS = {
  coverage: 0.3, // 30% weight
  tests: 0.25, // 25% weight
  security: 0.25, // 25% weight
  codeQuality: 0.2, // 20% weight
};

// Thresholds
const COVERAGE_THRESHOLD = 80;
const TEST_PASS_THRESHOLD = 100;

function loadDashboardData() {
  const dataPath = 'dashboard-data.json';
  if (fs.existsSync(dataPath)) {
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
  return null;
}

function loadMainBranchData() {
  // In a real scenario, this would fetch main branch data
  // For now, we'll use historical data if available
  const historyPath = 'dashboard-history.json';
  if (fs.existsSync(historyPath)) {
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    const mainData = history.find(entry => entry.branch === 'main' || entry.branch === 'master');
    return mainData || history[history.length - 1];
  }
  return null;
}

function calculateCoverageScore(prData, mainData) {
  const prCoverage = prData.coverage?.overall || 0;
  const mainCoverage = mainData?.coverage?.overall || 0;

  // Check absolute threshold
  if (prCoverage < COVERAGE_THRESHOLD) {
    // Below threshold - scale score based on how far below
    return (prCoverage / COVERAGE_THRESHOLD) * 100;
  }

  // Check relative to main branch
  const coverageDelta = prCoverage - mainCoverage;
  if (coverageDelta >= 0) {
    // Coverage improved or maintained
    return 100;
  } else {
    // Coverage decreased - penalty based on decrease
    return Math.max(0, 100 + coverageDelta * 2);
  }
}

function calculateTestScore(prData) {
  if (!prData.tests || prData.tests.total === 0) {
    // No tests found
    return 0;
  }

  const passRate = (prData.tests.passed / prData.tests.total) * 100;

  if (passRate === TEST_PASS_THRESHOLD) {
    return 100;
  }

  // Scale based on pass rate
  return passRate;
}

function calculateSecurityScore(prData) {
  const security = prData.security;
  if (!security) {
    return 100; // No security data means no known vulnerabilities
  }

  // Use the pre-calculated security score
  if (security.score !== undefined) {
    return security.score;
  }

  // Calculate manually if score not provided
  let score = 100;
  score -= (security.critical || 0) * 25;
  score -= (security.high || 0) * 15;
  score -= (security.medium || 0) * 5;
  score -= (security.low || 0) * 2;
  score -= (security.info || 0) * 0.5;

  return Math.max(0, score);
}

function calculateCodeQualityScore(prData) {
  let score = 100;

  // Check build status
  if (prData.status !== 'success') {
    score -= 50; // Build failure is critical
  }

  // Check for build warnings
  if (prData.build?.warnings && prData.build.warnings > 0) {
    score -= Math.min(30, prData.build.warnings * 5);
  }

  // Check for linting errors (if available)
  if (prData.linting) {
    const lintScore =
      100 - Math.min(50, (prData.linting.errors || 0) * 10 + (prData.linting.warnings || 0) * 2);
    score = (score + lintScore) / 2;
  }

  return Math.max(0, score);
}

function calculateReadinessScore(prData, mainData) {
  const scores = {
    coverage: calculateCoverageScore(prData, mainData),
    tests: calculateTestScore(prData),
    security: calculateSecurityScore(prData),
    codeQuality: calculateCodeQualityScore(prData),
  };

  // Calculate weighted average
  const totalScore =
    scores.coverage * WEIGHTS.coverage +
    scores.tests * WEIGHTS.tests +
    scores.security * WEIGHTS.security +
    scores.codeQuality * WEIGHTS.codeQuality;

  return {
    total: Math.round(totalScore),
    breakdown: scores,
    weights: WEIGHTS,
  };
}

function getReadinessLevel(score) {
  if (score >= 90) return { level: 'excellent', color: 'brightgreen' };
  if (score >= 80) return { level: 'good', color: 'green' };
  if (score >= 70) return { level: 'acceptable', color: 'yellow' };
  if (score >= 60) return { level: 'needs-work', color: 'orange' };
  return { level: 'not-ready', color: 'red' };
}

// Main execution
function main() {
  try {
    const prData = loadDashboardData();
    if (!prData) {
      console.error('Error: Could not load dashboard data');
      process.exit(1);
    }

    const mainData = loadMainBranchData();

    const result = calculateReadinessScore(prData, mainData);
    const level = getReadinessLevel(result.total);

    // Output for GitHub Actions
    console.log(result.total); // Primary output - just the score

    // Detailed output to stderr for debugging
    console.error('=== Readiness Score Calculation ===');
    console.error(`Total Score: ${result.total}%`);
    console.error(`Level: ${level.level}`);
    console.error('');
    console.error('Breakdown:');
    console.error(
      `- Coverage: ${result.breakdown.coverage.toFixed(1)}% (weight: ${WEIGHTS.coverage})`
    );
    console.error(`- Tests: ${result.breakdown.tests.toFixed(1)}% (weight: ${WEIGHTS.tests})`);
    console.error(
      `- Security: ${result.breakdown.security.toFixed(1)}% (weight: ${WEIGHTS.security})`
    );
    console.error(
      `- Code Quality: ${result.breakdown.codeQuality.toFixed(1)}% (weight: ${WEIGHTS.codeQuality})`
    );

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      score: result.total,
      level: level.level,
      color: level.color,
      breakdown: result.breakdown,
      weights: WEIGHTS,
      prData: {
        branch: prData.branch,
        commit: prData.commit,
        coverage: prData.coverage?.overall,
        tests: `${prData.tests?.passed || 0}/${prData.tests?.total || 0}`,
        security: prData.security?.score,
        status: prData.status,
      },
    };

    fs.writeFileSync('readiness-report.json', JSON.stringify(report, null, 2));

    // Exit with appropriate code
    if (result.total < 80) {
      process.exit(1); // Fail if below threshold
    }
    process.exit(0);
  } catch (error) {
    console.error('Error calculating readiness score:', error.message);
    console.log('0'); // Output 0 score on error
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  calculateReadinessScore,
  getReadinessLevel,
};
