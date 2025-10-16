# Bwaincell - Personal Productivity API

A comprehensive backend API for personal productivity management, combining Discord bot functionality with a RESTful API for web/mobile applications.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/lukadfagundes/bwaincell)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

---

**_A note before you begin_**

Bwaincell is a Discord bot that works to also serve information to the Bwain.app companion app I built, I'll provide the link to it below. The bot and app were developed for personal use for me and my wife and my iteration of it won't be available to access publically, however, feel free to tinker and make it your own!

https://github.com/lukadfagundes/bwain.app

## Overview

Bwaincell is a dual-purpose productivity platform that provides:

1. **Discord Bot**: Slash commands for server-based productivity management
2. **REST API**: Secure HTTP endpoints with Google OAuth 2.0 authentication for PWA/web integration

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
- Weekly recurring reminders (with day selection)
- Automatic notification system
- Discord integration for alerts

### 💰 Budget Tracking

- Track expenses by category
- Record income
- Monthly summaries
- Category breakdowns
- Spending analytics

### 📓 Notes

- Create tagged notes
- Search by keyword with Enter-to-search
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
Authentication: Google OAuth 2.0 + JWT
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
- Google OAuth 2.0 Credentials ([Google Cloud Console](https://console.cloud.google.com))
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

# Discord User IDs (for multi-user support)
STRAWHATLUKA_DISCORD_ID=your_discord_user_id
DANDELION_DISCORD_ID=dandelion_discord_user_id

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
ALLOWED_GOOGLE_EMAILS=user1@gmail.com,user2@gmail.com

# JWT Configuration
JWT_SECRET=generate_with_openssl_rand_base64_32

# API Server
API_PORT=3000

# Application Settings
NODE_ENV=production
TIMEZONE=America/Los_Angeles
DATABASE_PATH=./data/bwaincell.sqlite
```

### Optional Variables

```env
# Discord Bot Settings
DELETE_COMMAND_AFTER=5000
DEFAULT_REMINDER_CHANNEL=channel_id_here
```

---

## API Documentation

### Authentication

The API uses **Google OAuth 2.0** with JWT bearer tokens.

#### OAuth Flow

1. Frontend redirects user to Google OAuth
2. User authenticates with Google
3. Backend verifies Google ID token
4. Backend generates JWT access token
5. Frontend uses JWT for API requests

#### Making Authenticated Requests

```bash
# Include JWT token in Authorization header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://bwaincell.fly.dev/api/tasks
```

### OAuth Endpoints

```
POST   /api/auth/google/verify  - Verify Google ID token and get JWT
POST   /api/auth/refresh        - Refresh expired JWT token
POST   /api/auth/logout         - Invalidate refresh token
```

### API Endpoints

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
PATCH  /api/tasks/:id          - Update task (supports completed toggle)
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
GET    /api/notes?search=query - Search notes
GET    /api/notes/:id          - Get specific note
POST   /api/notes              - Create new note
PATCH  /api/notes/:id          - Update note
DELETE /api/notes/:id          - Delete note
```

#### Reminders

```
GET    /api/reminders          - List all reminders
GET    /api/reminders/:id      - Get specific reminder
POST   /api/reminders          - Create new reminder
DELETE /api/reminders/:id      - Delete reminder
```

**Reminder Creation:**

```json
{
  "message": "Reminder message",
  "time": "09:00",
  "frequency": "once|daily|weekly",
  "dayOfWeek": 0-6  // Required for weekly (0=Sunday, 6=Saturday)
}
```

#### Budget

```
GET    /api/budget/transactions     - List all transactions
GET    /api/budget/summary          - Get budget summary
POST   /api/budget/transactions     - Create transaction
DELETE /api/budget/transactions/:id - Delete transaction
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
fly secrets set STRAWHATLUKA_DISCORD_ID=your_discord_id
fly secrets set DANDELION_DISCORD_ID=dandelion_discord_id
fly secrets set GOOGLE_CLIENT_ID=your_google_client_id
fly secrets set GOOGLE_CLIENT_SECRET=your_google_client_secret
fly secrets set ALLOWED_GOOGLE_EMAILS=user1@gmail.com,user2@gmail.com
fly secrets set JWT_SECRET=your_jwt_secret

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
  -e GOOGLE_CLIENT_ID=your_google_client_id \
  -e GOOGLE_CLIENT_SECRET=your_google_client_secret \
  -e JWT_SECRET=your_jwt_secret \
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
│   │   │   ├── oauth.ts    # OAuth authentication
│   │   │   ├── tasks.ts    # Task endpoints
│   │   │   ├── lists.ts    # List endpoints
│   │   │   ├── notes.ts    # Note endpoints
│   │   │   ├── reminders.ts # Reminder endpoints
│   │   │   └── budget.ts   # Budget endpoints
│   │   ├── middleware/      # Authentication & error handling
│   │   │   └── oauth.ts    # JWT verification
│   │   └── utils/           # API utilities
│   ├── bot.ts               # Discord bot entry point
│   ├── deploy-commands.ts   # Command registration
│   └── types/               # TypeScript type definitions
├── commands/                # Discord slash commands
├── database/                # Sequelize models & schemas
│   ├── models/             # Data models (User, Task, List, etc.)
│   ├── schema.ts           # Database schema
│   └── index.ts            # Database initialization
├── utils/                   # Utility functions
│   ├── scheduler.ts        # Cron scheduler for reminders
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

**Test Coverage:** Unit and integration tests covering critical paths

**Browser Compatibility:**

- ✅ Chrome/Edge (Windows, macOS)
- ✅ Safari (macOS, iOS PWA)
- ✅ Firefox (Windows, macOS)

---

## Security Considerations

### Authentication

- Google OAuth 2.0 for user authentication
- JWT tokens for API session management
- Environment-based credential management
- Email whitelist for access control

### Data Protection

- User data isolated by Discord user ID and guild ID
- SQLite database with file-based persistence
- Sequelize ORM prevents SQL injection
- No sensitive data in logs (production mode)

### Best Practices

- All secrets in environment variables
- CORS configured for specific origins (localhost, Vercel)
- HTTPS enforcement on Fly.io
- Input validation on all endpoints
- Error messages sanitized in production
- JWT tokens expire after 1 hour
- Refresh tokens expire after 7 days

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

1. Verify Google OAuth credentials are correct
2. Check JWT_SECRET is set: `fly secrets list`
3. Ensure user email is in ALLOWED_GOOGLE_EMAILS
4. Verify CORS allows your frontend origin

**Database errors with "undefined user_id":**

1. Delete local database: `rm data/bwaincell.sqlite`
2. Ensure environment variables are set (STRAWHATLUKA_DISCORD_ID, etc.)
3. Restart server and sign in again via OAuth

**Mac development issues:**

1. Run `npm run build` before `npm run dev`
2. Ensure all environment variables are in `.env`
3. Check Node.js version: `node --version` (must be 18+)

**Reminders not firing:**

1. Verify bot is online continuously (auto_stop_machines = 'off')
2. Check scheduler initialization in logs
3. Verify cron syntax in reminder configuration

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Start

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
- Authentication by [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
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

Created by a man who loves his wife.

Luka Fagundes

## 🔱 Trinity Method

This project uses the **Trinity Method** - an investigation-first development methodology powered by AI agents.

### Quick Commands

#### Leadership Team

- **Aly (CTO)** - Strategic planning and work order creation

  ```bash
  /trinity-aly
  ```

- **AJ (Implementation Lead)** - Code execution and implementation
  ```bash
  /trinity-aj
  ```

#### Deployment Team

- **TAN (Structure Specialist)** - Directory architecture and organization

  ```bash
  /trinity-tan
  ```

- **ZEN (Knowledge Specialist)** - Documentation and knowledge base

  ```bash
  /trinity-zen
  ```

- **INO (Context Specialist)** - Codebase analysis and context building

  ```bash
  /trinity-ino
  ```

- **Ein (CI/CD Specialist)** - Continuous integration and deployment automation
  ```bash
  /trinity-ein
  ```

#### Audit Team

- **JUNO (Auditor)** - Quality assurance and comprehensive auditing
  ```bash
  /trinity-juno
  ```

### Documentation

All project knowledge is maintained in `trinity/knowledge-base/`:

- **ARCHITECTURE.md** - System design and technical decisions
- **ISSUES.md** - Known problems and their status
- **To-do.md** - Task tracking and priorities
- **Technical-Debt.md** - Debt management and refactoring plans
- **Trinity.md** - Trinity Method guidelines and protocols

### Session Management

Trinity Method uses investigation-first approach:

1. **Assess** - Understand current state
2. **Investigate** - Deep dive into root causes
3. **Plan** - Create comprehensive strategy
4. **Execute** - Implement with precision
5. **Verify** - Confirm success criteria met

Session archives are stored in `trinity/sessions/` for historical reference.

### Project Info

- **Framework:** Express
- **Trinity Version:** 1.0.0
- **Agent Configuration:** `.claude/`
- **Knowledge Base:** `trinity/knowledge-base/`

### Getting Started

1. Review the [Employee Directory](.claude/EMPLOYEE-DIRECTORY.md) for agent details
2. Check [Trinity.md](trinity/knowledge-base/Trinity.md) for methodology guidelines
3. Open Claude Code and invoke agents as needed
4. Agents automatically access project context and documentation

---

_Deployed with Trinity Method SDK v1.0.0_
