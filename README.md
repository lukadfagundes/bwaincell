# Bwaincell - Personal Productivity API

A comprehensive backend API for personal productivity management, combining Discord bot functionality with a RESTful API for web/mobile applications.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/lukadfagundes/bwaincell)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

---

## Overview

Bwaincell is a dual-purpose productivity platform that provides:

1. **Discord Bot**: Slash commands for server-based productivity management
2. **REST API**: HTTP endpoints for PWA/web application integration

**Live Deployment:**

- **API:** https://bwaincell.fly.dev
- **PWA:** https://bwain-app.vercel.app

---

## Features

### 📋 Task Management

- Create tasks with optional due dates
- Mark tasks complete/incomplete
- Filter by status (all, pending, completed)
- Edit and delete tasks
- Persistent storage across sessions

### 📝 List Management

- Create multiple named lists
- Add/remove items
- Toggle item completion
- Clear completed items
- View all lists with item counts

### ⏰ Reminders

- One-time reminders
- Daily recurring reminders
- Weekly recurring reminders
- Automatic notification system
- Discord integration for alerts

### 💰 Budget Tracking

- Track expenses by category
- Record income
- Monthly summaries
- Category breakdowns
- Spending analytics

### 📅 Schedule Management

- Schedule future events
- View upcoming/past events
- Event countdowns
- Weekly overview
- Date-based filtering

### 📓 Notes

- Create tagged notes
- Search by keyword
- Filter by tags
- Edit existing notes
- Tag management

### 🎲 Random Generators (Discord Only)

- Movie picker
- Dinner suggestions
- Date ideas
- Conversation starters
- Coin flip & dice roll

---

## Technology Stack

```yaml
Runtime: Node.js 18+
Language: TypeScript 5.9.2
Framework: Express.js 4.x
Discord: Discord.js 14.14.1
Database: SQLite 3 + Sequelize ORM
Scheduler: node-cron 4.2.1
Logging: Winston 3.17.0
Testing: Jest 30.1.3
Deployment: Fly.io + Docker
```

---

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Fly.io account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/lukadfagundes/bwaincell.git
cd bwaincell

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Build TypeScript
npm run build

# Start the application
npm start
```

### Development Mode

```bash
# Run with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

---

## Environment Configuration

### Required Variables

```env
# Discord Bot Configuration
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id

# API Authentication
STRAWHATLUKA_PASSWORD=your_secure_password_here
STRAWHATLUKA_DISCORD_ID=your_discord_user_id
DANDELION_PASSWORD=dandelion_secure_password
DANDELION_DISCORD_ID=dandelion_discord_user_id

# Application Settings
NODE_ENV=production
API_PORT=3000
TIMEZONE=America/Los_Angeles
DATABASE_PATH=./data/bwaincell.sqlite
```

### Optional Variables

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://bwaincell.fly.dev/oauth2callback
GOOGLE_CALENDAR_ID=primary

