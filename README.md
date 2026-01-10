# Bwaincell

A unified monorepo productivity platform providing Discord bot functionality, a secure REST API, and a Next.js Progressive Web App for task management, reminders, lists, notes, budgets, and scheduling.

**Architecture**: npm workspaces monorepo with backend (Discord bot + API), frontend (PWA), and shared types.

---

## Features

### Discord Bot

- **Task Management** - Create, complete, and manage tasks with due dates
- **Smart Lists** - Organize items in multiple named lists with completion tracking
- **Reminders** - Schedule one-time, daily, or weekly reminders
- **Budget Tracking** - Track income and expenses with category-based organization
- **Notes** - Create searchable notes with tag support
- **Schedules** - Manage recurring schedules and events

### REST API

- **Google OAuth 2.0** - Secure authentication with JWT tokens
- **RESTful Endpoints** - Full CRUD operations for all features
- **User Isolation** - Data segregated by Discord user ID
- **CORS Support** - Configured for PWA integration
- **Health Monitoring** - Health check endpoint for uptime monitoring

---

## Technology Stack

| Component          | Technology             | Version |
| ------------------ | ---------------------- | ------- |
| **Monorepo**       | npm workspaces         | -       |
| **Runtime**        | Node.js                | 18+     |
| **Language**       | TypeScript             | 5.9.2   |
| **Discord**        | Discord.js             | 14.14.1 |
| **Frontend**       | Next.js (PWA)          | 14.2    |
| **API Framework**  | Express                | 4.x     |
| **Database**       | PostgreSQL             | 15      |
| **ORM**            | Sequelize              | 6.37.7  |
| **Authentication** | Google OAuth 2.0 + JWT | -       |
| **Scheduler**      | node-cron              | 4.2.1   |
| **Logging**        | Winston                | 3.17.0  |

---

## Monorepo Structure

This project uses npm workspaces with three packages:

