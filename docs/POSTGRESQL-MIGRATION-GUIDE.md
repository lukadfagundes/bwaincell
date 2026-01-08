# PostgreSQL Migration Guide

**Bwaincell: SQLite → PostgreSQL Migration**

**Strategy:** Downtime Migration (5-10 minute window)
**Data Loss Tolerance:** ZERO - All data must be preserved
**Rollback:** Fly.io remains operational during migration

---

## Overview

This guide covers migrating Bwaincell from Fly.io SQLite to Raspberry Pi PostgreSQL with zero data loss.

**Migration Steps:**

1. Export SQLite database from Fly.io
2. Set up PostgreSQL on Raspberry Pi
3. Run migration script to transfer data
4. Validate data integrity
5. Update DNS/configuration
6. Monitor new deployment

**Estimated Time:** 15-20 minutes
**Downtime Window:** 5-10 minutes
**Rollback Time:** 2-3 minutes

---

## Pre-Migration Checklist

### ✅ Infrastructure Ready

- [ ] WO-001 (PostgreSQL Infrastructure) completed and committed
- [ ] WO-002 (Database Layer Migration) completed and committed
- [ ] WO-003 (Testing & Migration Script) completed and committed
- [ ] PostgreSQL running on sunny-pi (`docker compose ps` shows `bwaincell-db` healthy)
- [ ] Bot deployed to sunny-pi with PostgreSQL support
- [ ] `.env` file on Pi contains `DATABASE_URL` and `POSTGRES_*` variables

### ✅ Testing Complete

