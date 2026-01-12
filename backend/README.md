# backend/

Discord bot and REST API backend for Bwaincell productivity platform.

---

## Purpose

The `backend/` directory implements the core server-side functionality for Bwaincell:

- **Discord Bot** - Slash commands for Discord-based productivity management (Discord.js 14.14.1)
- **REST API** - Express.js HTTP API with Google OAuth 2.0 authentication (port 3000)
- **Database Layer** - PostgreSQL 15 + Sequelize ORM with user/guild isolation
- **Scheduler** - node-cron based reminder system with Discord notifications
- **Shared Utilities** - Winston logging, validators, interaction handlers

---

## Contents

### Key Files

- **package.json** - Backend workspace configuration, npm scripts, dependencies
- **tsconfig.json** - TypeScript configuration with path aliases
- **jest.config.js** - Jest test configuration (35% coverage threshold)

### Subdirectories

- **src/** - Source code (bot.ts entry point, api/ routes, types/)
- **commands/** - Discord slash command implementations
- **database/** - Sequelize models, migrations, schema definitions
- **utils/** - Utility modules (logger, validators, interaction handlers)
- **shared/** - Shared types and utilities (symlinked to ../shared/)
- **tests/** - Backend unit and integration tests
- **config/** - Configuration management (env validation, database config)
- **types/** - TypeScript type definitions

---

## Key Files

### `package.json`

**Purpose:** Backend workspace configuration

**Key Scripts:**

- `npm run dev` - Start development server with ts-node-dev (hot reload)
- `npm run build` - Compile TypeScript to dist/ directory
- `npm start` - Start production server (requires build first)
- `npm run deploy` - Deploy Discord slash commands to guild
- `npm test` - Run Jest test suite
- `npm run lint` - Run ESLint on TypeScript files

**Dependencies:**

- **discord.js** 14.14.1 - Discord bot framework
- **express** 4.21.2 - HTTP server framework
- **sequelize** 6.37.7 - PostgreSQL ORM
- **pg** 8.16.3 - PostgreSQL client
- **winston** 3.17.0 - Structured logging
- **node-cron** 4.2.1 - Reminder scheduler
- **jsonwebtoken** 9.0.2 - JWT authentication
- **google-auth-library** 10.4.0 - Google OAuth 2.0 verification
- **joi** 18.0.1 - Input validation

---

### `tsconfig.json`

**Purpose:** TypeScript compiler configuration

**Key Settings:**

- **Target:** ES2022
- **Module:** commonjs
- **Strict Mode:** Enabled
- **Path Aliases:** @shared, @commands, @utils, @database, @config, @types, @src

**Compilation:**

- **Output:** dist/ directory
- **Incremental:** true (faster rebuilds)
- **Source Maps:** true (debugging support)

---

## Directory Structure

```
backend/
├── src/                          # Source code
│   ├── bot.ts                   # Discord bot entry point
│   ├── deploy-commands.ts       # Command registration script
│   ├── api/                     # REST API implementation
│   │   ├── server.ts           # Express server setup
│   │   ├── routes/             # API route handlers
│   │   │   ├── oauth.ts        # Google OAuth 2.0 authentication
│   │   │   ├── tasks.ts        # Task CRUD endpoints
│   │   │   ├── lists.ts        # List management endpoints
│   │   │   ├── notes.ts        # Note endpoints with search
│   │   │   ├── reminders.ts    # Reminder scheduling endpoints
│   │   │   ├── budget.ts       # Budget tracking endpoints
│   │   │   └── schedule.ts     # Schedule management endpoints
│   │   ├── middleware/         # Express middleware
│   │   │   └── oauth.ts        # JWT verification middleware
│   │   └── utils/              # API utilities
│   └── types/                  # TypeScript type definitions
├── commands/                    # Discord slash commands
│   ├── task.ts                 # /task commands
│   ├── list.ts                 # /list commands
│   ├── note.ts                 # /note commands
│   ├── reminder.ts             # /reminder commands
│   └── budget.ts               # /budget commands
├── database/                    # Database layer
│   ├── index.ts                # Sequelize instance and sync
│   ├── schema.ts               # Database schema definitions
│   └── models/                 # Sequelize models
│       ├── Task.ts
│       ├── List.ts
│       ├── Note.ts
│       ├── Reminder.ts
│       ├── Budget.ts
│       └── User.ts
├── utils/                       # Utility modules
│   ├── interactions/           # Discord interaction handlers
│   │   ├── buttons.ts         # Button interaction handlers
│   │   ├── selectMenus.ts     # Select menu handlers
│   │   └── modals.ts          # Modal submission handlers
│   └── validators/             # Input validators
├── shared/                      # Shared types and utilities (symlink to ../shared/)
│   ├── types/
│   ├── utils/
│   │   └── logger.ts          # Winston logger configuration
│   └── validation/
│       └── env.ts             # Environment variable validation
├── config/                      # Configuration
│   └── config.ts               # Environment-based configuration
├── tests/                       # Backend tests
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── helpers/                # Test helpers
├── dist/                        # Compiled JavaScript (generated by build)
├── package.json                 # Backend workspace configuration
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest test configuration
```

---

## Usage

### Starting the Backend

**Development Mode (with hot reload):**

```bash
# From project root
npm run dev:backend

# Or from backend/ directory
npm run dev
```

**Production Mode:**

```bash
# Build TypeScript
npm run build:backend

# Start production server
npm start --workspace=backend
```

### Deploying Discord Commands

After adding or modifying Discord slash commands:

```bash
# From project root
npm run deploy --workspace=backend

# Or from backend/ directory
npm run deploy
```

This registers commands with Discord via the REST API.

### Running Tests

```bash
# Run all backend tests
npm run test:backend

# Run tests in watch mode
npm run test:watch --workspace=backend

# Generate coverage report
npm run test:coverage --workspace=backend
```

### API Development

**Start API server:**

```bash
npm run dev:backend  # Starts both Discord bot and API on port 3000
```

**Test API endpoints:**

```bash
# Health check
curl http://localhost:3000/health

# Get JWT token (requires Google OAuth flow from frontend)
export JWT_TOKEN="your_jwt_token"

# Test protected endpoint
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:3000/api/tasks
```

---

## Key Concepts

### Multi-Interface Architecture

The backend serves three interfaces simultaneously:

1. **Discord Bot** - Slash commands via Discord.js client
2. **REST API** - HTTP endpoints via Express server
3. **Reminder Scheduler** - Cron jobs with Discord notifications

All three share:

- Single PostgreSQL database
- User/guild isolation
- Sequelize ORM models
- Winston logging

### User Isolation

**Data segregation by:**

- `user_id` (Discord user ID)
- `guild_id` (Discord server ID)

**OAuth mapping:**

```
Google Email → Discord ID (environment variables)
```

**Environment variables:**

```env
USER1_EMAIL=user@gmail.com
USER1_DISCORD_ID=123456789
USER2_EMAIL=partner@gmail.com
USER2_DISCORD_ID=987654321
```

### Authentication Flow

**Discord Bot:** No authentication required (Discord handles it)

**REST API:**

1. User authenticates with Google OAuth (frontend)
2. Backend verifies Google ID token
3. Backend maps email to Discord ID
4. Backend generates JWT (1 hour) + refresh token (7 days)
5. Client sends JWT in `Authorization: Bearer <token>` header
6. Middleware verifies JWT and attaches user info to request

---

## Dependencies

### Internal Dependencies

- **../shared/** - Shared types, logger, validators (symlinked)
- **../frontend/** - API consumer (PWA)

### External Dependencies

**Core:**

- **discord.js** - Discord bot framework
- **express** - HTTP server
- **sequelize** - PostgreSQL ORM
- **pg** - PostgreSQL driver

**Authentication:**

- **jsonwebtoken** - JWT generation/verification
- **google-auth-library** - Google OAuth 2.0 token verification

**Utilities:**

- **winston** - Structured logging
- **node-cron** - Reminder scheduling
- **joi** - Input validation
- **dotenv** - Environment variables
- **cors** - CORS middleware

**Development:**

- **typescript** - Type safety
- **ts-node-dev** - Development server with hot reload
- **jest** - Testing framework
- **eslint** - Code linting
- **prettier** - Code formatting

---

## Testing

### Test Organization

```
tests/
├── unit/                  # Unit tests (isolated functions/classes)
├── integration/           # Integration tests (API endpoints, database)
└── helpers/               # Test utilities and mocks
```

### Running Tests

```bash
# All tests
npm test

# Watch mode (TDD)
npm run test:watch

# Coverage report
npm run test:coverage

# Coverage with threshold check (80%)
npm run coverage:threshold
```

### Current Coverage

- **Statements:** 35%
- **Branches:** 30%
- **Functions:** 35%
- **Lines:** 35%

**Target:** 80%+ across all metrics

---

## Common Patterns

### Error Handling

**Async operations:**

```typescript
import { logger } from '@shared/utils/logger';

async function fetchData() {
  try {
    const result = await database.query();
    return result;
  } catch (error) {
    logger.error('Database query failed', { error: error.message });
    throw error;
  }
}
```

**Discord commands:**

```typescript
async function execute(interaction: CommandInteraction) {
  try {
    // Command logic
    await interaction.reply('Success!');
  } catch (error) {
    logger.error('Command execution failed', { error, command: interaction.commandName });
    await interaction.reply({ content: 'An error occurred.', ephemeral: true });
  }
}
```

### Database Queries

**User/guild isolation:**

```typescript
import { Task } from '@database/models/Task';

// Always filter by user_id and guild_id
const tasks = await Task.findAll({
  where: {
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
  },
});
```

### Logging

**Winston logger:**

```typescript
import { logger, logBotEvent, logError } from '@shared/utils/logger';

// Info logs
logger.info('User logged in', { userId, email });

// Error logs
logger.error('Database connection failed', { error: error.message });

// Bot events
logBotEvent('COMMAND_EXECUTED', { command: 'task', userId });

// Errors with context
logError(error, { context: 'Task creation', userId });
```

---

## Related Documentation

### Project Documentation

- **[../README.md](../README.md)** - Project overview
- **[src/README.md](src/README.md)** - Source code documentation (API routes, bot.ts)
- **[../frontend/README.md](../frontend/README.md)** - Frontend PWA documentation

---

## Notes

### Important Considerations

- **User Isolation:** ALL database queries must filter by `user_id` and `guild_id`
- **Error Handling:** Use try-catch for async operations, log with Winston
- **Authentication:** API routes (except /health, /api/auth/\*) require JWT
- **Timezone:** Reminder scheduler uses `TIMEZONE` environment variable
- **Module Aliases:** Use `@shared`, `@commands`, `@utils`, `@database`, `@config`, `@types`, `@src`

### Best Practices

- **Logging:** Use Winston logger, never console.log
- **Async/Await:** Always use async/await, never callbacks
- **Type Safety:** Enable TypeScript strict mode, define types for all parameters/returns
- **Input Validation:** Use Joi for API input validation
- **Error Messages:** User-friendly for API responses, detailed for logs
- **Testing:** Write tests before implementation (TDD), 80%+ coverage target

### Environment Variables

Required in `.env`:

```env
# Discord
DISCORD_BOT_TOKEN=your_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id
NOTIFICATION_CHANNEL_ID=your_channel_id

# PostgreSQL
DB_NAME=bwaincell
DB_USER=bwaincelluser
DB_PASSWORD=securepassword
DB_HOST=localhost
DB_PORT=5432

# API
API_PORT=3000
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# User Mapping
USER1_EMAIL=user@gmail.com
USER1_DISCORD_ID=123456789

# Config
NODE_ENV=development
TIMEZONE=America/Los_Angeles
```

---

## Contributing

When contributing to the backend:

1. **Follow TypeScript strict mode** - All code must compile with `tsc --strict`
2. **Write tests** - 80%+ coverage target, tests before implementation (TDD)
3. **Use Winston logger** - No console.log statements
4. **Validate inputs** - Use Joi for API validation, check Discord command parameters
5. **User isolation** - Always filter by user_id + guild_id
6. **Error handling** - Try-catch for async, user-friendly messages, detailed logs
7. **Run quality gates** - `npm run lint`, `npm test`, `npm run typecheck`

See [Contributing Guidelines](../CONTRIBUTING.md) for general contribution process.

---

**Workspace:** backend
**Framework:** Express 4.21.2 + Discord.js 14.14.1
**Language:** TypeScript 5.9.2
**Database:** PostgreSQL 15 + Sequelize ORM 6.37.7
**Runtime:** Node.js 18+
**Last Updated:** 2026-01-11

---
