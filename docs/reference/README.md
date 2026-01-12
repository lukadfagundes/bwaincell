# Reference Documentation

Quick reference for CLI commands, environment variables, dependencies, glossary, and quick command lookup.

## Available References

- **[Reference Documentation](README.md)** - CLI commands, environment variables, dependencies (this file)
- **[Quick Reference](quick-reference.md)** - Fast lookup for common commands, Discord bot commands, API endpoints, environment variables, file locations, and troubleshooting quick fixes
- **[Glossary](glossary.md)** - Technical terms, project-specific concepts, and acronyms (90+ terms)

---

## CLI Commands

### npm Scripts (Monorepo Root)

**Development:**

- **`npm run dev`** - Start backend and frontend concurrently
- **`npm run dev:backend`** - Start backend only (Discord bot + API on port 3000)
- **`npm run dev:frontend`** - Start frontend only (Next.js on port 3010)
- **`npm run dev:shared`** - Watch shared types for changes

**Build:**

- **`npm run build`** - Build all workspaces (shared → backend → frontend)
- **`npm run build:shared`** - Build shared types package
- **`npm run build:backend`** - Build backend only
- **`npm run build:frontend`** - Build frontend only
- **`npm run build:all`** - TypeScript build for all workspaces

**Testing:**

- **`npm test`** - Run tests in all workspaces
- **`npm run test:backend`** - Run backend tests
- **`npm run test:frontend`** - Run frontend tests
- **`npm run test:watch`** - Run tests in watch mode
- **`npm run test:coverage`** - Generate coverage reports

**Linting:**

- **`npm run lint`** - Lint all workspaces
- **`npm run lint:fix`** - Auto-fix linting errors
- **`npm run lint:backend`** - Lint backend only
- **`npm run lint:frontend`** - Lint frontend only

**Type Checking:**

- **`npm run typecheck`** - TypeScript compilation check (no emit)
- **`npm run typecheck:watch`** - Watch mode for type checking

**Cleanup:**

- **`npm run clean`** - Remove build artifacts from all workspaces
- **`npm run clean:backend`** - Clean backend only
- **`npm run clean:frontend`** - Clean frontend only
- **`npm run clean:shared`** - Clean shared types only

**Docker:**

- **`npm run docker:build`** - Build Docker containers
- **`npm run docker:up`** - Start containers in detached mode
- **`npm run docker:down`** - Stop and remove containers
- **`npm run docker:logs`** - View logs from all containers
- **`npm run docker:backend`** - View backend container logs
- **`npm run docker:frontend`** - View frontend container logs

### Backend Scripts

**Development:**

- **`npm run dev --workspace=backend`** - Start Discord bot + API with hot reload
- **`npm run start --workspace=backend`** - Start production backend
- **`npm run deploy --workspace=backend`** - Deploy Discord slash commands

**Build:**

- **`npm run build --workspace=backend`** - Compile TypeScript to JavaScript
- **`npm run clean --workspace=backend`** - Remove dist/ directory
- **`npm run rebuild --workspace=backend`** - Clean + build

**Testing:**

- **`npm run test --workspace=backend`** - Run backend tests
- **`npm run test:watch --workspace=backend`** - Watch mode
- **`npm run test:coverage --workspace=backend`** - Generate coverage
- **`npm run test:coverage-report --workspace=backend`** - HTML coverage report
- **`npm run coverage:threshold --workspace=backend`** - Enforce 80% coverage

**Quality:**

- **`npm run lint --workspace=backend`** - ESLint check
- **`npm run lint:fix --workspace=backend`** - Auto-fix linting errors
- **`npm run typecheck --workspace=backend`** - TypeScript compilation check
- **`npm run format --workspace=backend`** - Format with Prettier
- **`npm run format:check --workspace=backend`** - Check formatting

**Utilities:**

- **`npm run generate-assets --workspace=backend`** - Generate bot assets

### Frontend Scripts

**Development:**

- **`npm run dev --workspace=frontend`** - Start Next.js dev server (port 3010)
- **`npm run build --workspace=frontend`** - Build production frontend
- **`npm run start --workspace=frontend`** - Start production server
- **`npm run lint --workspace=frontend`** - Next.js ESLint check

**Database (Prisma):**

- **`npm run postinstall --workspace=frontend`** - Generate Prisma client (auto)

## Environment Variables

### Required Variables

**Discord Bot Configuration:**

