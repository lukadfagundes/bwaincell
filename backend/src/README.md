# src/ - Bwaincell Source Code

This directory contains the core source code for Bwaincell, a dual-purpose productivity platform providing both Discord bot functionality and a RESTful API.

---

## Purpose

The `src/` directory implements:

- **Discord Bot**: Slash commands for server-based productivity management
- **REST API**: Secure HTTP endpoints with Google OAuth 2.0 authentication
- **Core Services**: Task management, list management, reminders, budget tracking, notes

---

## Contents

### Directory Structure

```
src/
├── api/                  # REST API implementation
│   ├── server.ts        # Express server setup
│   ├── routes/          # API route handlers
│   │   ├── oauth.ts    # Google OAuth 2.0 authentication
│   │   ├── tasks.ts    # Task CRUD endpoints
│   │   ├── lists.ts    # List management endpoints
│   │   ├── notes.ts    # Note endpoints with search
│   │   ├── reminders.ts # Reminder scheduling endpoints
│   │   └── budget.ts   # Budget tracking endpoints
│   ├── middleware/      # Authentication & error handling
│   │   └── oauth.ts    # JWT verification middleware
│   └── utils/           # API utilities
├── bot.ts               # Discord bot entry point
├── deploy-commands.ts   # Command registration script
└── types/               # TypeScript type definitions
```

---

## Key Files

### bot.ts

**Purpose:** Discord bot entry point and initialization

**Responsibilities:**

- Initialize Discord.js client
- Load and register slash commands
- Set up event handlers
- Start reminder scheduler
- Connect to database

**Usage:**

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

---

### deploy-commands.ts

**Purpose:** Deploy slash commands to Discord

**Usage:**

```bash
# Deploy commands to Discord
npm run deploy
```

**When to Run:**

- After adding new commands
- After modifying command definitions
- During initial setup
- After command structure changes

---

### api/server.ts

**Purpose:** Express API server setup and middleware configuration

**Responsibilities:**

- Configure Express app
- Set up CORS for PWA access
- Mount API routes
- Configure error handling middleware
- Start HTTP server on configured port

**Port:** 3000 (configurable via API_PORT environment variable)

**Health Check:**

```bash
curl https://bwaincell.fly.dev/health
```

---

## API Routes

### Authentication (oauth.ts)

**Endpoints:**

- `POST /api/auth/google/verify` - Verify Google ID token, return JWT
- `POST /api/auth/refresh` - Refresh expired JWT token
- `POST /api/auth/logout` - Invalidate refresh token

**Authentication Flow:**

1. Frontend gets Google ID token via Google OAuth
2. Backend verifies token with Google
3. Backend generates JWT access token (1 hour expiry)
4. Backend generates refresh token (7 days expiry)
5. Frontend stores tokens and uses JWT for API requests

---

### Tasks (tasks.ts)

**Endpoints:**

- `GET /api/tasks` - List all tasks for authenticated user
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
  - Body: `{ text, dueDate? }`
- `PATCH /api/tasks/:id` - Update task (supports completed toggle)
  - Body: `{ text?, completed?, dueDate? }`
- `DELETE /api/tasks/:id` - Delete task

**Features:**

- User isolation by Discord ID
- Due date support (optional)
- Completion status tracking
- Task editing

---

### Lists (lists.ts)

**Endpoints:**

- `GET /api/lists` - List all lists with item counts
- `GET /api/lists/:name` - Get specific list with items
- `POST /api/lists` - Create new list
  - Body: `{ name }`
- `POST /api/lists/:name/items` - Add item to list
  - Body: `{ itemText }`
- `PATCH /api/lists/:name/items/:itemText/toggle` - Toggle item completion
- `DELETE /api/lists/:name/items/:itemText` - Remove item from list
- `DELETE /api/lists/:name` - Delete entire list

**Features:**

- Multiple named lists per user
- Item completion tracking
- Item management (add/remove/toggle)
- List metadata (creation date, item count)

