# Development Environment Testing Procedure

**Date**: 2026-01-10
**Purpose**: Verify monorepo development environment works correctly
**Components**: PostgreSQL (Docker), Backend (Discord bot), Frontend (PWA)

---

## Prerequisites Check

### 1. Environment Configuration ✅

Your `.env` is configured correctly:

```env
DATABASE_URL=postgresql://bwaincell:RUhdJ1dZScrHpeiSWImJJx+lPyol+wpt3qoYzsaLMSI=@localhost:5433/bwaincell
```

**Important**: Uses `@localhost:5433` for local development (not `@postgres`)

### 2. Docker Compose Dev File ✅

`docker-compose.dev.yml` is ready:

- Service: PostgreSQL 15 Alpine
- Container: `bwaincell-db-dev`
- Port: `5433:5432` (external:internal)
- Volume: `postgres-data-dev` (separate from production)
- Health check: Enabled

### 3. Dev Scripts ✅

Root `package.json` has all required scripts:

- `npm run dev` - Start both backend + frontend (concurrently)
- `npm run dev:backend` - Start backend only
- `npm run dev:frontend` - Start frontend only

---

## Test Procedure

### Step 1: Start Development Database

**Command**:

```bash
docker compose -f docker-compose.dev.yml up -d
```

**Expected Output**:

```
[+] Running 2/2
 ✔ Network bwaincell_default          Created
 ✔ Container bwaincell-db-dev         Started
```

**Verify Database Started**:

```bash
docker compose -f docker-compose.dev.yml ps
```

**Expected Output**:

```
NAME                 IMAGE                  STATUS
bwaincell-db-dev     postgres:15-alpine     Up (healthy)
```

**Check Health**:

```bash
docker compose -f docker-compose.dev.yml exec postgres pg_isready -U bwaincell
```

**Expected Output**:

```
/var/run/postgresql:5432 - accepting connections
```

---

### Step 2: Test Backend Development Server

**Command**:

```bash
npm run dev:backend
```

**Expected Output**:

```
> @bwaincell/backend@1.0.0 dev
> dotenv -e .env -- ts-node-dev -r tsconfig-paths/register --respawn --transpile-only src/bot.ts

[INFO] Starting ts-node-dev...
[INFO] Using ts-node version X.X.X, typescript version 5.9.2
[INFO] Watching extensions: .ts,.tsx
[INFO] Starting: node -r tsconfig-paths/register -r ts-node/register src/bot.ts

[timestamp] info: Database connected successfully
[timestamp] info: Discord bot logged in as Bwaincell#1234
[timestamp] info: Express API server listening on port 3000
[timestamp] info: Ready!
```

**What to Verify**:

- ✅ No database connection errors
- ✅ Discord bot logs in successfully
- ✅ Express API starts on port 3000
- ✅ No compilation errors

**Test API Health**:
Open another terminal and run:

```bash
curl http://localhost:3000/health
```

**Expected Response**:

```json
{ "status": "ok", "timestamp": "2026-01-10T..." }
```

**Stop Backend**: Press `Ctrl+C` in the terminal running dev:backend

---

### Step 3: Test Frontend Development Server

**Command**:

```bash
npm run dev:frontend
```

**Expected Output**:

```
> @bwaincell/frontend@1.0.0 dev
> next dev -p 3010

   ▲ Next.js 14.2.35
   - Local:        http://localhost:3010
   - Environments: .env

 ✓ Ready in 2.5s
```

**What to Verify**:

- ✅ Next.js starts on port 3010
- ✅ No compilation errors
- ✅ Ready message appears

**Test Frontend**:
Open browser and navigate to:

```
http://localhost:3010
```

**Expected**: PWA home page loads (login page if not authenticated)

**Stop Frontend**: Press `Ctrl+C` in the terminal running dev:frontend

---

### Step 4: Test Full Development Environment (Both Services)

**Command**:

```bash
npm run dev
```

**Expected Output**:

```
> bwaincell-monorepo@1.0.0 dev
> npm run build:shared && concurrently -n backend,frontend -c blue,magenta "npm run dev --workspace=backend" "npm run dev --workspace=frontend"

> @bwaincell/shared@1.0.0 build
> tsc

[backend] > @bwaincell/backend@1.0.0 dev
[backend] > dotenv -e .env -- ts-node-dev -r tsconfig-paths/register --respawn --transpile-only src/bot.ts
[frontend] > @bwaincell/frontend@1.0.0 dev
[frontend] > next dev -p 3010

[backend] [timestamp] info: Database connected successfully
[backend] [timestamp] info: Discord bot logged in as Bwaincell#1234
[backend] [timestamp] info: Express API server listening on port 3000
[frontend]    ▲ Next.js 14.2.35
[frontend]    - Local:        http://localhost:3010
[frontend]  ✓ Ready in 2.5s
```

