# Getting Started with Bwaincell

**Version:** 2.0.0
**Last Updated** 2026-01-12

## Overview

Bwaincell is a unified monorepo productivity platform providing task management, reminders, lists, notes, budgets, and scheduling through three integrated interfaces: Discord Bot, REST API, and Progressive Web App.

## Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- PostgreSQL 15 or higher
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Google OAuth 2.0 Credentials ([Google Cloud Console](https://console.cloud.google.com))

## Installation

```bash
# Clone repository
git clone https://github.com/lukadfagundes/bwaincell.git
cd bwaincell

# Install dependencies for all workspaces
npm install

# Build shared types package (required before running backend/frontend)
npm run build:shared

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# Required: Discord bot token, Google OAuth credentials, PostgreSQL connection, JWT secret
```

## Project Structure

```
bwaincell/
├── backend/              # Discord bot + REST API (Express + Discord.js)
│   ├── src/             # Source code (bot.ts, api/, types/)
│   │   └── api/        # Express API (routes/, middleware/)
│   ├── commands/        # Discord slash commands
│   ├── database/        # Sequelize models, migrations, schema
│   ├── utils/           # Utilities (logger, validators, interactions)
│   └── tests/           # Backend tests
├── frontend/            # Next.js 14.2+ PWA
│   ├── app/            # App Router (dashboard/, api/)
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks (useTasks, useLists, etc.)
│   ├── lib/            # API client, utilities
│   └── public/         # Static assets, PWA manifest
├── shared/              # Shared TypeScript types across workspaces
│   ├── types/          # Type definitions
│   ├── utils/          # Shared utilities (logger)
│   └── validation/     # Shared validators
├── tests/               # Integration and E2E tests
├── docker-compose.yml   # Docker configuration
└── package.json         # Monorepo workspace configuration
```

## Quick Start

### Backend (Discord Bot + REST API)

```bash
# Development mode (starts both Discord bot and API server)
npm run dev:backend

# Production build and start
npm run build:backend
npm start --workspace=backend

# Deploy Discord slash commands
npm run deploy --workspace=backend
```

**Backend runs on:** http://localhost:3000

### Frontend (Progressive Web App)

```bash
# Development mode (port 3010)
npm run dev:frontend

# Production build
npm run build:frontend
npm start --workspace=frontend
```

**Frontend runs on:** http://localhost:3010

### Full Stack Development

```bash
# Start backend and frontend concurrently
npm run dev

# Run tests across all workspaces
npm test

# Lint all workspaces
npm run lint
```

## Environment Configuration

### Required Environment Variables

See [.env.example](.env.example) for the complete list. Key variables:

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id

# PostgreSQL Database
DATABASE_URL=postgresql://user:password@localhost:5433/bwaincell

# REST API
API_PORT=3000
JWT_SECRET=generate_with_openssl_rand_base64_32

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# User-Discord ID Mapping
USER1_EMAIL=user@gmail.com
USER1_DISCORD_ID=123456789
```

## Database Setup

### PostgreSQL Initialization

```bash
# Create database
psql -U postgres -c "CREATE DATABASE bwaincell;"

# Create user
psql -U postgres -c "CREATE USER bwaincell WITH PASSWORD 'your_password';"

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE bwaincell TO bwaincell;"
```

**Note:** Database migrations run automatically on backend startup using Sequelize.

## Next Steps

- [API Documentation](../api/) - REST API endpoints and authentication flow
- [Architecture Overview](../architecture/overview.md) - System design and tech stack
- [Discord Bot Commands](../api/discord-commands.md) - Complete command reference

## Common Issues

### Module not found errors

- Run `npm install` in the project root
- Run `npm run build:shared` to build shared types package
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`

### Database connection errors

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env matches your PostgreSQL credentials
- Ensure PostgreSQL port (5433 or 5432) is not blocked by firewall

### Discord bot not responding

- Verify BOT_TOKEN is correct in .env
- Deploy slash commands: `npm run deploy --workspace=backend`
- Check bot has proper permissions in Discord server
- Check logs: `docker logs bwaincell-bot` (if using Docker)

### JWT authentication errors

- Generate secure JWT_SECRET: `openssl rand -base64 32`
- Verify Google OAuth credentials are correct
- Check user email is mapped to Discord ID in .env

## Support

- GitHub Issues: [github.com/lukadfagundes/bwaincell/issues](https://github.com/lukadfagundes/bwaincell/issues)
- Documentation: [docs/](../)
