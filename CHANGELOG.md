# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Configured custom subdomain bwaincell.sunny-stack.com for frontend deployment

## [1.0.0] - 2026-01-10

### Added

- **Discord Bot** with slash commands for task management, lists, reminders, budgets, notes, and schedules
- **Task Management** - Create, complete, and manage tasks with due dates via Discord
- **Smart Lists** - Organize items in multiple named lists with completion tracking
- **Reminders** - Schedule one-time, daily, or weekly reminders with automatic Discord notifications
- **Budget Tracking** - Track income and expenses with category-based organization
- **Notes** - Create searchable notes with tag support
- **Schedules** - Manage recurring schedules and events
- **REST API** with Express backend providing CRUD operations for all features
- **Google OAuth 2.0** authentication with JWT token-based session management
- **Next.js Progressive Web App (PWA)** frontend for mobile and desktop access
- **User Isolation** - Data segregated by Discord user ID and guild ID for multi-tenant support
- **CORS Support** configured for PWA integration
- **Health Monitoring** endpoint for uptime tracking
- **npm Workspaces Monorepo** structure with backend, frontend, and shared packages
- **PostgreSQL Database** with Sequelize ORM for data persistence
- **Automatic Reminder Scheduler** using node-cron for recurring reminders
- **Winston Logger** for structured logging with multiple log levels
- **Docker Support** with multi-stage Dockerfile and docker-compose.yml
- **Fly.io Deployment** configuration for production hosting
- **GitHub Actions CI/CD** workflows for automated testing and deployment
- **Comprehensive Test Suite** with Jest (80%+ coverage requirement)
- **Input Validation** using Joi schemas on all API endpoints
- **Rate Limiting** to prevent API abuse
- **Email Whitelist** for access control via environment variables
- **Refresh Token Support** for extended user sessions (7 days)
- **Database Connection Pooling** for improved performance
- **TypeScript Project References** for efficient monorepo builds
- **ESLint and Prettier** for code quality and formatting
- **Husky Pre-commit Hooks** for automated linting and validation

### Security

- Passwords hashed using bcrypt with cost factor of 12
- JWT tokens with 1-hour expiry for access tokens
- Sequelize ORM preventing SQL injection attacks
- HTTPS enforcement on Fly.io deployment
- No sensitive data logged in production mode
- CORS configured for specific origins only

[unreleased]: https://github.com/yourusername/bwaincell/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/bwaincell/releases/tag/v1.0.0