---

### Notes (notes.ts)

**Endpoints:**

- `GET /api/notes` - List all notes
- `GET /api/notes?search=query` - Search notes by keyword
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note
  - Body: `{ content, tags? }`
- `PATCH /api/notes/:id` - Update note
  - Body: `{ content?, tags? }`
- `DELETE /api/notes/:id` - Delete note

**Features:**

- Keyword search across note content
- Tag support for organization
- Full CRUD operations
- Search with Enter-to-search UX

---

### Reminders (reminders.ts)

**Endpoints:**

- `GET /api/reminders` - List all active reminders
- `GET /api/reminders/:id` - Get specific reminder
- `POST /api/reminders` - Create new reminder
  - Body: `{ message, time, frequency, dayOfWeek? }`
- `DELETE /api/reminders/:id` - Delete reminder

**Frequency Types:**

- `once` - One-time reminder at specified time
- `daily` - Recurring daily at specified time
- `weekly` - Recurring weekly on specified day (dayOfWeek: 0-6, 0=Sunday)

**Integration:**

- Discord notifications sent to configured channel
- Cron-based scheduling (node-cron)
- Timezone-aware (configured via TIMEZONE env var)

---

### Budget (budget.ts)

**Endpoints:**

- `GET /api/budget/transactions` - List all transactions
- `GET /api/budget/summary` - Get budget summary
  - Query: `?month=YYYY-MM` (optional, defaults to current month)
- `POST /api/budget/transactions` - Create transaction
  - Body: `{ amount, category, description?, type: 'expense'|'income' }`
- `DELETE /api/budget/transactions/:id` - Delete transaction

**Features:**

- Expense and income tracking
- Category-based organization
- Monthly summaries
- Spending analytics

---

## Middleware

### oauth.ts (middleware)

**Purpose:** JWT authentication middleware

**Usage:**

```typescript
import { authenticate } from '@src/api/middleware/oauth';

router.get('/api/tasks', authenticate, getTasks);
```

**Functionality:**

- Extract JWT from Authorization header
- Verify JWT signature using JWT_SECRET
- Decode user information (email, Discord ID)
- Attach user info to request object
- Return 401 Unauthorized if token invalid/expired

**Token Format:**

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Types

### TypeScript Definitions

Located in `src/types/`, includes:

- Request/Response types
- Database model types
- Discord interaction types
- API error types

**Usage:**

```typescript
import { UserRequest } from '@src/types';
```

---

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Build TypeScript
npm run build

# Start development server with hot reload
npm run dev

# Or start production server
npm start
```

### Testing API Endpoints

```bash
# Get JWT token first (via OAuth flow in frontend)
export JWT_TOKEN="your_jwt_token_here"

# Test tasks endpoint
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://bwaincell.fly.dev/api/tasks

# Create task
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test task","dueDate":"2026-01-15"}' \
  https://bwaincell.fly.dev/api/tasks
```

---

## Integration with Discord Bot

### User Mapping

The API and Discord bot share a common database and use Discord user IDs for data isolation:

```
Google Email ──maps to──> Discord ID ──used for──> Data Queries
```

**Environment Variables:**

```env
USER1_EMAIL=user@gmail.com
USER1_DISCORD_ID=123456789
USER2_EMAIL=partner@gmail.com
USER2_DISCORD_ID=987654321
```

**Data Flow:**

1. User authenticates with Google OAuth (PWA)
2. Backend maps email to Discord ID
3. API queries use Discord ID as user identifier
4. Same data accessible via Discord bot and PWA

---

## Error Handling

### Response Format

**Success:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Errors

**401 Unauthorized:**

- Missing or invalid JWT token
- Expired token (use refresh endpoint)
- User not in allowed emails list

**404 Not Found:**

- Resource doesn't exist
- Wrong resource ID
- Resource belongs to different user

**400 Bad Request:**

- Invalid request body
- Missing required fields
- Invalid field format

**500 Internal Server Error:**

- Database error
- Server exception
- Check logs for details

---

## Logging

### Winston Logger

The project uses Winston for structured logging:

```typescript
import { logger } from '@shared/utils/logger';

