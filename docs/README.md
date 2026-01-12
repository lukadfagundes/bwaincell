# Documentation

Comprehensive documentation for Bwaincell - a unified monorepo productivity platform.

## Documentation Structure

- **[Guides](guides/)** - How-to guides and tutorials
- **[API](api/)** - REST API reference and authentication
- **[Architecture](architecture/)** - System design and tech stack
- **[Reference](reference/)** - CLI commands, environment variables, dependencies

## Quick Start

1. **[Getting Started](guides/getting-started.md)** - Installation and setup
2. **[Architecture Overview](architecture/overview.md)** - System design and tech stack
3. **[API Documentation](api/)** - REST API endpoints and authentication

## Documentation Categories

### Guides

**Getting Started:**

- [Getting Started](guides/getting-started.md) - Installation, configuration, and quick start
- [Troubleshooting](guides/troubleshooting.md) - Comprehensive troubleshooting (40+ issues)

**Advanced Guides:**

- [Security Best Practices](guides/security-best-practices.md) - OWASP Top 10, JWT, OAuth2, secrets management
- [Performance Optimization](guides/performance-optimization.md) - Database, API, frontend optimization
- [Monitoring and Logging](guides/monitoring-and-logging.md) - Winston logger, structured logging, alerting
- [CI/CD Pipeline](guides/ci-cd-pipeline.md) - GitHub Actions, quality gates, automated testing
- [PWA Features](guides/pwa-features.md) - Service workers, offline mode, dark mode
- [Docker Development](guides/docker-development.md) - Multi-stage builds, orchestration, debugging

**Coming Soon:**

- API Development Guide
- Discord Bot Development
- Testing Guide
- Deployment Guide
- Database Migrations

### API Documentation

**Authentication:**

- [API Overview](api/) - Authentication flow and response format
- Google OAuth 2.0 verification
- JWT token management
- Refresh token handling

**Endpoints:**

- Tasks API - Task management (create, list, update, delete)
- Lists API - List management and items
- Notes API - Note-taking and search
- Reminders API - Scheduled reminders
- Budget API - Budget tracking and summaries

**Examples:**

- JavaScript/TypeScript code examples
- Python code examples
- Error handling patterns

### Architecture

**System Architecture:**

- [Architecture Overview](architecture/overview.md) - Complete system design
- Three-Interface Pattern (Discord Bot + REST API + PWA)
- Monorepo Architecture
- Technology Stack

**Technical Details:**

- Database Schema (PostgreSQL + Sequelize)
- Authentication & Authorization (OAuth + JWT)
- User Isolation Strategy
- Deployment Architecture

**Design Decisions:**

- Why Monorepo?
- Why Three Interfaces?
- Why PostgreSQL?
- Why Discord User ID for Auth?

### Reference

**CLI Commands:**

- [Reference Documentation](reference/) - All npm scripts and commands
- Monorepo scripts (dev, build, test, lint)
- Backend scripts (Discord bot, API server)
- Frontend scripts (Next.js, Prisma)
- Docker commands

**Environment Variables:**

- Required variables (Discord, Database, API, Google OAuth)
- Optional variables (Deployment, Application settings)
- How to generate secrets

**Dependencies:**

- Production dependencies (Core, Authentication, Utilities)
- Development dependencies (Testing, TypeScript, Linting)
- Frontend dependencies (Framework, UI, State)

## Documentation Index

**Guides (9):**

- [Getting Started](guides/getting-started.md)
- [Troubleshooting](guides/troubleshooting.md)
- [FAQ](guides/faq.md)
- [Security Best Practices](guides/security-best-practices.md)
- [Performance Optimization](guides/performance-optimization.md)
- [Monitoring and Logging](guides/monitoring-and-logging.md)
- [CI/CD Pipeline](guides/ci-cd-pipeline.md)
- [PWA Features](guides/pwa-features.md)
- [Docker Development](guides/docker-development.md)

**API (2):**

- [API Documentation](api/)
- [Discord Bot Commands](api/discord-commands.md)

**Architecture (3):**

- [Architecture Overview](architecture/overview.md)
- [Database Schema](architecture/database-schema.md)
- [Architecture Diagrams](architecture/diagrams.md)

**Reference (3):**

- [Reference Documentation](reference/)
- [Quick Reference](reference/quick-reference.md)
- [Glossary](reference/glossary.md)

## Additional Resources

### Repository Files

- **[README.md](../README.md)** - Project overview and quick reference
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines
- **[.env.example](../.env.example)** - Environment variable template

### External Links

- **GitHub Repository:** [github.com/lukadfagundes/bwaincell](https://github.com/lukadfagundes/bwaincell)
- **Discord.js Documentation:** [discord.js.org](https://discord.js.org/)
- **Next.js Documentation:** [nextjs.org/docs](https://nextjs.org/docs)
- **Sequelize Documentation:** [sequelize.org](https://sequelize.org/)

## Contributing to Documentation

Documentation improvements are welcome! Please follow these guidelines:

1. Use clear, concise language
2. Include code examples where applicable
3. Link to related documentation
4. Update the index when adding new files
5. Follow Markdown best practices
6. Test all code examples before committing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for general contribution guidelines.

## Documentation Status

✅ **Completed:**

- Getting Started Guide
- Troubleshooting Guide (40+ issues across 6 categories)
- Security Best Practices Guide (OWASP Top 10, JWT, OAuth2, secrets)
- Performance Optimization Guide (database, API, frontend, caching)
- Monitoring and Logging Guide (Winston, structured logging, alerting)
- CI/CD Pipeline Guide (GitHub Actions, quality gates, testing)
- PWA Features Guide (service workers, offline mode, dark mode)
- Docker Development Guide (multi-stage builds, orchestration)
- API Documentation (complete with examples)
- Discord Bot Commands Reference (13 commands)
- Architecture Overview (auto-generated from codebase)
- Database Schema Documentation (6 models with ER diagram)
- Reference Documentation (CLI commands, env vars, dependencies)
- Navigation Structure

📋 **Planned:**

- API Development Guide
- Discord Bot Development Guide
- Testing Guide (unit, integration, E2E)
- Deployment Guide (Raspberry Pi + Vercel)
- Database Migrations Guide

## Support

- **Documentation Issues:** [GitHub Issues](https://github.com/lukadfagundes/bwaincell/issues)
- **Questions:** [GitHub Discussions](https://github.com/lukadfagundes/bwaincell/discussions)
- **Contact:** Via GitHub profile

---

**Last Updated** 2026-01-12
**Version:** 2.0.0
**Maintained by:** [lukadfagundes](https://github.com/lukadfagundes)