- `BOT_TOKEN` - Discord bot token (Discord Developer Portal)
- `CLIENT_ID` - Discord application client ID
- `GUILD_ID` - Discord server ID for testing
- `DEFAULT_REMINDER_CHANNEL` - Channel ID for reminder announcements

**Database Configuration:**

- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://bwaincell:password@localhost:5433/bwaincell`
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - PostgreSQL database name

**API Configuration:**

- `API_PORT` - Express API port (default: 3000)
- `PORT` - Alias for API_PORT
- `JWT_SECRET` - JWT access token secret (generate with `openssl rand -base64 32`)

**Google OAuth Configuration:**

- `GOOGLE_CLIENT_ID` - Google OAuth client ID (.apps.googleusercontent.com)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ALLOWED_GOOGLE_EMAILS` - Comma-separated list of authorized emails

**User Mapping (Email → Discord ID):**

- `USER1_EMAIL` - First user's email
- `USER1_DISCORD_ID` - First user's Discord user ID
- `USER2_EMAIL` - Second user's email
- `USER2_DISCORD_ID` - Second user's Discord user ID

**Frontend Configuration (frontend/.env.local):**

- `NEXTAUTH_URL` - NextAuth callback URL (e.g., `http://localhost:3010`)
- `NEXTAUTH_SECRET` - NextAuth session secret
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `http://localhost:3000`)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID (public)

**Application Settings:**

- `NODE_ENV` - Environment mode (`development` | `production` | `test`)
- `TIMEZONE` - Timezone for DateTime operations (e.g., `America/Chicago`)
- `DELETE_COMMAND_AFTER` - Milliseconds before deleting Discord responses (default: 5000)

### Optional Variables

- `DEPLOYMENT_MODE` - Deployment platform identifier (e.g., `pi`, `fly`)

### Generate Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

## Dependencies

### Production Dependencies (Root)

**Core Libraries:**

- `discord.js` ^14.14.1 - Discord bot framework
- `express` ^4.21.2 - REST API server
- `sequelize` ^6.37.7 - PostgreSQL ORM
- `pg` ^8.16.3 - PostgreSQL driver
- `dotenv` ^17.2.2 - Environment variables

**Authentication:**

- `google-auth-library` ^10.4.0 - Google OAuth verification
- `googleapis` ^160.0.0 - Google APIs client
- `jsonwebtoken` ^9.0.2 - JWT token generation/verification

**Utilities:**

- `winston` ^3.17.0 - Structured logging
- `joi` ^18.0.1 - Input validation
- `luxon` ^3.7.2 - DateTime operations
- `node-cron` ^4.2.1 - Task scheduling
- `module-alias` ^2.2.3 - Module path aliases
- `cors` ^2.8.5 - CORS middleware

**TypeScript:**

- `@types/*` packages for type definitions

### Development Dependencies (Root)

**Testing:**

- `jest` ^30.1.3 - Test framework
- `ts-jest` ^29.4.4 - TypeScript Jest transformer
- `supertest` ^7.1.4 - HTTP assertion library
- `@testing-library/jest-dom` ^6.8.0 - DOM testing utilities
- `c8` ^10.1.3 - Code coverage

**TypeScript:**

- `typescript` ^5.9.2 - TypeScript compiler
- `ts-node` ^10.9.2 - TypeScript execution
- `ts-node-dev` ^2.0.0 - TypeScript hot reload
- `tsconfig-paths` ^4.2.0 - Path mapping support

**Linting:**

- `eslint` ^8.50.0 - JavaScript/TypeScript linter
- `@typescript-eslint/eslint-plugin` ^8.44.1 - TypeScript ESLint rules
- `@typescript-eslint/parser` ^8.44.1 - TypeScript parser
- `eslint-config-prettier` ^10.1.8 - Prettier integration
- `eslint-plugin-prettier` ^5.5.4 - Prettier plugin

**Formatting:**

- `prettier` ^3.0.0 - Code formatter
- `markdownlint-cli` ^0.47.0 - Markdown linter

**Build Tools:**

- `concurrently` ^9.1.2 - Run multiple npm scripts
- `dotenv-cli` ^11.0.0 - Load .env for scripts
- `husky` ^9.1.7 - Git hooks
- `lint-staged` ^16.2.3 - Pre-commit linting

**Utilities:**

- `glob` ^11.0.3 - File pattern matching
- `coverage-badge-creator` ^1.0.21 - Coverage badges

### Frontend Dependencies

**Framework:**

- `next` ^14.2.35 - React framework
- `react` ^18.3.1 - UI library
- `react-dom` ^18.3.1 - React DOM renderer

