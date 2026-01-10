# Bwaincell Architecture Overview

Bwaincell is a dual-purpose productivity platform combining Discord bot functionality with a secure REST API, providing comprehensive task management, reminders, lists, notes, budgets, and scheduling capabilities.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Discord Client          │         PWA Frontend                  │
│  (slash commands)        │         (React/Next.js)              │
└────────┬─────────────────┴──────────────────┬──────────────────┘
         │                                    │
         │ Discord Gateway                    │ HTTPS/REST
         │                                    │
┌────────▼────────────────────────────────────▼──────────────────┐
│                    Application Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │   Discord Bot   │              │   Express API   │          │
│  │   (Discord.js)  │              │   (REST)        │          │
│  └────────┬────────┘              └────────┬────────┘          │
│           │                                │                    │
│           └────────────┬───────────────────┘                    │
│                        │                                        │
│           ┌────────────▼────────────┐                          │
│           │   Business Logic Layer  │                          │
│           ├─────────────────────────┤                          │
│           │ - TaskService           │                          │
│           │ - ListService           │                          │
│           │ - NoteService           │                          │
│           │ - ReminderService       │                          │
│           │ - BudgetService         │                          │
│           │ - ScheduleService       │                          │
│           └────────────┬────────────┘                          │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         │ Sequelize ORM
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     Data Layer                                   │
├─────────────────────────────────────────────────────────────────┤
│                  PostgreSQL Database                             │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │  Tasks   │  Lists   │  Notes   │ Reminders│  Budget  │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Discord Bot (`src/bot.ts`)

**Purpose:** Discord slash command interface for productivity features

**Responsibilities:**

- Initialize Discord.js client with gateway intents
- Load and register slash commands dynamically
- Handle command interactions and button/modal interactions
- Manage reminder scheduler (node-cron)
- User authentication via Discord user ID

**Key Features:**

- Real-time command execution
- Interactive buttons and modals
- Scheduled reminder delivery to Discord channels
- Auto-deletion of ephemeral responses

**Entry Point:** `src/bot.ts`

**Dependencies:**

- Discord.js 14.14.1
- node-cron 4.2.1
- Winston logger

---

### 2. REST API (`src/api/server.ts`)

**Purpose:** RESTful HTTP interface for PWA and external clients

**Responsibilities:**

- Express server setup with middleware configuration
- Route handling for all resource endpoints
- Google OAuth 2.0 authentication
- JWT token generation and validation
- CORS configuration for PWA integration
- Health check endpoint

**Key Features:**

- Standardized JSON response format
- Error handling middleware
- Input validation (Joi schemas)
- User isolation by Discord ID
- Token refresh mechanism

**Entry Point:** `src/api/server.ts`

**Dependencies:**

- Express 4.21.2
- cors 2.8.5
- jsonwebtoken 9.0.2
- google-auth-library 10.4.0

---

### 3. Database Layer (`database/`)

**Purpose:** PostgreSQL data persistence with Sequelize ORM

**Database Schema:**

```sql
-- Users (implicitly managed via Discord ID)

-- Tasks
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lists
CREATE TABLE lists (
  name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(255) NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (name, user_id, guild_id)
);

-- Notes
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  time VARCHAR(10) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  day_of_week INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budget
CREATE TABLE budget_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schedules
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  guild_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  recurrence VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**ORM Models:** Located in `database/models/`

---

### 4. Business Logic Layer

**Services:** `src/services/` (if exists) or embedded in routes

**Responsibilities:**

- Validation logic
- Data transformation
- Business rule enforcement
- Database query orchestration

**Service Pattern:**

```typescript
class TaskService {
  async createTask(userId: string, guildId: string, taskData: TaskData) {
    // 1. Validate input
    // 2. Transform data
    // 3. Persist to database
    // 4. Return result
  }
}
```

---

### 5. Authentication & Authorization

**Authentication Flow:**

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Google OAuth login
       ▼
┌─────────────┐
│   Google    │
└──────┬──────┘
       │
       │ 2. ID token
       ▼
┌─────────────┐
│ Bwaincell   │
│ API Server  │
└──────┬──────┘
       │
       │ 3. Verify token
       │ 4. Check email whitelist
       │ 5. Map email → Discord ID
       │ 6. Generate JWT
       │
       ▼
┌─────────────┐
│   Client    │
│ (JWT stored)│
└─────────────┘
```

**Authorization:**

- Discord Bot: User ID from interaction context
- REST API: User ID from JWT payload
- All queries filtered by `user_id` AND `guild_id`

**Security:**

- Email whitelist (`ALLOWED_GOOGLE_EMAILS`)
- JWT expiry: 1 hour (access token)
- Refresh token expiry: 7 days
- HTTPS enforcement (production)
- Input validation on all endpoints

