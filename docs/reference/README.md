# Bwaincell Reference Documentation

Quick reference for Discord commands, environment variables, and CLI scripts.

---

## Discord Commands Reference

Complete list of Discord slash commands available in Bwaincell.

### Task Commands

| Command                       | Description           | Parameters                                           |
| ----------------------------- | --------------------- | ---------------------------------------------------- |
| `/task add <text> [due_date]` | Create a new task     | `text` (required), `due_date` (optional, YYYY-MM-DD) |
| `/task list`                  | View all active tasks | None                                                 |
| `/task complete <task_id>`    | Mark task as complete | `task_id` (required, integer)                        |
| `/task delete <task_id>`      | Delete a task         | `task_id` (required, integer)                        |

**Examples:**

```
/task add Buy groceries 2026-01-15
/task list
/task complete 1
/task delete 2
```

---

### List Commands

| Command                           | Description            | Parameters                                |
| --------------------------------- | ---------------------- | ----------------------------------------- |
| `/list create <name>`             | Create a new list      | `name` (required, string)                 |
| `/list add <list_name> <item>`    | Add item to list       | `list_name` (required), `item` (required) |
| `/list view <list_name>`          | View list items        | `list_name` (required)                    |
| `/list toggle <list_name> <item>` | Toggle item completion | `list_name` (required), `item` (required) |
| `/list remove <list_name> <item>` | Remove item from list  | `list_name` (required), `item` (required) |
| `/list delete <list_name>`        | Delete entire list     | `list_name` (required)                    |
| `/list all`                       | View all lists         | None                                      |

**Examples:**

```
/list create Groceries
/list add Groceries Milk
/list view Groceries
/list toggle Groceries Milk
/list remove Groceries Eggs
/list delete Groceries
/list all
```

---

### Reminder Commands

| Command                                                    | Description               | Parameters                                                                                            |
| ---------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/reminder add <message> <time> <frequency> [day_of_week]` | Create reminder           | `message` (required), `time` (HH:MM), `frequency` (once/daily/weekly), `day_of_week` (0-6 for weekly) |
| `/reminder list`                                           | View all active reminders | None                                                                                                  |
| `/reminder delete <reminder_id>`                           | Delete a reminder         | `reminder_id` (required, integer)                                                                     |

**Frequency Options:**

- `once` - One-time reminder
- `daily` - Repeats every day
- `weekly` - Repeats every week on specified day

**Day of Week (for weekly reminders):**

- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

**Examples:**

```
/reminder add Take medication 09:00 daily
/reminder add Team meeting 14:00 weekly 1
/reminder add Doctor appointment 15:30 once
/reminder list
/reminder delete 1
```

---

### Budget Commands

| Command                                                | Description           | Parameters                                                                                            |
| ------------------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------- |
| `/budget add <amount> <category> <type> [description]` | Add transaction       | `amount` (required, number), `category` (required), `type` (expense/income), `description` (optional) |
| `/budget summary [month]`                              | View budget summary   | `month` (optional, YYYY-MM format)                                                                    |
| `/budget list`                                         | View all transactions | None                                                                                                  |
| `/budget delete <transaction_id>`                      | Delete transaction    | `transaction_id` (required, integer)                                                                  |

**Transaction Types:**

- `expense` - Money spent
- `income` - Money received

**Examples:**

```
/budget add 50.00 groceries expense Weekly shopping
/budget add 3000.00 salary income January paycheck
/budget summary 2026-01
/budget list
/budget delete 1
```

---

### Note Commands

| Command                      | Description             | Parameters                                                       |
| ---------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `/note add <content> [tags]` | Create a note           | `content` (required, string), `tags` (optional, comma-separated) |
| `/note list`                 | View all notes          | None                                                             |
| `/note search <keyword>`     | Search notes by keyword | `keyword` (required, string)                                     |
| `/note delete <note_id>`     | Delete a note           | `note_id` (required, integer)                                    |

**Examples:**

```
/note add Meeting notes from Jan 9 work,meeting
/note list
/note search meeting
/note delete 1
```

---

### Schedule Commands

| Command                                                      | Description        | Parameters                                                                                                    |
| ------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `/schedule add <title> <start_time> [end_time] [recurrence]` | Create schedule    | `title` (required), `start_time` (required, YYYY-MM-DD HH:MM), `end_time` (optional), `recurrence` (optional) |
| `/schedule list`                                             | View all schedules | None                                                                                                          |
| `/schedule delete <schedule_id>`                             | Delete schedule    | `schedule_id` (required, integer)                                                                             |

**Examples:**

```
/schedule add Team meeting 2026-01-10 14:00 15:00 weekly
/schedule list
/schedule delete 1
```

---

## Environment Variables

Complete list of environment variables required for Bwaincell configuration.

### Discord Configuration (Required)

| Variable                   | Description                           | Example                                |
| -------------------------- | ------------------------------------- | -------------------------------------- |
| `BOT_TOKEN`                | Discord bot token                     | `MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GhIjKl...` |
| `CLIENT_ID`                | Discord application client ID         | `1234567890123456789`                  |
| `GUILD_ID`                 | Discord server (guild) ID for testing | `9876543210987654321`                  |
| `DEFAULT_REMINDER_CHANNEL` | Channel ID for reminder announcements | `1111222233334444555`                  |

**How to Get:**

1. **Bot Token:** [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Token
2. **Client ID:** Discord Developer Portal → Your App → General Information → Application ID
3. **Guild ID:** Discord → Server Settings → Widget → Server ID
4. **Channel ID:** Discord → Right-click channel → Copy ID (Enable Developer Mode first)

---

### Google OAuth Configuration (Required)

| Variable                | Description                                 | Example                                         |
| ----------------------- | ------------------------------------------- | ----------------------------------------------- |
| `GOOGLE_CLIENT_ID`      | Google OAuth 2.0 client ID                  | `123456789012-abc...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth 2.0 client secret              | `GOCSPX-abc123...`                              |
| `ALLOWED_GOOGLE_EMAILS` | Comma-separated whitelist of allowed emails | `user1@gmail.com,user2@gmail.com`               |