**What to Verify**:

- ✅ Shared package builds first
- ✅ Backend and frontend start in parallel
- ✅ Colored output (blue=backend, magenta=frontend)
- ✅ Named processes `[backend]` and `[frontend]`
- ✅ Backend on port 3000
- ✅ Frontend on port 3010
- ✅ Both services healthy

**Test Both Services**:

**Backend API**:

```bash
curl http://localhost:3000/health
```

**Frontend PWA**:
Open browser: `http://localhost:3010`

**Stop Both Services**: Press `Ctrl+C` in the terminal running `npm run dev`

---

## Troubleshooting

### Issue: Database Connection Failed

**Error**:

```
ECONNREFUSED localhost:5433
```

**Solution**:

1. Check PostgreSQL is running:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```
2. If not running, start it:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
3. Verify DATABASE_URL in `.env` uses `localhost:5433`

---

### Issue: Port Already in Use

**Error**:

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:

1. Find process using port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   # Linux/Mac
   lsof -i :3000
   ```
2. Kill the process or use different port

---

### Issue: Bot Token Invalid

**Error**:

```
Error: Invalid token
```

**Solution**:

1. Check `BOT_TOKEN` in `.env` is valid
2. Verify token from Discord Developer Portal
3. Ensure no extra spaces in `.env` file

---

### Issue: Frontend Module Not Found

**Error**:

```
Module not found: Can't resolve 'react'
```

**Solution**:

1. Install frontend dependencies:
   ```bash
   npm install
   ```
2. Verify `frontend/node_modules` exists

---

### Issue: Shared Types Not Found

**Error**:

```
Cannot find module '@bwaincell/shared'
```

**Solution**:

1. Build shared package:
   ```bash
   npm run build:shared
   ```
2. Verify `shared/dist/` exists
3. Check `tsconfig.json` has correct references

---

## Expected Development Workflow

### Daily Development Routine

**Start Development**:

```bash
# Terminal 1: Start database
docker compose -f docker-compose.dev.yml up -d

# Terminal 2: Start both services
npm run dev

# Services available:
# - Backend API: http://localhost:3000
# - Frontend PWA: http://localhost:3010
# - Database: localhost:5433
```

**Make Changes**:

- Edit backend files → Hot reload automatically
- Edit frontend files → HMR (Hot Module Replacement)
- Edit shared types → Run `npm run build:shared` then restart dev servers

**Stop Development**:

```bash
# Stop dev servers
Ctrl+C in terminal running npm run dev

# Stop database (optional - can keep running)
docker compose -f docker-compose.dev.yml down
```

---

## Success Criteria

### ✅ All Tests Pass If:

1. **Database**:
   - [ ] Container starts successfully
   - [ ] Health check passes
   - [ ] Accessible on localhost:5433

2. **Backend** (`npm run dev:backend`):
   - [ ] TypeScript compiles without errors
   - [ ] Database connection successful
   - [ ] Discord bot logs in
   - [ ] Express API starts on port 3000
   - [ ] Health endpoint responds

3. **Frontend** (`npm run dev:frontend`):
   - [ ] Next.js starts on port 3010
   - [ ] No compilation errors
   - [ ] Page loads in browser

4. **Full Dev** (`npm run dev`):
   - [ ] Shared package builds first
   - [ ] Both services start in parallel
   - [ ] Colored output works
   - [ ] Both services accessible
   - [ ] Hot reload works for both

---

## Cleanup After Testing

**Stop All Services**:

```bash
# Stop dev servers (if running)
Ctrl+C

# Stop database
docker compose -f docker-compose.dev.yml down

# Optional: Remove database volume (resets data)
docker compose -f docker-compose.dev.yml down -v
```

**Check Nothing Running**:

```bash
# Check Docker containers
docker ps

# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :3010
netstat -ano | findstr :5433
```

---

## Next Steps After Successful Testing

Once all tests pass:

1. **Document Results**: Create test results file
2. **Update Work Order**: Mark WO-009 validation complete
3. **Commit Changes**: Consider committing MIGRATION.md and README.md updates
4. **Team Handoff**: Share MIGRATION.md with team

---

## Quick Reference Commands

```bash
# Start database only
docker compose -f docker-compose.dev.yml up -d

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Start both services
npm run dev

# Stop database
docker compose -f docker-compose.dev.yml down

# View database logs
docker compose -f docker-compose.dev.yml logs -f

# Check database health
docker compose -f docker-compose.dev.yml ps

# Build shared package manually
npm run build:shared

# Clean all builds
npm run clean

# Full rebuild
npm run clean && npm run build
```

---

**Ready to Test**: All commands are prepared. Start with Step 1 when ready!