---

## Data Flow

### Discord Command Execution

```
User types /task add "Buy milk"
         │
         ▼
┌─────────────────┐
│ Discord Gateway │
└────────┬────────┘
         │ CommandInteraction
         ▼
┌─────────────────┐
│  bot.ts         │
│ (event handler) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /commands/task/ │
│ add.ts          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Task Model      │
│ (Sequelize)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Response to     │
│ Discord Channel │
└─────────────────┘
```

### REST API Request

```
PWA sends GET /api/tasks
         │
         ▼
┌─────────────────┐
│ Express Router  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ authenticateToken│
│ middleware      │
└────────┬────────┘
         │ (JWT verified)
         ▼
┌─────────────────┐
│ /api/routes/    │
│ tasks.ts        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Task Model      │
│ (Sequelize)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JSON Response   │
│ { success, data }│
└─────────────────┘
```

---

## Module System

### TypeScript Path Aliases

Configured in `tsconfig.json`:

```json
{
  "paths": {
    "@shared/*": ["shared/*"],
    "@commands/*": ["src/commands/*"],
    "@handlers/*": ["src/handlers/*"],
    "@services/*": ["src/services/*"],
    "@database/*": ["database/*"]
  }
}
```

**Runtime Resolution:** `module-alias` package maps to compiled `dist/` paths

---

## Directory Structure

```
bwaincell/
├── src/                          # Source code
│   ├── api/                     # REST API implementation
│   │   ├── routes/              # API route handlers
│   │   │   ├── health.ts       # Health check endpoint
│   │   │   ├── tasks.ts        # Tasks CRUD operations
│   │   │   ├── lists.ts        # Lists CRUD operations
│   │   │   ├── notes.ts        # Notes CRUD operations
│   │   │   ├── reminders.ts    # Reminders CRUD operations
│   │   │   ├── budget.ts       # Budget CRUD operations
│   │   │   ├── schedule.ts     # Schedule CRUD operations
│   │   │   └── oauth.ts        # Google OAuth endpoints
│   │   ├── middleware/          # Express middleware
│   │   │   ├── oauth.ts        # JWT authentication
│   │   │   └── errorHandler.ts # Global error handling
│   │   └── server.ts            # Express app setup
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
│   │   ├── Task.ts
│   │   ├── List.ts
│   │   ├── Note.ts
│   │   ├── Reminder.ts
│   │   ├── Budget.ts
│   │   └── Schedule.ts
│   └── index.ts                 # Database initialization
├── shared/                       # Shared utilities
│   ├── utils/                   # Utility functions
│   │   ├── logger.ts           # Winston logger
│   │   └── dateFormatter.ts    # Date formatting utilities
│   └── validation/              # Input validation
│       └── env.ts               # Environment variable validation
├── utils/                        # Helper utilities
│   └── interactions.ts          # Discord interaction handlers
├── tests/                        # Test suites
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── dist/                         # Compiled JavaScript (build output)
├── docs/                         # Project documentation
├── trinity/                      # Development methodology
├── .env.example                  # Environment variable template
├── Dockerfile                    # Docker container definition
├── docker-compose.yml            # Multi-container setup
├── fly.toml                      # Fly.io deployment config
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project overview
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────┐
│      Developer Machine               │
├─────────────────────────────────────┤
│                                      │
│  ┌───────────────────────────────┐  │
│  │  ts-node-dev (hot reload)     │  │
│  │  - Bot running locally        │  │
│  │  - API server on :3000        │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  PostgreSQL (local)           │  │
│  │  - Port 5432                  │  │
│  └───────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

### Docker Deployment (Raspberry Pi)

```
┌─────────────────────────────────────┐
│      Raspberry Pi (sunny-pi)         │
├─────────────────────────────────────┤
│                                      │
│  ┌───────────────────────────────┐  │
│  │  Docker Container: bwaincell  │  │
│  │  - Bot process                │  │
│  │  - API server :3000           │  │
│  └───────────────┬───────────────┘  │
│                  │                   │
│  ┌───────────────▼───────────────┐  │
│  │  Docker Container: postgres   │  │
│  │  - Port 5433                  │  │
│  └───────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

### Cloud Deployment (Fly.io)