logger.info('User logged in', { userId, email });
logger.error('Database error', { error: error.message });
logger.debug('Processing request', { endpoint, method });
```

**Log Levels:**

- `error` - Errors and exceptions
- `warn` - Warnings and deprecations
- `info` - General information
- `debug` - Detailed debugging (development only)

**Production:**

- Logs sent to stdout (captured by deployment platform)
- Sensitive data excluded from logs
- Stack traces for errors

---

## Security

### Authentication

- **Google OAuth 2.0** for user authentication
- **JWT tokens** for API session management
- **Email whitelist** for access control

### Data Protection

- User data isolated by Discord ID and guild ID
- Input validation on all endpoints
- Sequelize ORM prevents SQL injection
- No sensitive data in logs (production)

### Best Practices

- All secrets in environment variables
- CORS configured for specific origins
- HTTPS enforcement on Fly.io
- JWT tokens expire after 1 hour
- Refresh tokens expire after 7 days

---

## Performance

### Optimization Strategies

- Database connection pooling
- Efficient SQL queries via Sequelize ORM
- Lightweight Discord.js v14
- Minimal API response payloads
- Timezone-aware date handling

### Monitoring

- Health check endpoint (`/health`)
- Winston logging for error tracking
- Fly.io metrics and monitoring

---

## Deployment

### Build Process

```bash
# TypeScript compilation
npm run build

# Output: dist/ directory with compiled JavaScript
```

### Environment Variables

See `.env.example` for required variables:

- Discord bot credentials
- Google OAuth credentials
- JWT secret
- API port
- Database configuration

### Docker

```dockerfile
# Dockerfile in project root
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/src/bot.js"]
```

### Fly.io

```toml
# fly.toml configuration
app = "bwaincell"

[build]
  builder = "dockerfile"

[[services]]
  internal_port = 3000
  protocol = "tcp"
```

---

## Related Documentation

### Project Documentation

- **[../README.md](../README.md)** - Project overview, API documentation, setup guide
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines

### Testing

- **[../tests/](../tests/)** - Test suites
- **[../package.json](../package.json)** - Test scripts and dependencies

---

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `src/api/routes/`
2. Add authentication middleware
3. Implement endpoint logic
4. Add input validation
5. Return standardized response format
6. Add tests
7. Document in [../README.md](../README.md)

### Adding a New Discord Command

1. Create command file in `commands/`
2. Implement `execute()` function
3. Add command metadata (SlashCommandBuilder)
4. Deploy commands: `npm run deploy`
5. Test in Discord
6. Document in [../README.md](../README.md)

### Updating Database Schema

1. Update schema in `database/schema.ts`
2. Update model in `database/models/`
3. Test migrations locally
4. Update API endpoints if needed
5. Update TypeScript types
6. Document changes in pull request

---

## Notes

### Important Considerations

- **User Isolation**: All database queries must filter by user_id (Discord ID)
- **Error Handling**: Use try-catch for all async operations, return standardized error responses
- **Authentication**: All API routes (except /health and /auth/\*) require JWT authentication
- **Timezone**: Reminder scheduler uses TIMEZONE env var, ensure consistency across environments

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- No console.log (use Winston logger)
- Async/await for asynchronous operations
- Conventional commit messages

---

**Technology Stack:**

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.9.2
- **Framework:** Express.js 4.x
- **Discord:** Discord.js 14.14.1
- **Database:** PostgreSQL 15 + Sequelize ORM
- **Authentication:** Google OAuth 2.0 + JWT
- **Scheduler:** node-cron 4.2.1
- **Logging:** Winston 3.17.0

**Project:** Bwaincell
**Trinity Version:** 2.0.8
**Last Updated** 2026-01-12

---