# Discord Bot Settings
DELETE_COMMAND_AFTER=5000
DEFAULT_REMINDER_CHANNEL=channel_id_here
```

---

## API Documentation

### Authentication

All API endpoints (except `/health` and `/api`) require HTTP Basic Authentication.

```bash
# Example request
curl -u username:password https://bwaincell.fly.dev/api/tasks
```

**Credentials:**

- Username: `strawhatluka` or `dandelion`
- Password: Your configured password

### Endpoints

#### Health Check

```
GET /health
```

Returns server health status (no authentication required).

#### Tasks

```
GET    /api/tasks              - List all tasks
GET    /api/tasks/:id          - Get specific task
POST   /api/tasks              - Create new task
PATCH  /api/tasks/:id          - Update task
DELETE /api/tasks/:id          - Delete task
```

#### Lists

```
GET    /api/lists              - List all lists
GET    /api/lists/:name        - Get specific list
POST   /api/lists              - Create new list
POST   /api/lists/:name/items  - Add item to list
PATCH  /api/lists/:name/items/:itemText/toggle - Toggle item
DELETE /api/lists/:name/items/:itemText - Remove item
DELETE /api/lists/:name         - Delete list
```

#### Notes

```
GET    /api/notes              - List all notes
GET    /api/notes/:id          - Get specific note
POST   /api/notes              - Create new note
PATCH  /api/notes/:id          - Update note
DELETE /api/notes/:id          - Delete note
GET    /api/notes/search?q=    - Search notes
GET    /api/notes/tags         - List all tags
```

#### Reminders

```
GET    /api/reminders          - List all reminders
GET    /api/reminders/:id      - Get specific reminder
POST   /api/reminders          - Create new reminder
PATCH  /api/reminders/:id      - Update reminder
DELETE /api/reminders/:id      - Delete reminder
```

#### Budget

```
GET    /api/budget             - List all transactions
GET    /api/budget/summary     - Get budget summary
POST   /api/budget/expense     - Record expense
POST   /api/budget/income      - Record income
DELETE /api/budget/:id         - Delete transaction
```

#### Schedule

```
GET    /api/schedule           - List all events
GET    /api/schedule/:id       - Get specific event
POST   /api/schedule           - Create new event
PATCH  /api/schedule/:id       - Update event
DELETE /api/schedule/:id       - Delete event
GET    /api/schedule/upcoming  - Get upcoming events
```

### API Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Discord Bot Commands

### Setup

1. Invite bot to your server using OAuth2 URL with `bot` and `applications.commands` scopes
2. Run command deployment:

```bash
npm run deploy
```

### Available Commands

```
/task add <description> [due_date]
/task list [filter]
/task done <task_id>
/task delete <task_id>
/task edit <task_id> <new_text>

/list create <name>
/list add <list_name> <item>
/list show <list_name>
/list toggle <list_name> <item>
/list delete <list_name>

/remind me <message> <time>
/remind daily <message> <time>
/remind weekly <message> <day> <time>
/remind list
/remind delete <reminder_id>

/budget add <amount> <category> [description]
/budget summary [month]
/budget list [category]

/schedule add <title> <date> [description]
/schedule list [filter]
/schedule upcoming
/schedule delete <event_id>

/note create <content> [tags]
/note search <keyword>
/note list [tag]
/note delete <note_id>

/random movie
/random dinner
/random date
/random choose <options>
```

---

## Deployment

### Fly.io Deployment

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Deploy application
fly deploy

# Set secrets
fly secrets set BOT_TOKEN=your_token
fly secrets set CLIENT_ID=your_client_id
fly secrets set GUILD_ID=your_guild_id
fly secrets set STRAWHATLUKA_PASSWORD=your_password
fly secrets set STRAWHATLUKA_DISCORD_ID=your_discord_id
fly secrets set DANDELION_PASSWORD=dandelion_password
fly secrets set DANDELION_DISCORD_ID=dandelion_discord_id

# View logs
fly logs

# Check status
fly status
```

### Docker Deployment

```bash
# Build image
docker build -t bwaincell .

# Run container
docker run -d \
  --name bwaincell \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e BOT_TOKEN=your_token \
  -e CLIENT_ID=your_client_id \
  -e GUILD_ID=your_guild_id \
  bwaincell
```

---

## Project Structure