**How to Get:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

---

### JWT Configuration (Required)

| Variable     | Description                       | Example                          |
| ------------ | --------------------------------- | -------------------------------- |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_secure_random_secret_here` |

**Generate Secure Secret:**

```bash
openssl rand -base64 32
```

**Important:** Never commit this to version control!

---

### Database Configuration (Required)

| Variable            | Description                           | Example                                               |
| ------------------- | ------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string          | `postgresql://user:password@localhost:5432/bwaincell` |
| `POSTGRES_USER`     | PostgreSQL username (for Docker)      | `bwaincell`                                           |
| `POSTGRES_PASSWORD` | PostgreSQL password (for Docker)      | `secure_password_here`                                |
| `POSTGRES_DB`       | PostgreSQL database name (for Docker) | `bwaincell`                                           |

**Connection String Format:**

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

**Examples:**

- Local development: `postgresql://postgres:password@localhost:5432/bwaincell`
- Docker Compose: `postgresql://bwaincell:password@postgres:5433/bwaincell`
- Production: `postgresql://user:pass@prod-db.example.com:5432/bwaincell`

---

### User Mapping (Required for API)

Maps email addresses to Discord user IDs for API authentication.

| Variable           | Description                 | Example              |
| ------------------ | --------------------------- | -------------------- |
| `USER1_EMAIL`      | First user's email address  | `user@gmail.com`     |
| `USER1_DISCORD_ID` | First user's Discord ID     | `123456789012345678` |
| `USER2_EMAIL`      | Second user's email address | `partner@gmail.com`  |
| `USER2_DISCORD_ID` | Second user's Discord ID    | `987654321098765432` |

**Add More Users:**

```env
USER3_EMAIL=third@gmail.com
USER3_DISCORD_ID=555666777888999000
```

**How to Get Discord User ID:**

1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click your username → Copy ID

---

### API Configuration

