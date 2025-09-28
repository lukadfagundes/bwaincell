# CI/CD Pipeline Documentation - Bwaincell Discord Bot

## Overview

This repository uses GitHub Actions for continuous integration and deployment of the Bwaincell Discord bot.

## Workflows

### Main CI Pipeline (.github/workflows/ci.yml)

- **Triggers**: Push to main/dev/develop, pull requests to main, manual dispatch
- **Jobs**:
  - **Node.js CI**: TypeScript compilation, linting, testing, security audit
  - **Bot Deployment Check**: Discord-specific validations and asset generation
  - **Deploy Dashboard Data**: Publishes metrics to GitHub Pages
  - **CI Summary**: Generates comprehensive pipeline reports

### Security Scanning (.github/workflows/codeql.yml)

- **CodeQL Analysis**: Automated security vulnerability detection
- **Languages**: JavaScript/TypeScript
- **Schedule**: Weekly runs + on push/PR events
- **Queries**: Security and quality analysis

### Markdown Linting (.github/workflows/markdown-lint.yml)

- **Purpose**: Ensures documentation quality
- **Target**: All markdown files in repository
- **Runs**: On documentation changes

## Discord Bot Specific Features

### Token Security Scanning

- Scans for exposed Discord bot tokens using pattern detection
- Excludes build directories and logs from scanning
- Prevents accidental token commits

### TypeScript Build Validation

- Compiles TypeScript to JavaScript in `dist/` directory
- Verifies Discord command deployment scripts exist
- Validates bot asset generation process

### Bot Command Verification

- Checks for `dist/src/deploy-commands.js` after build
- Ensures Discord command registration is possible
- Provides warnings for missing deployment scripts

## Configuration

### Permissions

All workflows are configured with comprehensive permissions:

- `contents: write` - For artifact uploads and deployments
- `pages: write` - For GitHub Pages deployment
- `security-events: write` - For security scanning results
- `id-token: write` - For OIDC authentication
- `actions: read` - For workflow access
- `checks: write` - For status checks
- `pull-requests: write` - For PR annotations

### Module System

This project uses **CommonJS**. All scripts use `require` syntax.

### Environment Variables

- `NODE_VERSION: '18'` - Node.js runtime version
- `MERGE_THRESHOLD: 80` - Minimum score for PR merge approval
- `CACHE_VERSION: v1` - Cache invalidation control

## Artifacts and Reports

### Generated Artifacts

1. **Coverage Reports** - Test coverage analysis and HTML reports
2. **Security Reports** - npm audit results and vulnerability scans
3. **Dashboard Data** - Metrics for project health visualization
4. **Bot Build Artifacts** - Compiled TypeScript and deployment assets

### GitHub Pages Deployment

- **URL**: Repository GitHub Pages site under `/data` path
- **Content**: Coverage reports, dashboard metrics, CI artifacts
- **Update**: Automatic on main branch pushes

## Merge Gates and Quality Control

### PR Readiness Scoring

- **Coverage Threshold**: 80% minimum line coverage
- **Quality Gates**: ESLint, TypeScript compilation, tests
- **Security Checks**: Dependency audit, token scanning
- **Visual Indicators**: PR badges showing readiness percentage

### Automated Annotations

- **Coverage Warnings**: Files below 80% coverage threshold
- **Security Alerts**: Vulnerability findings and audit results
- **Build Status**: TypeScript compilation and Discord bot validation

## Troubleshooting

### Common Issues

1. **TypeScript Compilation Failures**
   - Check `tsconfig.json` configuration
   - Verify all dependencies are installed
   - Review type definitions and imports

2. **Discord Token Detection Warnings**
   - Ensure no bot tokens in source code
   - Use environment variables for secrets
   - Check `.env` files are gitignored

3. **Coverage Below Threshold**
   - Add tests for uncovered code paths
   - Review coverage reports in artifacts
   - Consider adjusting threshold if appropriate

4. **Deploy Commands Missing**
   - Verify `src/deploy-commands.ts` exists
   - Check TypeScript compilation includes all files
   - Ensure build script processes Discord commands

### Security Scan Failures

- Some security tools may timeout on first run
- Check for `continue-on-error: true` for non-critical scans
- Review SARIF reports in Security tab

## Maintenance

### Regular Tasks

- Review and update Node.js version quarterly
- Monitor security scan results weekly
- Update workflow actions to latest versions monthly
- Review coverage thresholds and quality gates

### Dependency Management

- `npm audit` runs automatically on every CI
- Dependabot integration recommended for updates
- Pin major versions in package.json for stability

### Bot-Specific Maintenance

- Update Discord.js library regularly for security
- Test command deployment in staging environment
- Monitor bot uptime and error rates
- Validate asset generation after dependency updates

## Success Metrics

### Pipeline Health Indicators

- ✅ All workflows pass without errors
- ✅ Coverage meets or exceeds 80% threshold
- ✅ Security scans show no critical vulnerabilities
- ✅ TypeScript compilation succeeds
- ✅ Discord commands deploy successfully
- ✅ Bot assets generate without errors

### Performance Targets

- **Build Time**: < 5 minutes for full pipeline
- **Test Execution**: < 2 minutes for test suite
- **Security Scan**: < 3 minutes for complete analysis
- **Deployment**: < 1 minute for artifact publishing

---

## Getting Started

### First Time Setup

1. Ensure all required secrets are configured
2. Verify GitHub Pages is enabled for the repository
3. Check that branch protection rules allow CI/CD
4. Run initial pipeline to establish baselines

### Development Workflow

1. Create feature branch from `dev`
2. Make changes and commit (triggers CI)
3. Monitor PR checks and coverage reports
4. Address any failing checks or low coverage
5. Merge when all gates pass

---

Generated by Trinity Method CI/CD Deployment v2.0
**Last Updated**: 2025-09-27
**Framework**: Node.js/TypeScript Discord Bot
**Module System**: CommonJS
