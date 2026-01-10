# Getting Started with Bwaincell

Welcome to Bwaincell - a dual-purpose productivity platform providing both Discord bot functionality and a secure REST API for task management, reminders, lists, notes, budgets, and scheduling.

---

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 8+ database ([Download](https://www.postgresql.org/download/))
- **Discord Bot Token** ([Discord Developer Portal](https://discord.com/developers/applications))
- **Google OAuth 2.0 Credentials** ([Google Cloud Console](https://console.cloud.google.com/))

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/bwaincell.git
cd bwaincell
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

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

**Generate JWT Secret:**

```bash
openssl rand -base64 32
```

---

## Setup Database

### 1. Create PostgreSQL Database

```bash
# Using PostgreSQL CLI
createdb bwaincell

# Or using psql
psql -U postgres
CREATE DATABASE bwaincell;
\q
```

### 2. Configure Database Connection

Update `DATABASE_URL` in `.env`:

```env
# For local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/bwaincell

# For Docker Compose
DATABASE_URL=postgresql://bwaincell:password@postgres:5433/bwaincell
```

---

## Build and Deploy

### 1. Build TypeScript

Compile TypeScript to JavaScript:

```bash
npm run build
```

This creates compiled files in the `dist/` directory.

### 2. Deploy Discord Commands

Register slash commands with Discord:

```bash
npm run deploy
```

This registers all commands defined in `commands/` with your Discord bot.

---

## Start Application

### Development Mode (Hot Reload)

```bash
npm run dev
```

**Features:**

- Automatic restart on file changes
- TypeScript compilation on-the-fly
- Detailed logging for debugging

### Production Mode

```bash
npm start
```

**Features:**

- Runs compiled JavaScript from `dist/`
- Optimized performance
- Production-level logging

---

## Verify Installation

### 1. Check Discord Bot Status

In your Discord server, verify:

- Bot appears online
- Slash commands are available (type `/`)

Try a test command:

```
/task list
```

### 2. Check API Server

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-09T12:00:00Z"
}
```

### 3. Test Authentication

Authenticate with Google OAuth and test a protected endpoint:

```bash
# 1. Get JWT token from /api/auth/google/verify
# 2. Use token to access protected endpoint

curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/tasks
```

---

## Quick Setup Script

For a fresh installation with all steps combined:

```bash
npm run setup && npm start
```

This runs:

1. `npm run build` - Compile TypeScript
2. `npm run deploy` - Register Discord commands
3. `npm start` - Start production server

---

## Troubleshooting

### Bot Not Responding

**Issue:** Discord bot doesn't respond to commands

**Solutions:**

1. Verify `DISCORD_TOKEN` is correct in `.env`
2. Check bot has necessary permissions in Discord server:
   - Read Messages/View Channels
   - Send Messages
   - Use Slash Commands
3. Ensure commands are deployed: `npm run deploy`
4. Check logs: `docker-compose logs -f` or console output

### Database Connection Failed

**Issue:** `Error: connect ECONNREFUSED`

**Solutions:**

1. Verify PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` is correct in `.env`
3. Ensure database exists: `psql -l | grep bwaincell`
4. Test connection: `psql $DATABASE_URL`

### Authentication Errors

**Issue:** JWT or Google OAuth errors

**Solutions:**

1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
2. Check user email is whitelisted in `ALLOWED_GOOGLE_EMAILS`
3. Ensure `JWT_SECRET` is set and consistent across restarts
4. Check token expiry (tokens expire after 1 hour)

### Port Already in Use

**Issue:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**

1. Change `API_PORT` in `.env` to a different port
2. Kill existing process: `lsof -ti:3000 | xargs kill -9` (Linux/Mac)
3. Use different port: `PORT=3001 npm start`

---

## Next Steps

Now that you have Bwaincell installed and running:

1. **Explore Discord Commands** - See [Discord Commands Guide](../reference/discord-commands.md)
2. **Learn the API** - See [API Documentation](../api/README.md)
3. **Deploy to Production** - See [Deployment Guide](deployment.md)
4. **Add Features** - See [Development Guide](../architecture/development.md)

---

## Getting Help

- **API Reference:** [docs/api/README.md](../api/README.md)
- **Architecture Overview:** [docs/architecture/overview.md](../architecture/overview.md)
- **Source Code:** [src/README.md](../../src/README.md)
- **Discord.js Guide:** [https://discordjs.guide/](https://discordjs.guide/)
- **Express Documentation:** [https://expressjs.com/](https://expressjs.com/)

---

**Last Updated:** 2026-01-09
**Version:** 1.0.0
