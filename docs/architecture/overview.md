# Architecture Overview

**Project:** Bwaincell
**Type:** Node.js Monorepo
**Framework:** Discord.js + Express + Next.js
**Version:** 2.0.0
**Last Updated:** 2026-01-11

## System Overview

Bwaincell is a unified monorepo productivity platform providing task management, reminders, lists, notes, budgets, and scheduling through three integrated interfaces: Discord Bot, REST API, and Progressive Web App. The system is designed for multi-user productivity management with data isolation by Discord user_id and guild_id.

## Technology Stack

**Runtime:** Node.js 18.0+
**Package Manager:** npm 9.0+ (workspaces)
**Database:** PostgreSQL 15
**ORM:** Sequelize 6.37.7

### Backend Stack

- **Framework:** Express 4.21.2
- **Bot Framework:** Discord.js 14.14.1
- **Authentication:** Google OAuth 2.0 (google-auth-library 10.4.0)
- **JWT:** jsonwebtoken 9.0.2
- **Logging:** Winston 3.17.0
- **Validation:** Joi 18.0.1
- **Scheduling:** node-cron 4.2.1
- **Database Driver:** pg 8.16.3

### Frontend Stack

- **Framework:** Next.js 14.2.35
- **React:** 18.3.1
- **PWA:** next-pwa 5.6.0
- **Auth:** NextAuth 4.24.7
- **State:** Zustand 5.0.8
- **Data Fetching:** TanStack React Query 5.90.2
- **UI Components:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS 3.4.1
- **Database (Frontend ORM):** Prisma 5.22.0

### Shared Dependencies

- **TypeScript:** 5.9.2 (strict mode)
- **Linting:** ESLint 8.x + Prettier 3.0
- **Testing:** Jest 30.1.3 + ts-jest 29.4.4

**Key Dependencies (Backend):**

- discord.js 14.14.1 - Discord bot framework
- express 4.21.2 - REST API server
- google-auth-library 10.4.0 - OAuth verification
- jsonwebtoken 9.0.2 - JWT authentication
- sequelize 6.37.7 - PostgreSQL ORM
- winston 3.17.0 - Structured logging
- joi 18.0.1 - Input validation
- luxon 3.7.2 - DateTime operations
- node-cron 4.2.1 - Task scheduling
- pg 8.16.3 - PostgreSQL driver
- cors 2.8.5 - CORS middleware
- dotenv 17.2.2 - Environment variables

**Key Dependencies (Frontend):**

- next 14.2.35 - React framework
- react 18.3.1 - UI library
- next-auth 4.24.7 - Authentication
- @tanstack/react-query 5.90.2 - Data fetching
- zustand 5.0.8 - State management
- @prisma/client 5.22.0 - Database client
- lucide-react 0.545.0 - Icons
- tailwindcss 3.4.1 - CSS framework
- date-fns 4.1.0 - Date utilities
- recharts 3.2.1 - Charts

## Architecture Pattern

**Pattern:** Monorepo with Workspaces

This is a monorepo structure with:

- **backend/** - Express API + Discord bot
- **frontend/** - Next.js PWA
- **shared/** - Shared TypeScript types and utilities

### Three-Interface Architecture

1. **Discord Bot** - Primary interface via Discord slash commands
2. **REST API** - Express-based API for programmatic access
3. **PWA** - Next.js frontend for web/mobile access

All three interfaces share the same PostgreSQL database and enforce user isolation by Discord user_id + guild_id.

## Directory Structure

```
bwaincell/
├── backend/                    # Discord bot + REST API
│   ├── src/
│   │   ├── bot.ts             # Discord bot entry point
│   │   ├── api/
│   │   │   ├── server.ts      # Express server configuration
│   │   │   ├── routes/        # API route handlers
│   │   │   └── middleware/    # Authentication, CORS, error handling
│   │   └── deploy-commands.js # Discord command registration
│   ├── commands/              # Discord slash commands
│   │   ├── task.ts
│   │   ├── list.ts
│   │   ├── note.ts
│   │   ├── reminder.ts
│   │   └── budget.ts
│   ├── database/              # Sequelize ORM
│   │   ├── index.ts           # Database initialization
│   │   ├── models/            # Data models (Task, List, Note, etc.)
│   │   └── schema.ts          # Database schema definitions
│   ├── utils/
│   │   ├── interactions/      # Button/modal/select menu handlers
│   │   ├── scheduler.ts       # Cron job scheduler
│   │   └── logger.ts          # Winston logger
│   └── tests/                 # Backend unit tests
├── frontend/                   # Next.js PWA
│   ├── app/                   # App Router
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── api/               # API routes (auth)
│   │   └── layout.tsx
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── dashboard/        # Dashboard-specific components
│   ├── hooks/                 # Custom hooks (useTasks, useLists, etc.)
│   ├── lib/
│   │   ├── api-client.ts     # API client with JWT handling
│   │   └── utils.ts
│   └── public/
│       ├── manifest.json     # PWA manifest
│       └── icons/            # PWA icons
├── shared/                     # Shared TypeScript types
│   ├── types/
│   │   ├── task.ts
│   │   ├── list.ts
│   │   ├── note.ts
│   │   ├── reminder.ts
│   │   └── budget.ts
│   ├── utils/
│   │   └── logger.ts         # Shared Winston logger
│   └── validation/
│       └── env.ts            # Environment validation
├── tests/                      # Integration/E2E tests
├── docker-compose.yml          # Docker configuration
├── .env.example                # Environment template
└── package.json                # Monorepo workspace config
```

## Entry Points

**Main Entry (Backend):** backend/src/bot.ts
**API Server:** backend/src/api/server.ts
**Frontend Entry:** frontend/app/page.tsx

## Data Flow

### Discord Bot → Database

1. User issues Discord slash command (e.g., `/task add`)
2. Discord.js handles interaction
3. Command handler in `backend/commands/` executes
4. Sequelize ORM queries/updates PostgreSQL
5. Response sent back to Discord user

### REST API → Database

1. Client sends authenticated HTTP request (JWT)
2. Express middleware validates JWT token
3. Route handler in `backend/src/api/routes/` executes
4. Sequelize ORM queries/updates PostgreSQL
5. JSON response returned to client

### PWA → REST API → Database

1. User interacts with Next.js PWA
2. React Query fetches data via API client
3. API client includes JWT token in headers
4. Express API processes request
5. Data returned to PWA, cached by React Query

## User Isolation

All database tables include `user_id` (Discord user ID) and `guild_id` (Discord server ID) columns. Every query automatically filters by these columns to ensure users can only access their own data.

**Example (Task Model):**

```typescript
const tasks = await Task.findAll({
  where: {
    user_id: userId,
    guild_id: guildId,
  },
});
```

## Authentication & Authorization

### Backend Authentication Flow

1. User authenticates with Google OAuth (PWA frontend)
2. Frontend receives Google ID token
3. Frontend sends ID token to `/api/auth/google/verify`
4. Backend verifies token with `google-auth-library`
5. Backend maps Google email to Discord user ID (from env vars)
6. Backend generates JWT access token (1 hour) + refresh token (7 days)
7. Frontend stores tokens in secure storage
8. All subsequent API requests include JWT in `Authorization: Bearer <token>` header

### JWT Token Structure

**Access Token (1 hour expiry):**

```json
{
  "userId": "123456789",
  "email": "user@gmail.com",
  "guildId": "987654321",
  "iat": 1736611200,
  "exp": 1736614800
}
```

**Refresh Token (7 days expiry):**

```json
{
  "userId": "123456789",
  "type": "refresh",
  "iat": 1736611200,
  "exp": 1737216000
}
```

## Configuration

**Environment Variables:** See `.env.example`

### Key Configuration Files

- **docker-compose.yml** - PostgreSQL + backend containerization
- **backend/tsconfig.json** - TypeScript config for backend
- **frontend/next.config.js** - Next.js config with PWA support
- **shared/tsconfig.json** - Shared types TypeScript config
- **package.json** - Monorepo workspace configuration

## Build & Deployment

### Development

**Start all services:**

```bash
npm run dev  # Starts backend + frontend concurrently
```

**Backend only:**

```bash
npm run dev:backend  # Discord bot + API server on port 3000
```

**Frontend only:**

```bash
npm run dev:frontend  # Next.js dev server on port 3010
```

### Production

**Build:**

```bash
npm run build  # Builds shared, backend, frontend
```

**Start:**

```bash
npm start --workspace=backend   # Production backend
npm start --workspace=frontend  # Production frontend
```

### Deployment

**Backend:** Raspberry Pi 4B (Docker) + PostgreSQL 15

- Docker Compose with backend + PostgreSQL containers
- Exposed on local network + Fly.io proxy
- Auto-deployment via GitHub Actions

**Frontend:** Vercel

- Automatic deployment on push to main branch
- Environment variables configured in Vercel dashboard
- PWA assets served via CDN

## Database Schema

### Core Tables

- **tasks** - Task management (text, due_date, completed, user_id, guild_id)
- **lists** - List management (name, user_id, guild_id)
- **list_items** - List items (item, list_id, checked)
- **notes** - Note-taking (content, tags, user_id, guild_id)
- **reminders** - Scheduled reminders (message, time, frequency, user_id, guild_id, channel_id)
- **budgets** - Budget tracking (amount, category, type, description, user_id, guild_id)

All tables include:

- Primary key: `id` (auto-increment)
- Timestamps: `createdAt`, `updatedAt`
- User isolation: `user_id`, `guild_id`

### Database Migrations

Database schema is managed by Sequelize ORM. Migrations run automatically on backend startup using `sequelize.sync()`.

For production, use explicit migrations:

```bash
npx sequelize-cli db:migrate
```

## Performance Characteristics

### Response Times (Target)

- Discord bot commands: < 3 seconds
- REST API endpoints: < 500ms
- PWA page load: < 2 seconds
- Database queries: < 100ms

### Scalability

- **Current:** Single-server deployment (Raspberry Pi 4B)
- **Database:** PostgreSQL can handle 1000+ concurrent connections
- **API:** Express can handle 1000+ req/s with clustering
- **PWA:** Vercel serverless scales automatically

## Security

### Authentication Security

- Google OAuth 2.0 for user authentication
- JWT tokens signed with 256-bit secret (HS256)
- Refresh tokens stored in HTTP-only cookies (future enhancement)
- Email whitelist for authorized users (environment variables)

### API Security

- CORS restricted to known origins
- JWT validation on all protected routes
- Input validation with Joi schemas
- SQL injection prevention via Sequelize parameterized queries

### Data Security

- PostgreSQL user credentials in environment variables
- Discord bot token never exposed to frontend
- JWT secrets stored securely (not in version control)
- User data isolated by user_id + guild_id

## Monitoring & Logging

### Logging Strategy

**Backend:** Winston structured logging

- Log levels: error, warn, info, debug
- Log format: JSON with timestamps
- Log destinations: console (stdout/stderr)

**Frontend:** Browser console + error boundaries

- Production: Minimal logging
- Development: Verbose logging

### Health Monitoring

**Health Check Endpoint:** `GET /health`

```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T12:00:00.000Z",
  "environment": "production"
}
```

## Design Decisions

### Why Monorepo?

- Shared types between backend and frontend (DRY principle)
- Atomic commits across frontend + backend changes
- Simplified dependency management
- Single CI/CD pipeline

### Why Three Interfaces?

- **Discord Bot:** Primary interface for users already in Discord servers
- **REST API:** Enables integrations with external tools
- **PWA:** Web/mobile access for users not on Discord

### Why PostgreSQL?

- Production-grade relational database
- ACID compliance for data integrity
- Better performance than SQLite for concurrent access
- Native JSON support for flexible schema

### Why Discord User ID for Auth?

- Users already authenticated via Discord
- No need for separate user registration
- Seamless integration with Discord bot
- Email → Discord ID mapping enforces authorization

## Testing Strategy

### Test Coverage

- **Backend:** 35% coverage (target: 80%)
- **Frontend:** 45% coverage (target: 80%)
- **Critical paths:** 100% coverage (auth, database operations)

### Test Types

- **Unit Tests:** Jest + ts-jest
- **Integration Tests:** Supertest for API routes
- **E2E Tests:** (Future) Playwright for PWA

### Running Tests

```bash
npm test                  # All tests
npm run test:backend      # Backend only
npm run test:frontend     # Frontend only
npm run test:coverage     # With coverage report
npm run test:watch        # Watch mode for TDD
```

## Known Limitations

- Single guild support (all data filtered by same guild_id)
- No real-time sync between Discord bot and PWA (polling only)
- Email whitelist requires manual environment variable updates
- No horizontal scaling (single server deployment)

## Future Enhancements

- WebSocket support for real-time updates
- Multi-guild support per user
- Admin dashboard for user management
- API rate limiting
- GraphQL API layer
- Mobile app (React Native)

---

For API documentation, see [../api/](../api/).
For getting started, see [../guides/getting-started.md](../guides/getting-started.md).