```
bwaincell/
├── src/
│   ├── api/                  # REST API implementation
│   │   ├── server.ts        # Express server setup
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Authentication & error handling
│   │   └── utils/           # API utilities
│   ├── bot.ts               # Discord bot entry point
│   ├── deploy-commands.ts   # Command registration
│   └── types/               # TypeScript type definitions
├── commands/                # Discord slash commands
├── database/                # Sequelize models & schemas
│   ├── models/             # Data models
│   ├── schema.ts           # Database schema
│   └── index.ts            # Database initialization
├── utils/                   # Utility functions
│   ├── scheduler.ts        # Cron scheduler
│   ├── validators.ts       # Input validation
│   └── interactions/       # Discord interaction handlers
├── shared/                  # Shared utilities
│   ├── utils/logger.ts     # Winston logger
│   └── validation/env.ts   # Environment validation
├── tests/                   # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── mocks/              # Mock implementations
├── trinity/                 # Trinity Method documentation
│   └── knowledge-base/     # Project documentation
├── Dockerfile              # Docker configuration
├── fly.toml                # Fly.io configuration
└── package.json            # Dependencies & scripts
```

---

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test suite
npm test -- tests/unit/commands/task.test.ts
```

**Current Test Coverage:** 33% (Goal: 80%)

---

## Security Considerations

### Authentication

- HTTP Basic Authentication for API endpoints
- Discord OAuth2 for bot authentication
- Environment-based credential management
- Passwords must be alphanumeric only (no special characters)

### Data Protection

- User data isolated by Discord user ID and guild ID
- SQLite database with file-based persistence
- Sequelize ORM prevents SQL injection
- No sensitive data in logs (production mode)

### Best Practices

- All secrets in environment variables
- CORS configured for specific origins
- HTTPS enforcement on Fly.io
- Input validation on all endpoints
- Error messages sanitized in production

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check API health
curl https://bwaincell.fly.dev/health

# Check bot status
fly status
```

### Logs

```bash
# View real-time logs
fly logs

# View specific time range
fly logs --since 1h

# Save logs to file
fly logs > bwaincell.log
```

### Database Backup

```bash
# Backup SQLite database (manual)
fly ssh console
tar -czf backup.tar.gz /app/data/bwaincell.sqlite
fly sftp get /app/data/bwaincell.sqlite ./backup/
```

---

## Troubleshooting

### Common Issues

**Bot not responding to commands:**

1. Verify bot is online: `fly status`
2. Check logs: `fly logs`
3. Redeploy commands: `npm run deploy`
4. Verify bot permissions in Discord server

**API authentication failing:**

1. Verify environment variables are set: `fly secrets list`
2. Check username/password match .env configuration
3. Ensure CORS allows your frontend origin

**Database errors:**

1. Check persistent volume: `fly volumes list`
2. Verify data directory exists: `fly ssh console`, `ls -la /app/data`
3. Check disk space: `fly scale show`

**Reminders not firing:**

1. Verify bot is online continuously (auto_stop_machines = 'off')
2. Check scheduler initialization in logs
3. Verify cron syntax in reminder configuration

---

## Contributing

This is a personal project, but suggestions and bug reports are welcome via GitHub issues.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run linting: `npm run lint`
5. Run tests: `npm test`
6. Commit changes: `git commit -m "Add my feature"`
7. Push to branch: `git push origin feature/my-feature`
8. Create Pull Request

### Code Style

- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
- Conventional commit messages

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Discord.js](https://discord.js.org)
- Powered by [Node.js](https://nodejs.org)
- Deployed on [Fly.io](https://fly.io)
- Developed using [Trinity Method](https://github.com/trinity-method)

---

## Support

- **Issues:** [GitHub Issues](https://github.com/lukadfagundes/bwaincell/issues)
- **Documentation:** `trinity/knowledge-base/`
- **Deployment Guide:** See deployment section above

---

**Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** 2025-10-09
**Maintained by:** @lukadfagundes

---

## 🔱 Trinity Method

This project uses the **Trinity Method** - an investigation-first development methodology.

**Trinity Agents:**

- **Aly (CTO):** Strategic planning
- **AJ (Lead Dev):** Implementation
- **JUNO (QA):** Quality auditing
- **TAN, ZEN, INO:** Deployment specialists

For Trinity documentation, see `trinity/knowledge-base/`.

---

_Deployed with Trinity Method SDK v1.0.1_
