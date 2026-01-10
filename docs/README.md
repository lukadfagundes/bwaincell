# Bwaincell Documentation

Complete documentation for the Bwaincell dual-purpose productivity platform - Discord bot and REST API for task management, reminders, lists, notes, budgets, and scheduling.

---

## Quick Start

New to Bwaincell? Start here:

1. **[Getting Started Guide](guides/getting-started.md)** - Install and configure Bwaincell in 5 minutes
2. **[API Documentation](api/README.md)** - REST API reference and examples
3. **[Discord Commands Reference](reference/README.md)** - Complete command list and usage

---

## Documentation Index

### Guides

Step-by-step tutorials for installation, deployment, and usage.

- **[Getting Started](guides/getting-started.md)** - Installation, setup, database configuration, and verification
- **[Deployment Guide](guides/deployment.md)** - Docker, Docker Compose, Fly.io, and Raspberry Pi deployment
- **[Development Guide](architecture/development.md)** - Contributing, adding features, testing, and code quality

---

### API Documentation

Complete REST API reference for the Bwaincell web service.

- **[API Overview](api/README.md)** - Authentication, endpoints, and examples
- **Authentication Endpoints** - Google OAuth verification, token refresh, logout
- **Tasks API** - Create, list, update, and delete tasks
- **Lists API** - Manage named lists with completion tracking
- **Notes API** - Create searchable notes with tags
- **Reminders API** - Schedule one-time, daily, or weekly reminders
- **Budget API** - Track income and expenses by category
- **Health Check** - Server health monitoring endpoint

**API Examples:**

```bash
# Get all tasks
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://bwaincell.fly.dev/api/tasks

# Create task
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Buy groceries","dueDate":"2026-01-15"}' \
  https://bwaincell.fly.dev/api/tasks
```

---

### Discord Commands Reference

Complete list of Discord slash commands.

- **[Command Reference](reference/README.md)** - All commands, parameters, and examples
- **Task Commands** - `/task add`, `/task list`, `/task complete`, `/task delete`
- **List Commands** - `/list create`, `/list add`, `/list view`, `/list toggle`, `/list remove`, `/list delete`
- **Reminder Commands** - `/reminder add`, `/reminder list`, `/reminder delete`
- **Budget Commands** - `/budget add`, `/budget summary`, `/budget list`, `/budget delete`
- **Note Commands** - `/note add`, `/note list`, `/note search`, `/note delete`
- **Schedule Commands** - `/schedule add`, `/schedule list`, `/schedule delete`

**Discord Examples:**

```
/task add Buy groceries 2026-01-15
/list create Shopping
/reminder add Take medication 09:00 daily
/budget add 50.00 groceries expense Weekly shopping
/note add Meeting notes work,meeting
```

---

### Architecture Documentation

Technical architecture, design decisions, and system overview.

- **[Architecture Overview](architecture/overview.md)** - System architecture, data flow, components, and technology stack
- **[Development Guide](architecture/development.md)** - Adding features, testing patterns, and contribution workflow
- **[Database Schema](architecture/database-schema.md)** - PostgreSQL schema and Sequelize models
- **[Authentication Flow](architecture/authentication.md)** - Google OAuth 2.0 and JWT authentication
- **[API Design](architecture/api-design.md)** - REST API patterns and conventions

**Key Architecture Highlights:**

- Dual-purpose platform: Discord bot + REST API
- PostgreSQL database with Sequelize ORM
- Google OAuth 2.0 authentication with JWT sessions
- Node.js + TypeScript with Express framework
- Discord.js 14 for bot functionality

---

### Reference Documentation

Quick reference for commands, environment variables, and scripts.