- [ ] Integration tests passed locally (`npm test tests/integration/database-postgres.test.ts`)
- [ ] Load tests passed locally (`npm test tests/load/database-load.test.ts`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Bot starts successfully with empty PostgreSQL database

### ✅ Backup & Safety

- [ ] Fly.io bot is running and healthy (backup in case of rollback)
- [ ] SQLite export script tested (`fly ssh console` works)
- [ ] Migration script tested with sample data
- [ ] Rollback plan documented and understood

---

## Migration Process

### Phase 1: Export SQLite Database from Fly.io

**Duration:** 2-3 minutes

#### Step 1: Connect to Fly.io

```bash
# Connect to Fly.io console
fly ssh console -a bwaincell
```

#### Step 2: Copy SQLite Database

```bash
# Inside Fly.io console:
cp /app/data/bwaincell.sqlite /tmp/export.sqlite
ls -lh /tmp/export.sqlite

# Exit Fly.io console
exit
```

#### Step 3: Download SQLite Export

```bash
# On your local machine:
fly sftp get /tmp/export.sqlite ./data/flyio-export.sqlite -a bwaincell

# Verify download
ls -lh ./data/flyio-export.sqlite
```

**Expected Output:**

```
-rw-r--r-- 1 user user 500K Jan  8 10:00 ./data/flyio-export.sqlite
```

**Verification:**

```bash
# Check SQLite file is valid
sqlite3 ./data/flyio-export.sqlite "SELECT COUNT(*) FROM sqlite_master WHERE type='table';"
# Should output: 7 (tasks, lists, notes, reminders, budgets, schedules, users)
```

---

### Phase 2: Prepare PostgreSQL on Raspberry Pi

**Duration:** 1-2 minutes

#### Step 1: SSH into sunny-pi

```bash
ssh sunny-pi
cd ~/bwaincell
```

#### Step 2: Verify PostgreSQL is Running

```bash
docker compose ps

# Expected output:
# bwaincell-db   postgres:15-alpine   Up (healthy)   5433->5432/tcp
```

#### Step 3: Test PostgreSQL Connection

```bash
docker compose exec postgres psql -U bwaincell -d bwaincell -c "SELECT version();"

# Should output PostgreSQL version
```

#### Step 4: Verify Tables Are Created

```bash
docker compose exec postgres psql -U bwaincell -d bwaincell -c "\dt"

# Should show 7 tables: tasks, lists, notes, reminders, budgets, schedules, users
```

---

### Phase 3: Transfer SQLite Export to Pi

**Duration:** 1-2 minutes

#### Step 1: Upload SQLite File to Pi

```bash
# From your local machine:
scp ./data/flyio-export.sqlite sunny-pi:~/bwaincell/data/flyio-export.sqlite
```

#### Step 2: Verify Upload

```bash
ssh sunny-pi
ls -lh ~/bwaincell/data/flyio-export.sqlite
```

---

### Phase 4: Run Migration Script

**Duration:** 2-5 minutes (depends on data size)

#### Step 1: Stop Fly.io Bot (Begin Downtime)

```bash
# On your local machine:
fly scale count 0 -a bwaincell

# Verify bot is stopped
fly status -a bwaincell
```

**⏱️ DOWNTIME BEGINS**

#### Step 2: Run Migration Script on Pi

```bash
# SSH into Pi (if not already)
ssh sunny-pi
cd ~/bwaincell

# Set environment variables
export SQLITE_EXPORT_PATH=./data/flyio-export.sqlite
export DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2)

# Run migration
npx ts-node scripts/migrate-sqlite-to-postgres.ts
```

**Expected Output:**

```
🚀 Starting SQLite to PostgreSQL migration...
   Source: ./data/flyio-export.sqlite
   Target: PostgreSQL

🔌 Testing database connections...
✅ SQLite connection successful
✅ PostgreSQL connection successful

📊 Migrating table: tasks
  📥 Retrieved 150 rows from SQLite
  📤 Inserted 150 rows into PostgreSQL
  🔍 Verification: 150 source → 150 target
✅ tasks: 150 rows migrated in 450ms

📊 Migrating table: lists
  📥 Retrieved 25 rows from SQLite
  📤 Inserted 25 rows into PostgreSQL
  🔍 Verification: 25 source → 25 target
✅ lists: 25 rows migrated in 320ms

... (continues for all 7 tables)

======================================================================
MIGRATION SUMMARY
======================================================================
✅ tasks              150 → 150     450ms
✅ lists               25 →  25     320ms
✅ notes               80 →  80     380ms
✅ reminders           15 →  15     220ms
✅ budgets            200 → 200     580ms
✅ schedules           30 →  30     250ms
✅ users                2 →   2     150ms
======================================================================
TOTALS:   502 rows → 502 rows
SUCCESS:  7/7 tables migrated successfully
DURATION: 2350ms total, 335ms average per table
======================================================================

✅ Migration completed successfully!
   All tables migrated with zero data loss
```

---

### Phase 5: Validate Migration

**Duration:** 2-3 minutes

#### Step 1: Verify Row Counts

```bash
# On sunny-pi
docker compose exec postgres psql -U bwaincell -d bwaincell <<EOF
SELECT 'tasks' as table, COUNT(*) as rows FROM tasks UNION ALL
SELECT 'lists', COUNT(*) FROM lists UNION ALL
SELECT 'notes', COUNT(*) FROM notes UNION ALL
SELECT 'reminders', COUNT(*) FROM reminders UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules UNION ALL
SELECT 'users', COUNT(*) FROM users;
EOF
```

**Expected Output:**

```
 table     | rows
-----------+------
 tasks     |  150
 lists     |   25
 notes     |   80
 reminders |   15
 budgets   |  200
 schedules |   30
 users     |    2
```

#### Step 2: Verify JSONB Data Integrity

```bash
# Test list items (JSONB)
docker compose exec postgres psql -U bwaincell -d bwaincell -c "SELECT name, jsonb_array_length(items) as item_count FROM lists LIMIT 3;"

# Test note tags (JSONB)
docker compose exec postgres psql -U bwaincell -d bwaincell -c "SELECT title, jsonb_array_length(tags) as tag_count FROM notes WHERE tags IS NOT NULL LIMIT 3;"
```

#### Step 3: Verify DECIMAL Precision

```bash
# Test budget amounts
docker compose exec postgres psql -U bwaincell -d bwaincell -c "SELECT type, SUM(amount) as total FROM budgets GROUP BY type;"
```

#### Step 4: Start Pi Bot

```bash
# On sunny-pi
cd ~/bwaincell
docker compose restart bwaincell

# Wait for bot to start
sleep 10

# Check logs
docker compose logs --tail=50 bwaincell
```

**Look for:**

```
✅ Database connection successful
✅ Bot is ready!
✅ Connected to Discord
```

#### Step 5: Test Bot Functionality

```bash
# In Discord, test a few commands:
/task list          # Should show migrated tasks
/list view <name>   # Should show migrated list items
/note list          # Should show migrated notes
/budget summary     # Should show migrated budget data
```

**⏱️ DOWNTIME ENDS (if validation passes)**

---

### Phase 6: Finalize Migration

**Duration:** 1 minute

#### Step 1: Verify Bot is Healthy

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected: {"status":"healthy","database":"connected"}
```

#### Step 2: Monitor Logs

```bash
# Watch for any errors
docker compose logs -f bwaincell

# Press Ctrl+C to stop watching
```

#### Step 3: Update Deployment Status

```
✅ Migration complete
✅ Bot running on sunny-pi with PostgreSQL
✅ All data preserved (502/502 rows)
✅ Zero data loss achieved
```

---

## Post-Migration Checklist

### ✅ Validation

- [ ] All row counts match source → target
- [ ] JSONB data accessible (list items, note tags)
- [ ] DECIMAL precision maintained (budget totals)
- [ ] Bot responds to Discord commands
- [ ] Health endpoint returns healthy status
- [ ] No errors in bot logs

### ✅ Monitoring (First 24 Hours)

- [ ] Check bot logs hourly for first 6 hours
- [ ] Verify reminders trigger on schedule
- [ ] Test all bot commands in Discord
- [ ] Monitor resource usage (`docker stats`)
- [ ] Verify PostgreSQL health checks passing

### ✅ Cleanup

- [ ] Decommission Fly.io app (`fly apps destroy bwaincell`)
- [ ] Remove Fly.io secrets and configs
- [ ] Archive SQLite export (`mv flyio-export.sqlite backups/`)
- [ ] Update documentation with new deployment info

---

## Rollback Procedure

**If migration fails or bot doesn't work:**

### Option 1: Quick Rollback (2-3 minutes)

```bash
# On local machine:
# Restart Fly.io bot
fly scale count 1 -a bwaincell

# Wait for Fly.io to start
fly status -a bwaincell

# Verify bot is back online in Discord
```

**Fly.io SQLite data is untouched** - bot resumes normal operation immediately.

### Option 2: Fix and Retry

```bash
# On sunny-pi:
# Stop Pi bot
docker compose down

# Truncate PostgreSQL tables
docker compose exec postgres psql -U bwaincell -d bwaincell <<EOF
TRUNCATE tasks, lists, notes, reminders, budgets, schedules, users CASCADE;
EOF

# Fix migration script if needed
# Re-run migration from Phase 4
```

---

## Troubleshooting

### Issue: Migration script fails with "Row count mismatch"

**Cause:** Data insertion failed for some rows

**Solution:**

```bash
# Check PostgreSQL logs
docker compose logs postgres

# Look for constraint violations or data type errors
# Fix data in SQLite export if needed
# Re-run migration
```

### Issue: JSONB columns show as empty strings

**Cause:** JSON not parsed during migration

**Solution:**

```bash
# Verify transformation in migration script
# Check transformRow() function handles JSON strings
# Re-run migration
```

### Issue: Bot fails to start after migration

**Cause:** DATABASE_URL not set or incorrect

**Solution:**

```bash
# Verify .env on Pi
grep DATABASE_URL ~/bwaincell/.env

# Should be: postgresql://bwaincell:password@postgres:5432/bwaincell
# Restart bot
docker compose restart bwaincell
```

### Issue: Reminders don't trigger

**Cause:** Timezone not set correctly

**Solution:**

```bash
# Check PostgreSQL timezone
docker compose exec postgres psql -U bwaincell -d bwaincell -c "SHOW timezone;"

# Should be: America/Chicago
# If not, run init.sql again
```

---

## Performance Expectations

**Migration Performance:**

- Small dataset (<100 rows/table): <1 second per table
- Medium dataset (100-1000 rows/table): 1-5 seconds per table
- Large dataset (1000+ rows/table): 5-30 seconds per table

**PostgreSQL vs SQLite:**

- **Read performance:** 10-20% faster (connection pooling)
- **Write performance:** Similar for single operations
- **Concurrent operations:** 50-100% faster (connection pool)
- **JSONB queries:** 3-5x faster (native indexing)

---

## Success Criteria

Migration is successful when:

✅ All row counts match (source == target)
✅ JSONB data queryable (no parsing errors)
✅ DECIMAL precision maintained (no rounding errors)
✅ Bot connects to Discord successfully
✅ All commands respond correctly
✅ Reminders trigger on schedule
✅ Health endpoint returns healthy
✅ No errors in logs for 1 hour

**Zero data loss is mandatory** - any discrepancy requires rollback and investigation.

---

**Migration Complete!** 🎉

Bot is now running on sunny-pi with PostgreSQL, saving ~$575/year.