| Variable   | Description                                   | Default                 |
| ---------- | --------------------------------------------- | ----------------------- |
| `API_PORT` | Express server port                           | `3000`                  |
| `PORT`     | Alternative port variable (for compatibility) | `3000`                  |
| `PWA_URL`  | PWA frontend URL for CORS                     | `http://localhost:3001` |

---

### Application Settings

| Variable               | Description                                         | Default               |
| ---------------------- | --------------------------------------------------- | --------------------- |
| `TIMEZONE`             | Timezone for reminders and scheduled tasks          | `America/Los_Angeles` |
| `DELETE_COMMAND_AFTER` | Milliseconds before auto-deleting Discord responses | `5000`                |
| `NODE_ENV`             | Environment mode                                    | `development`         |
| `DEPLOYMENT_MODE`      | Deployment platform identifier                      | `local`               |

**Valid Timezones:**

- `America/New_York`
- `America/Chicago`
- `America/Los_Angeles`
- `UTC`
- See [IANA timezone database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

---

### Optional Configuration

| Variable              | Description                        | Example                                    |
| --------------------- | ---------------------------------- | ------------------------------------------ |
| `LOG_LEVEL`           | Winston log level                  | `info` (production), `debug` (development) |
| `GOOGLE_CALENDAR_ID`  | Google Calendar ID for integration | `primary`                                  |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI                 | `http://localhost:3000/oauth2callback`     |

---

## NPM Scripts

All available npm scripts for development, testing, and deployment.

### Development Scripts

| Script    | Command           | Description                              |
| --------- | ----------------- | ---------------------------------------- |
| `dev`     | `npm run dev`     | Start development server with hot reload |
| `build`   | `npm run build`   | Compile TypeScript to JavaScript         |
| `clean`   | `npm run clean`   | Remove compiled `dist/` directory        |
| `rebuild` | `npm run rebuild` | Clean and rebuild (`clean` + `build`)    |

---

### Production Scripts

| Script        | Command               | Description                                      |
| ------------- | --------------------- | ------------------------------------------------ |
| `start`       | `npm start`           | Start production server (requires `build` first) |
| `deploy`      | `npm run deploy`      | Deploy Discord slash commands                    |
| `setup`       | `npm run setup`       | Build and deploy commands (`build` + `deploy`)   |
| `start:fresh` | `npm run start:fresh` | Setup and start (`setup` + `start`)              |

---

### Testing Scripts

| Script                 | Command                        | Description                    |
| ---------------------- | ------------------------------ | ------------------------------ |
| `test`                 | `npm test`                     | Run all tests                  |
| `test:watch`           | `npm run test:watch`           | Run tests in watch mode        |
| `test:coverage`        | `npm run test:coverage`        | Generate coverage report       |
| `test:coverage-report` | `npm run test:coverage-report` | Generate HTML coverage report  |
| `coverage:threshold`   | `npm run coverage:threshold`   | Enforce 80% coverage threshold |

**Coverage Reports:**

- Text: Console output
- HTML: `coverage/index.html`

---

### Code Quality Scripts

| Script         | Command                | Description                         |
| -------------- | ---------------------- | ----------------------------------- |
| `lint`         | `npm run lint`         | Check code style with ESLint        |
| `lint:fix`     | `npm run lint:fix`     | Fix code style issues automatically |
| `typecheck`    | `npm run typecheck`    | TypeScript type checking (no emit)  |
| `format`       | `npm run format`       | Format code with Prettier           |
| `format:check` | `npm run format:check` | Check code formatting (CI)          |

---

### Utility Scripts

| Script            | Command                   | Description                        |
| ----------------- | ------------------------- | ---------------------------------- |
| `generate-assets` | `npm run generate-assets` | Generate static assets             |
| `prepare`         | `npm run prepare`         | Install Husky git hooks (auto-run) |

---

## Git Hooks (Husky + lint-staged)

Automated code quality checks on commit.

### Pre-commit Hooks

**TypeScript Files (\*.ts):**

1. ESLint with `--fix`
2. Prettier formatting

**Other Files (_.js, _.jsx, _.tsx, _.json, \*.md):**

1. Prettier formatting

**Configuration:**

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.{js,jsx,tsx,json,md}": ["prettier --write"]
  }
}
```

---

## Docker Commands

Useful Docker commands for deployment.

### Docker Compose

| Command                                | Description                  |
| -------------------------------------- | ---------------------------- |
| `docker-compose up -d`                 | Start services in background |
| `docker-compose logs -f`               | View logs (follow mode)      |
| `docker-compose logs -f bwaincell-bot` | View bot logs only           |
| `docker-compose logs -f postgres`      | View database logs only      |
| `docker-compose down`                  | Stop and remove containers   |
| `docker-compose restart`               | Restart all services         |
| `docker-compose ps`                    | List running containers      |
| `docker-compose exec bwaincell-bot sh` | Access bot container shell   |

---

### Docker (Standalone)

| Command                                   | Description            |
| ----------------------------------------- | ---------------------- |
| `docker build -t bwaincell .`             | Build Docker image     |
| `docker run -d --env-file .env bwaincell` | Run container          |
| `docker logs bwaincell`                   | View container logs    |
| `docker exec -it bwaincell sh`            | Access container shell |
| `docker stop bwaincell`                   | Stop container         |
| `docker rm bwaincell`                     | Remove container       |

---

## Fly.io Commands

Deployment commands for Fly.io hosting.

| Command                     | Description                  |
| --------------------------- | ---------------------------- |
| `fly auth login`            | Login to Fly.io              |
| `fly deploy`                | Deploy application           |
| `fly logs`                  | View application logs        |
| `fly open`                  | Open deployed app in browser |
| `fly status`                | Check app status             |
| `fly secrets set KEY=value` | Set environment variable     |
| `fly secrets list`          | List all secrets             |
| `fly ssh console`           | SSH into app instance        |
| `fly scale count 2`         | Scale to 2 instances         |

**Set Secrets:**

```bash
fly secrets set DISCORD_TOKEN=your_token
fly secrets set GOOGLE_CLIENT_ID=your_client_id
fly secrets set JWT_SECRET=your_secret
fly secrets set DATABASE_URL=your_database_url
```

---

## Database Commands

PostgreSQL database management commands.

### Local PostgreSQL

| Command                          | Description             |
| -------------------------------- | ----------------------- |
| `createdb bwaincell`             | Create database         |
| `dropdb bwaincell`               | Delete database         |
| `psql bwaincell`                 | Connect to database     |
| `psql -l`                        | List all databases      |
| `pg_isready`                     | Check PostgreSQL status |
| `pg_dump bwaincell > backup.sql` | Backup database         |
| `psql bwaincell < backup.sql`    | Restore database        |

---

### Docker PostgreSQL

| Command                                                                    | Description         |
| -------------------------------------------------------------------------- | ------------------- |
| `docker-compose exec postgres psql -U bwaincell`                           | Connect to database |
| `docker-compose exec postgres pg_dump -U bwaincell bwaincell > backup.sql` | Backup              |
| `docker-compose exec postgres psql -U bwaincell < backup.sql`              | Restore             |

---

## Troubleshooting Quick Reference

### Bot Not Responding

```bash
# Check bot is running
docker-compose ps

# View bot logs
docker-compose logs -f bwaincell-bot

# Verify commands are deployed
npm run deploy

# Check Discord token
echo $DISCORD_TOKEN
```

---

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL

# Check Docker database
docker-compose logs -f postgres

# Verify database exists
psql -l | grep bwaincell
```

---

### API Authentication Errors

```bash
# Verify Google OAuth credentials
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Check email whitelist
echo $ALLOWED_GOOGLE_EMAILS

# Verify JWT secret is set
echo $JWT_SECRET

# Test health endpoint
curl http://localhost:3000/health
```

---

## Additional Resources

- **Getting Started:** [docs/guides/getting-started.md](../guides/getting-started.md)
- **API Documentation:** [docs/api/README.md](../api/README.md)
- **Architecture Overview:** [docs/architecture/overview.md](../architecture/overview.md)
- **Deployment Guide:** [docs/guides/deployment.md](../guides/deployment.md)

---

**Last Updated:** 2026-01-09
**Version:** 1.0.0