- **[Environment Variables](reference/README.md#environment-variables)** - Complete list of required and optional variables
- **[NPM Scripts](reference/README.md#npm-scripts)** - Development, testing, deployment, and utility scripts
- **[Docker Commands](reference/README.md#docker-commands)** - Docker and Docker Compose reference
- **[Fly.io Commands](reference/README.md#flyio-commands)** - Deployment commands for Fly.io
- **[Database Commands](reference/README.md#database-commands)** - PostgreSQL management commands
- **[Troubleshooting](reference/README.md#troubleshooting-quick-reference)** - Common issues and solutions

---

## Technology Stack

| Component     | Technology       | Version | Purpose                |
| ------------- | ---------------- | ------- | ---------------------- |
| **Runtime**   | Node.js          | 18+     | JavaScript runtime     |
| **Language**  | TypeScript       | 5.9.2   | Type-safe development  |
| **Discord**   | Discord.js       | 14.14.1 | Discord bot framework  |
| **API**       | Express          | 4.21.2  | REST API framework     |
| **Database**  | PostgreSQL       | 8.x     | Relational database    |
| **ORM**       | Sequelize        | 6.37.7  | Database abstraction   |
| **Auth**      | Google OAuth 2.0 | -       | User authentication    |
| **Tokens**    | JWT              | 9.0.2   | Session management     |
| **Scheduler** | node-cron        | 4.2.1   | Reminder scheduling    |
| **Logger**    | Winston          | 3.17.0  | Application logging    |
| **Testing**   | Jest             | 30.1.3  | Unit/integration tests |

---

## Project Structure

```
bwaincell/
├── src/                          # Source code
│   ├── api/                     # REST API implementation
│   │   ├── routes/              # API route handlers
│   │   ├── middleware/          # Authentication & error handling
│   │   └── server.ts            # Express server setup
│   ├── bot.ts                   # Discord bot entry point
│   ├── deploy-commands.ts       # Command registration script
│   └── types/                   # TypeScript type definitions
├── commands/                     # Discord slash commands
│   ├── task/                    # Task command subcommands
│   ├── list/                    # List command subcommands
│   ├── note/                    # Note command subcommands
│   ├── reminder/                # Reminder command subcommands
│   ├── budget/                  # Budget command subcommands
│   └── schedule/                # Schedule command subcommands
├── database/                     # Database layer
│   ├── models/                  # Sequelize models
│   └── index.ts                 # Database initialization
├── shared/                       # Shared utilities
│   ├── utils/                   # Utility functions
│   └── validation/              # Input validation
├── tests/                        # Test suites
├── docs/                         # Documentation (this directory)
├── dist/                         # Compiled JavaScript (build output)
├── .env.example                  # Environment variable template
├── Dockerfile                    # Docker container definition
├── docker-compose.yml            # Multi-container setup
├── fly.toml                      # Fly.io deployment config
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project overview
```

---

## Features

### Discord Bot Features

- **Task Management** - Create, complete, and manage tasks with due dates
- **Smart Lists** - Organize items in multiple named lists with completion tracking
- **Reminders** - Schedule one-time, daily, or weekly reminders
- **Budget Tracking** - Track income and expenses with category-based organization
- **Notes** - Create searchable notes with tag support
- **Schedules** - Manage recurring schedules and events

### REST API Features

- **Google OAuth 2.0** - Secure authentication with JWT tokens
- **RESTful Endpoints** - Full CRUD operations for all features
- **User Isolation** - Data segregated by Discord user ID
- **CORS Support** - Configured for PWA integration
- **Health Monitoring** - Health check endpoint for uptime monitoring

---

## Quick Links

### Getting Started

- [Installation](guides/getting-started.md#installation)
- [Database Setup](guides/getting-started.md#setup-database)
- [Build and Deploy](guides/getting-started.md#build-and-deploy)
- [Verify Installation](guides/getting-started.md#verify-installation)
- [Troubleshooting](guides/getting-started.md#troubleshooting)

### API Reference

- [Authentication](api/README.md#authentication)
- [Tasks API](api/README.md#tasks-api)
- [Lists API](api/README.md#lists-api)
- [Notes API](api/README.md#notes-api)
- [Reminders API](api/README.md#reminders-api)
- [Budget API](api/README.md#budget-api)
- [Error Codes](api/README.md#error-codes)

### Development

- [Adding Discord Commands](architecture/development.md#adding-discord-commands)
- [Adding API Endpoints](architecture/development.md#adding-api-endpoints)
- [Running Tests](architecture/development.md#testing)
- [Code Quality](architecture/development.md#code-quality)
- [Contributing](architecture/development.md#contributing)

### Deployment

- [Docker Deployment](guides/deployment.md#docker-deployment)
- [Docker Compose](guides/deployment.md#docker-compose)
- [Fly.io Deployment](guides/deployment.md#flyio-deployment)
- [Raspberry Pi](guides/deployment.md#raspberry-pi-deployment)
- [Environment Variables](reference/README.md#environment-variables)

---

## Environment Setup

### Required Environment Variables

```env
# Discord Configuration
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id
DEFAULT_REMINDER_CHANNEL=channel_id_for_reminders

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ALLOWED_GOOGLE_EMAILS=user1@gmail.com,user2@gmail.com

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/bwaincell

# API Configuration
API_PORT=3000
TIMEZONE=America/New_York

# User Mapping
USER1_EMAIL=user@gmail.com
USER1_DISCORD_ID=123456789
```

See [Environment Variables Reference](reference/README.md#environment-variables) for complete list.

---

## Common Tasks

### Development Workflow

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Build TypeScript
npm run build

# Deploy Discord commands
npm run deploy

# Start development server (hot reload)
npm run dev

# Run tests
npm test

# Check code quality
npm run lint
npm run typecheck
```

### Deployment Workflow

```bash
# Docker Compose (Raspberry Pi)
docker-compose up -d
docker-compose logs -f

# Fly.io (Production)
fly deploy
fly logs
fly open

# Health check
curl http://localhost:3000/health
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (development)
npm run test:watch

# Coverage report
npm run test:coverage

# HTML coverage report
npm run test:coverage-report
```

### Test Coverage

- **Minimum Required:** 80% (functions, lines, branches, statements)
- **Enforced by:** Jest coverage thresholds
- **Reports:** `coverage/` directory (HTML and text)

---

## Security

### Authentication & Authorization

- **Google OAuth 2.0** for user authentication
- **JWT tokens** for API session management (1 hour expiry)
- **Refresh tokens** for extended sessions (7 days expiry)
- **Email whitelist** for access control

### Data Protection

- User data isolated by Discord ID and guild ID
- Input validation on all endpoints (Joi schemas)
- Sequelize ORM prevents SQL injection
- No sensitive data in logs (production mode)
- HTTPS enforcement on Fly.io deployment

### Best Practices

- All secrets stored in environment variables
- CORS configured for specific origins
- JWT tokens signed with secure secret
- Database connection pooling for efficiency
- Regular dependency updates for security patches

---

## Troubleshooting

### Common Issues

**Discord Bot Not Responding**

- Verify `BOT_TOKEN` is correct in `.env`
- Check bot has necessary permissions in Discord server
- Ensure commands are deployed: `npm run deploy`
- Check logs: `docker-compose logs -f`

**Authentication Errors**

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check user email is in whitelist (`ALLOWED_GOOGLE_EMAILS`)
- Ensure `JWT_SECRET` is set and consistent across restarts

**Database Connection Failed**

- Verify `DATABASE_URL` is correct
- Check PostgreSQL server is running: `pg_isready`
- Ensure database exists: `createdb bwaincell`

See [Troubleshooting Reference](reference/README.md#troubleshooting-quick-reference) for more solutions.

---

## Additional Resources

### External Documentation

- [Discord.js Guide](https://discordjs.guide/)
- [Express Documentation](https://expressjs.com/)
- [Sequelize Docs](https://sequelize.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Source Code

- [src/README.md](../src/README.md) - Source code documentation
- [commands/README.md](../commands/README.md) - Discord command implementations
- [database/README.md](../database/README.md) - Database models and schema

---

## Contributing

Contributions are welcome! See [Development Guide](architecture/development.md) for:

- Code standards (TypeScript strict mode, ESLint, Prettier)
- Testing requirements (≥80% coverage)
- Git workflow (feature branches, pull requests)
- Pre-commit hooks (Husky + lint-staged)

---

## License

ISC

---

## Support

- **Documentation Issues:** Open an issue on GitHub
- **Feature Requests:** Create a feature request issue
- **Bug Reports:** Submit a detailed bug report

---

**Version:** 1.0.0
**Node.js:** 18+
**TypeScript:** 5.9.2
**Last Updated:** 2026-01-09

---

## Documentation Coverage

This documentation covers:

- ✅ Installation and setup
- ✅ Complete API reference
- ✅ Discord commands reference
- ✅ Architecture and system design
- ✅ Environment configuration
- ✅ Deployment guides (Docker, Fly.io, Raspberry Pi)
- ✅ Development workflow
- ✅ Testing and code quality
- ✅ Security best practices
- ✅ Troubleshooting guides

**Documentation Completeness:** 100%