**Authentication:**

- `next-auth` ^4.24.7 - Authentication for Next.js
- `@auth/core` ^0.41.1 - Auth.js core

**Data Fetching:**

- `@tanstack/react-query` ^5.90.2 - Data fetching + caching
- `@tanstack/react-query-devtools` ^5.90.2 - DevTools

**State Management:**

- `zustand` ^5.0.8 - Lightweight state management

**UI Components (Radix UI + shadcn/ui):**

- `@radix-ui/react-alert-dialog` ^1.1.15
- `@radix-ui/react-avatar` ^1.1.10
- `@radix-ui/react-checkbox` ^1.3.3
- `@radix-ui/react-dialog` ^1.1.15
- `@radix-ui/react-dropdown-menu` ^2.1.16
- `@radix-ui/react-label` ^2.1.7
- `@radix-ui/react-select` ^2.2.6
- `@radix-ui/react-separator` ^1.1.7
- `@radix-ui/react-slot` ^1.2.3
- `@radix-ui/react-toast` ^1.2.15

**Database:**

- `@prisma/client` 5.22.0 - Prisma client
- `prisma` 5.22.0 - Prisma CLI

**Styling:**

- `tailwindcss` ^3.4.1 - CSS framework
- `tailwindcss-animate` ^1.0.7 - Animation utilities
- `autoprefixer` ^10.4.21 - CSS vendor prefixes
- `postcss` ^8.5.6 - CSS transformer
- `class-variance-authority` ^0.7.1 - Component variants
- `clsx` ^2.1.1 - Class name utility
- `tailwind-merge` ^3.3.1 - Merge Tailwind classes

**Utilities:**

- `date-fns` ^4.1.0 - Date utilities
- `lucide-react` ^0.545.0 - Icon library
- `recharts` ^3.2.1 - Charting library
- `react-day-picker` ^9.11.0 - Date picker component

**PWA:**

- `next-pwa` ^5.6.0 - PWA plugin for Next.js

## Version Requirements

- **Node.js:** ≥ 18.0.0
- **npm:** ≥ 9.0.0
- **PostgreSQL:** ≥ 15.0
- **TypeScript:** 5.9.2 (strict mode)

## Security & Performance References

### Security Best Practices

**Quick Reference:**

- **OWASP Top 10:** See [Security Best Practices](../guides/security-best-practices.md#owasp-top-10-mitigation)
- **JWT Security:** Token storage, expiration, rotation - [Guide](../guides/security-best-practices.md#jwt-security)
- **OAuth2 Security:** PKCE, state parameter - [Guide](../guides/security-best-practices.md#oauth2-security)
- **Secrets Management:** Never commit .env files - [Guide](../guides/security-best-practices.md#secrets-management)
- **Rate Limiting:** API protection - [Guide](../guides/security-best-practices.md#rate-limiting)

### Performance Optimization

**Quick Reference:**

- **Database Performance:** Indexes, connection pooling - [Guide](../guides/performance-optimization.md#database-performance)
- **API Performance:** Response compression, caching - [Guide](../guides/performance-optimization.md#api-performance)
- **Frontend Performance:** Code splitting, lazy loading - [Guide](../guides/performance-optimization.md#frontend-performance)
- **Caching Strategies:** In-memory, Redis, HTTP caching - [Guide](../guides/performance-optimization.md#caching-strategies)
- **Query Optimization:** N+1 queries, eager loading - [Guide](../guides/performance-optimization.md#query-optimization)

### Monitoring & Logging

**Quick Reference:**

- **Winston Logger:** Configuration and usage - [Guide](../guides/monitoring-and-logging.md#winston-logger-configuration)
- **Log Levels:** When to use error, warn, info, debug - [Guide](../guides/monitoring-and-logging.md#log-levels)
- **Structured Logging:** JSON format best practices - [Guide](../guides/monitoring-and-logging.md#structured-logging)
- **Application Monitoring:** Health checks, uptime - [Guide](../guides/monitoring-and-logging.md#application-monitoring)
- **Debugging with Logs:** Log searching techniques - [Guide](../guides/monitoring-and-logging.md#debugging-with-logs)

## Related Documentation

- [Getting Started Guide](../guides/getting-started.md)
- [API Documentation](../api/)
- [Architecture Overview](../architecture/overview.md)
- [Security Best Practices](../guides/security-best-practices.md)
- [Performance Optimization](../guides/performance-optimization.md)
- [Monitoring and Logging](../guides/monitoring-and-logging.md)