- **backend/** - Discord.js bot + Express API (port 3000)
- **frontend/** - Next.js Progressive Web App (port 3010)
- **shared/** - Shared TypeScript types and utilities

See [MIGRATION.md](MIGRATION.md) for detailed migration documentation.

---

## Installation

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 8+ database
- Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- Google OAuth 2.0 credentials ([Google Cloud Console](https://console.cloud.google.com/))

### Setup

1. **Clone Repository**

   ```bash
   git clone https://github.com/yourusername/bwaincell.git
   cd bwaincell
   ```

2. **Install Dependencies** (all workspaces)

   ```bash
   npm install
   # Postinstall hook automatically builds shared package
   ```

3. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:

   ```env
   # Discord Configuration
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_client_id
   GUILD_ID=your_discord_guild_id
   REMINDER_CHANNEL_ID=channel_id_for_reminders

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret

   # Database Configuration
   DATABASE_URL=postgresql://user:password@localhost:5432/bwaincell

   # API Configuration
   API_PORT=3000
   TIMEZONE=America/New_York

   # User Mapping (Discord ID to Email)
   USER1_EMAIL=user@gmail.com
   USER1_DISCORD_ID=123456789
   ```

4. **Build TypeScript**

   ```bash
   npm run build
   ```

5. **Deploy Discord Commands**

   ```bash
   npm run deploy
   ```

6. **Start Application**

   ```bash
   # Development mode (starts both backend and frontend)
   npm run dev
   # Backend: http://localhost:3000
   # Frontend: http://localhost:3010

   # Production mode (backend only)
   npm start
   ```

---

## Discord Commands

### Task Management

- `/task add <text> [due_date]` - Create a new task
- `/task list` - View all active tasks
- `/task complete <task_id>` - Mark task as complete
- `/task delete <task_id>` - Delete a task

### List Management

- `/list create <name>` - Create a new list
- `/list add <list_name> <item>` - Add item to list
- `/list view <list_name>` - View list items
- `/list toggle <list_name> <item>` - Toggle item completion
- `/list remove <list_name> <item>` - Remove item from list
- `/list delete <list_name>` - Delete entire list
- `/list all` - View all lists

### Reminders

- `/reminder add <message> <time> <frequency> [day_of_week]` - Create reminder
  - **Frequency:** `once`, `daily`, `weekly`
  - **Day of Week:** 0-6 (0=Sunday) for weekly reminders
- `/reminder list` - View all active reminders
- `/reminder delete <reminder_id>` - Delete a reminder

### Budget Tracking

- `/budget add <amount> <category> <type> [description]` - Add transaction
  - **Type:** `expense` or `income`
- `/budget summary [month]` - View budget summary (format: YYYY-MM)
- `/budget list` - View all transactions
- `/budget delete <transaction_id>` - Delete transaction

### Notes

- `/note add <content> [tags]` - Create a note
- `/note list` - View all notes
- `/note search <keyword>` - Search notes by keyword
- `/note delete <note_id>` - Delete a note

---

## REST API Documentation

### Base URL

```
Production: https://bwaincell.fly.dev
Development: http://localhost:3000
```

### Authentication

All API endpoints (except `/health` and `/api/auth/*`) require JWT authentication.

**Authentication Flow:**

1. User authenticates with Google OAuth (frontend)
2. Frontend sends Google ID token to `/api/auth/google/verify`
3. Backend verifies token and returns JWT access token (1 hour expiry)
4. Frontend includes JWT in Authorization header for subsequent requests

**Request Header:**

```
Authorization: Bearer <JWT_TOKEN>
```

---

### Endpoints

#### Authentication

**Verify Google Token**

```http
POST /api/auth/google/verify
Content-Type: application/json

{
  "token": "google_id_token"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600
  }
}
```

**Refresh Token**

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

**Logout**

```http
POST /api/auth/logout
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### Tasks

**List All Tasks**

```http
GET /api/tasks
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "text": "Buy groceries",
      "completed": false,
      "dueDate": "2026-01-15",
      "createdAt": "2026-01-09T12:00:00Z"
    }
  ]
}
```

**Get Task**

```http
GET /api/tasks/:id
Authorization: Bearer <JWT_TOKEN>
```

**Create Task**

```http
POST /api/tasks
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "text": "Buy groceries",
  "dueDate": "2026-01-15"
}
```

**Update Task**

```http
PATCH /api/tasks/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "text": "Buy groceries and cook dinner",
  "completed": true,
  "dueDate": "2026-01-16"
}
```

**Delete Task**

```http
DELETE /api/tasks/:id
Authorization: Bearer <JWT_TOKEN>
```

---

#### Lists

**List All Lists**

```http
GET /api/lists
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": [
    {
      "name": "Groceries",
      "itemCount": 5,
      "createdAt": "2026-01-09T12:00:00Z"
    }
  ]
}
```

**Get List with Items**

```http
GET /api/lists/:name
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": {
    "name": "Groceries",
    "items": [
      {
        "text": "Milk",
        "completed": false
      },
      {
        "text": "Eggs",
        "completed": true
      }
    ]
  }
}
```

**Create List**

```http
POST /api/lists
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Groceries"
}
```

**Add Item to List**

```http
POST /api/lists/:name/items
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "itemText": "Milk"
}
```

**Toggle Item Completion**

```http
PATCH /api/lists/:name/items/:itemText/toggle
Authorization: Bearer <JWT_TOKEN>
```

**Remove Item from List**

```http
DELETE /api/lists/:name/items/:itemText
Authorization: Bearer <JWT_TOKEN>
```

**Delete List**

```http
DELETE /api/lists/:name
Authorization: Bearer <JWT_TOKEN>
```

---

#### Notes

**List All Notes**

```http
GET /api/notes
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "Meeting notes from Jan 9",
      "tags": "work,meeting",
      "createdAt": "2026-01-09T12:00:00Z"
    }
  ]
}
```

**Search Notes**

```http
GET /api/notes?search=meeting
Authorization: Bearer <JWT_TOKEN>
```

**Get Note**

```http
GET /api/notes/:id
Authorization: Bearer <JWT_TOKEN>
```

**Create Note**

```http
POST /api/notes
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Meeting notes from Jan 9",
  "tags": "work,meeting"
}
```

**Update Note**

```http
PATCH /api/notes/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Updated meeting notes",
  "tags": "work,meeting,important"
}
```

**Delete Note**

```http
DELETE /api/notes/:id
Authorization: Bearer <JWT_TOKEN>
```

---

#### Reminders

**List All Reminders**

```http
GET /api/reminders
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "message": "Take medication",
      "time": "09:00",
      "frequency": "daily",
      "dayOfWeek": null,
      "createdAt": "2026-01-09T12:00:00Z"
    }
  ]
}
```

**Get Reminder**

```http
GET /api/reminders/:id
Authorization: Bearer <JWT_TOKEN>
```

**Create Reminder**

```http
POST /api/reminders
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "message": "Take medication",
  "time": "09:00",
  "frequency": "daily"
}

# Weekly reminder
{
  "message": "Team meeting",
  "time": "14:00",
  "frequency": "weekly",
  "dayOfWeek": 1
}
```

**Delete Reminder**

```http
DELETE /api/reminders/:id
Authorization: Bearer <JWT_TOKEN>
```

---

#### Budget

**List All Transactions**

```http
GET /api/budget/transactions
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "amount": 50.00,
      "category": "groceries",
      "description": "Weekly shopping",
      "type": "expense",
      "createdAt": "2026-01-09T12:00:00Z"
    }
  ]
}
```

**Get Budget Summary**

```http
GET /api/budget/summary?month=2026-01
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": {
    "month": "2026-01",
    "totalIncome": 3000.00,
    "totalExpenses": 1500.00,
    "balance": 1500.00,
    "categories": {
      "groceries": 300.00,
      "utilities": 200.00
    }
  }
}
```

**Create Transaction**

```http
POST /api/budget/transactions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "amount": 50.00,
  "category": "groceries",
  "description": "Weekly shopping",
  "type": "expense"
}
```

**Delete Transaction**

```http
DELETE /api/budget/transactions/:id
Authorization: Bearer <JWT_TOKEN>
```

---

### Health Check

**Server Health**

```http
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2026-01-09T12:00:00Z"
}
```

---

## Deployment

### Docker

**Build Image**

```bash
docker build -t bwaincell .
```

**Run Container**

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name bwaincell \
  bwaincell
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Fly.io

**Deploy to Fly.io**

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly deploy

# View logs
fly logs

# Open app
fly open
```

**Environment Variables (Fly.io)**

```bash
fly secrets set DISCORD_TOKEN=your_token
fly secrets set GOOGLE_CLIENT_ID=your_client_id
fly secrets set JWT_SECRET=your_secret
fly secrets set DATABASE_URL=your_database_url
```

---

## Development

### Project Structure

```
Bwaincell/                  # Monorepo root
├── backend/                # Discord bot + Express API
│   ├── src/               # Source code
│   │   ├── api/          # REST API routes & middleware
│   │   ├── bot.ts        # Discord bot entry point
│   │   └── deploy-commands.ts
│   ├── commands/          # Discord slash commands
│   ├── database/          # Sequelize models
│   ├── utils/             # Utility functions
│   ├── dist/              # Compiled output
│   ├── package.json       # @bwaincell/backend
│   ├── tsconfig.json      # Backend TypeScript config
│   └── Dockerfile         # Multi-stage Docker build
├── frontend/               # Next.js PWA
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── lib/               # Frontend utilities
│   ├── public/            # Static assets
│   ├── .next/             # Build output
│   ├── package.json       # @bwaincell/frontend
│   └── tsconfig.json      # Frontend TypeScript config
├── shared/                 # Shared types package
│   ├── src/
│   │   ├── index.ts       # Barrel exports
│   │   └── types/
│   │       └── database.ts # Shared model interfaces
│   ├── dist/              # Compiled types
│   ├── package.json       # @bwaincell/shared
│   └── tsconfig.json      # TypeScript config (composite)
├── .github/                # CI/CD workflows
│   └── workflows/
│       ├── ci.yml         # Monorepo CI pipeline
│       └── deploy-bot.yml # Raspberry Pi deployment
├── trinity/                # Development methodology
├── docs/                   # Documentation
├── package.json            # Root workspace configuration
├── tsconfig.json           # Root project references
├── docker-compose.yml      # Backend + PostgreSQL
├── .env                    # Environment variables (all workspaces)
├── MIGRATION.md            # Monorepo migration documentation
└── README.md               # This file
```

### Scripts

```bash
# Development (Monorepo)
npm run dev              # Start both backend (3000) and frontend (3010)
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run build            # Build all workspaces (shared → backend → frontend)
npm run build:shared     # Build shared package only

# Testing
npm test                 # Run all workspace tests
npm run test:backend     # Run backend tests only
npm run test:frontend    # Run frontend tests only
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Lint all workspaces
npm run lint:fix         # Fix code style issues
npm run typecheck        # TypeScript type checking (project references)
npm run clean            # Clean all dist directories

# Docker
npm run docker:build     # Build Docker images
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs

# Deployment
npm run deploy           # Deploy Discord commands (backend workspace)
```

### Adding Features

**New Discord Command:**

1. Create command file in `backend/commands/`
2. Implement `execute()` function with SlashCommandBuilder
3. Deploy commands: `npm run deploy`
4. Test in Discord server

**New API Endpoint:**

1. Create route handler in `backend/src/api/routes/`
2. Add authentication middleware
3. Implement endpoint logic with input validation
4. Return standardized response format
5. Add tests in `backend/tests/`

**New Shared Type:**

1. Add interface to `shared/src/types/database.ts`
2. Export from `shared/src/index.ts`
3. Build shared package: `npm run build:shared`
4. Import in backend/frontend: `import type { YourType } from '@bwaincell/shared'`

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

### Test Structure

```typescript
// AAA Pattern: Arrange-Act-Assert
describe("TaskService", () => {
  it("should create task with due date", async () => {
    // Arrange
    const taskData = { text: "Test task", dueDate: "2026-01-15" };

    // Act
    const task = await taskService.create(taskData);

    // Assert
    expect(task.text).toBe("Test task");
    expect(task.dueDate).toBe("2026-01-15");
  });
});
```

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

## Monitoring & Logging

### Winston Logger

**Log Levels:**

- `error` - Errors and exceptions
- `warn` - Warnings and deprecations
- `info` - General information
- `debug` - Detailed debugging (development only)

**Usage:**

```typescript
import { logger } from "@shared/utils/logger";

logger.info("User logged in", { userId, email });
logger.error("Database error", { error: error.message });
```

**Production:**

- Logs to stdout (captured by Fly.io)
- Stack traces for errors
- Sensitive data excluded

### Health Monitoring

**Health Check Endpoint:**

```bash
curl https://bwaincell.fly.dev/health
```

**Fly.io Metrics:**

- CPU and memory usage
- Request latency
- Error rates
- Uptime monitoring

---

## Troubleshooting

### Common Issues

**Discord Bot Not Responding**

- Verify `DISCORD_TOKEN` is correct
- Check bot has necessary permissions in Discord server
- Ensure commands are deployed: `npm run deploy`
- Check logs for errors: `docker-compose logs -f`

**Authentication Errors**

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check user email is in whitelist (`USER1_EMAIL` environment variable)
- Ensure JWT_SECRET is set and consistent across restarts

**Database Connection Failed**

- Verify `DATABASE_URL` is correct
- Check PostgreSQL server is running
- Ensure database exists: `createdb bwaincell`
- Check network connectivity to database

**Reminder Scheduler Not Working**

- Verify `REMINDER_CHANNEL_ID` is set
- Check `TIMEZONE` environment variable is valid
- Ensure bot has permission to send messages in reminder channel
- Check logs for scheduler errors

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

---

## Contributing

### Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards

- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Prettier** for formatting
- **Jest** for testing (≥80% coverage)
- **Conventional commits** for commit messages

### Pre-commit Hooks

Husky + lint-staged automatically:

- Runs ESLint with `--fix`
- Formats code with Prettier
- Validates commit messages

---

## License

ISC

---

## Support

### Documentation

- **API Documentation:** See "REST API Documentation" section above
- **Discord Commands:** See "Discord Commands" section above
- **Source Code:** See [src/README.md](src/README.md) for implementation details
- **Development:** See [trinity/README.md](trinity/README.md) for methodology

### Resources

- [Discord.js Guide](https://discordjs.guide/)
- [Express Documentation](https://expressjs.com/)
- [Sequelize Docs](https://sequelize.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

**Version:** 1.0.0
**Node.js:** 18+
**TypeScript:** 5.9.2
**Last Updated:** 2026-01-09