```
┌─────────────────────────────────────┐
│      Fly.io (Production)             │
├─────────────────────────────────────┤
│                                      │
│  ┌───────────────────────────────┐  │
│  │  Fly.io App                   │  │
│  │  - Bot process                │  │
│  │  - API server (HTTPS)         │  │
│  │  - Health monitoring          │  │
│  └───────────────┬───────────────┘  │
│                  │                   │
│                  ▼                   │
│  ┌───────────────────────────────┐  │
│  │  Managed PostgreSQL           │  │
│  │  (Fly.io Postgres)            │  │
│  └───────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

---

## Technology Stack

| Layer          | Technology       | Version | Purpose                  |
| -------------- | ---------------- | ------- | ------------------------ |
| **Runtime**    | Node.js          | 18+     | JavaScript runtime       |
| **Language**   | TypeScript       | 5.9.2   | Type-safe development    |
| **Discord**    | Discord.js       | 14.14.1 | Discord bot framework    |
| **API**        | Express          | 4.21.2  | REST API framework       |
| **Database**   | PostgreSQL       | 8.x     | Relational database      |
| **ORM**        | Sequelize        | 6.37.7  | Database abstraction     |
| **Auth**       | Google OAuth 2.0 | -       | User authentication      |
| **Tokens**     | JWT              | 9.0.2   | Session management       |
| **Scheduler**  | node-cron        | 4.2.1   | Reminder scheduling      |
| **Logger**     | Winston          | 3.17.0  | Application logging      |
| **Validation** | Joi              | 18.0.1  | Input validation         |
| **Testing**    | Jest             | 30.1.3  | Unit/integration testing |
| **Linting**    | ESLint           | 8.50.0  | Code quality             |
| **Formatting** | Prettier         | 3.0.0   | Code formatting          |

---

## Performance Characteristics

### Response Times

| Operation        | Target  | Notes              |
| ---------------- | ------- | ------------------ |
| Discord command  | < 500ms | Ephemeral response |
| API GET request  | < 200ms | Single resource    |
| API POST request | < 300ms | Database write     |
| Database query   | < 50ms  | Indexed queries    |

### Scalability

- **Vertical Scaling:** Supports multi-core Node.js clustering
- **Horizontal Scaling:** Stateless API (can run multiple instances)
- **Database:** PostgreSQL connection pooling (Sequelize)
- **Rate Limiting:** 100 requests/minute per IP

---

## Security Architecture

### Authentication Layers

1. **Discord Bot:** Discord user ID validation
2. **REST API:** Google OAuth 2.0 → JWT
3. **Email Whitelist:** Environment variable configuration

### Data Protection

- **User Isolation:** All queries filtered by `user_id` AND `guild_id`
- **SQL Injection:** Prevented by Sequelize ORM parameterization
- **XSS Prevention:** Input sanitization (Joi validation)
- **HTTPS:** Enforced in production (Fly.io)
- **Token Security:** JWT signed with secure secret
- **Environment Secrets:** Never committed to git (.gitignore)

---

## Monitoring & Observability

### Logging Strategy

**Winston Logger Levels:**

- `error` - Errors and exceptions with stack traces
- `warn` - Warnings and deprecations
- `info` - General application events
- `debug` - Detailed debugging (development only)

**Log Destinations:**

- Development: Console (colorized)
- Production: stdout (captured by Fly.io)

### Health Monitoring

- **Endpoint:** `GET /health`
- **Response Time:** < 50ms
- **Uptime Checks:** Fly.io automated monitoring
- **Database Health:** Sequelize connection pooling

---

## Error Handling

### Strategy

1. **Input Validation:** Joi schemas reject invalid requests (400 Bad Request)
2. **Business Logic Errors:** Custom error classes with specific codes
3. **Database Errors:** Sequelize error handling (500 Internal Server Error)
4. **Global Error Handler:** Express middleware catches unhandled errors
5. **Discord Errors:** Graceful error messages sent to users

### Error Flow

```
Request → Validation → Business Logic → Database
   ↓           ↓              ↓            ↓
  400         400            500          500
   │           │              │            │
   └───────────┴──────────────┴────────────┘
                    │
                    ▼
           Global Error Handler
                    │
                    ▼
          Standardized JSON Response
          { success: false, error: {...} }
```

---

## Future Architecture Considerations

### Scalability Enhancements

- **Caching Layer:** Redis for frequently accessed data
- **Message Queue:** Bull/BullMQ for background job processing
- **Database Sharding:** Partition by guild_id for large-scale deployment
- **CDN:** Static asset delivery for PWA

### Feature Additions

- **WebSocket Support:** Real-time updates for PWA
- **GraphQL API:** Flexible query interface
- **Microservices:** Split bot and API into separate deployments
- **Event Sourcing:** Audit trail for all data changes

---

## Additional Resources

- **Getting Started:** [docs/guides/getting-started.md](../guides/getting-started.md)
- **API Reference:** [docs/api/README.md](../api/README.md)
- **Discord Commands:** [docs/reference/discord-commands.md](../reference/discord-commands.md)
- **Deployment Guide:** [docs/guides/deployment.md](../guides/deployment.md)
- **Development Guide:** [docs/architecture/development.md](development.md)

---

**Last Updated:** 2026-01-09
**Version:** 1.0.0
