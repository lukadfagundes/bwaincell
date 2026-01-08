# Bwaincell - Raspberry Pi Deployment Guide

## Migration from Fly.io to Raspberry Pi 4B

Deploy Bwaincell from Fly.io ($50/month) to sunny-pi (Raspberry Pi 4B) and save **~$575/year**.

---

## Migration Overview

| Metric             | Fly.io (Current) | Raspberry Pi (Target)   |
| ------------------ | ---------------- | ----------------------- |
| **Monthly Cost**   | $50              | $2 (electricity)        |
| **Annual Cost**    | $600             | $24                     |
| **Annual Savings** | -                | **$576 (96%)**          |
| **Uptime**         | 99.9% managed    | Depends on Pi           |
| **Scaling**        | Automatic        | Limited to Pi resources |

### Raspberry Pi 4B Capacity Analysis

**sunny-pi Current State:**

- **RAM:** 3.7 GB total, 3.2 GB free, 538 MB used
- **CPU:** 4 cores, load average 0.44 (11% utilization)
- **Disk:** 28 GB total, 4.8 GB free (83% used)
- **Currently Running:** sunny-stack-bot + PostgreSQL

**Bwaincell Requirements:**

- **RAM:** ~60-100 MB (Discord bot + Express API)
- **CPU:** <5% average (event-driven workload)
- **Disk:** ~300-400 MB (Docker image + SQLite database)

**Verdict:** ✅ **Plenty of capacity** - sunny-pi can easily handle Bwaincell

---

## Prerequisites

### 1. GitHub Secrets

Add these to your repository (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name           | Description                         | Example                                  |
| --------------------- | ----------------------------------- | ---------------------------------------- |
| `PI_HOST`             | sunny-pi IP or hostname             | `192.168.1.100` or `sunny-pi.local`      |
| `PI_USERNAME`         | SSH username                        | `your_username`                          |
| `PI_SSH_KEY`          | Private SSH key                     | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PI_SSH_PASSPHRASE`   | SSH key passphrase (if any)         | `your_passphrase`                        |
| `PI_SSH_PORT`         | SSH port (default 22)               | `22`                                     |
| `DISCORD_WEBHOOK_URL` | (Optional) Deployment notifications | `https://discord.com/api/webhooks/...`   |

### 2. Verify SSH Access

```bash
# Test connection to sunny-pi
ssh sunny-pi

# Should connect successfully
```

---

## PostgreSQL Database Setup

### PostgreSQL Container Architecture

Bwaincell uses PostgreSQL 15 in a separate Docker container for production data storage:

**Configuration:**

- **Image:** `postgres:15-alpine` (ARM64 compatible)
- **External Port:** 5433 (avoids sunny-stack-db conflict on 5432)
- **Internal Port:** 5432 (standard PostgreSQL)
- **Volumes:** `postgres-data` for persistent storage
- **Resources:** 512 MB RAM max, 0.5 CPU max
- **Health Check:** `pg_isready` every 10 seconds

**Why PostgreSQL?**

- **JSONB Support:** Native JSON indexing for list items and note tags
- **DECIMAL Precision:** Exact decimal arithmetic for budget amounts
- **Timezone Support:** Proper timestamp handling for reminders
- **Scalability:** Better performance than SQLite for concurrent operations

### Required Environment Variables

Add these to your `.env` file on the Pi:

```env
# -----------------------------------------------------------------------------
# Database Configuration (PostgreSQL)
# -----------------------------------------------------------------------------
POSTGRES_USER=bwaincell
POSTGRES_PASSWORD=<generate with: openssl rand -hex 32>
POSTGRES_DB=bwaincell

# Database connection string
# For Docker internal network, use service name 'postgres'
DATABASE_URL=postgresql://bwaincell:${POSTGRES_PASSWORD}@postgres:5432/bwaincell
```

**Generate secure password:**

```bash
openssl rand -hex 32
```

### Database Initialization

The PostgreSQL container automatically runs `database/init.sql` on first startup:

**Features:**

- Creates `uuid-ossp` extension (UUID generation)
- Creates `pg_trgm` extension (text search optimization)
- Sets timezone to `America/Chicago` for reminder functionality
- Grants application privileges to `bwaincell` user

**No manual setup required** - init.sql runs automatically.

### Database Operations

**Connect to PostgreSQL:**

```bash
cd ~/bwaincell
docker compose exec postgres psql -U bwaincell -d bwaincell
```

**Backup database:**

```bash
docker compose exec postgres pg_dump -U bwaincell bwaincell > backup-$(date +%Y%m%d).sql
```

**Restore database:**

```bash
cat backup-20260108.sql | docker compose exec -T postgres psql -U bwaincell bwaincell
```

**View logs:**

```bash
docker compose logs -f postgres
```

**Check health:**

```bash
docker compose exec postgres pg_isready -U bwaincell
```

---

## Part 1: Setup on Raspberry Pi

### Step 1: Create Project Directory

SSH into sunny-pi and create the bwaincell directory:

```bash
ssh sunny-pi
mkdir -p ~/bwaincell
cd ~/bwaincell
```

### Step 2: Clone Repository

```bash
# Clone your repository (replace with your actual repo URL)
git clone https://github.com/<your-username>/bwaincell.git .

# Verify files
ls -la
```

### Step 3: Create Environment File

Create `.env` with your production credentials:

```bash
cd ~/bwaincell
nano .env
```

Paste your environment variables (copy from Fly.io secrets):

```env
# Discord Bot Configuration
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id

# Google OAuth (if using API authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret_key

# Application Settings
NODE_ENV=production
PORT=3000
TZ=America/Chicago  # Your timezone
DELETE_COMMAND_AFTER=5000

# Google Calendar (optional)
GOOGLE_CALENDAR_ID=primary
GOOGLE_REDIRECT_URI=http://your-domain.com/oauth2callback
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### Step 4: Set Proper Permissions

```bash
# Protect .env file
chmod 600 .env

# Create data and logs directories
mkdir -p data logs
```

---

## Part 2: Deployment Methods

### Method 1: Automatic Deployment via GitHub Actions (Recommended)

Once GitHub Secrets are configured, simply push to `main`:

```bash
# From your local machine
git add .
git commit -m "Deploy to Raspberry Pi"
git push origin main
```

**The workflow will automatically:**

1. ✅ Backup current running image
2. ✅ Pull latest code on Pi
3. ✅ Build ARM64-optimized Docker image
4. ✅ Deploy with docker-compose
5. ✅ Run health checks
6. ✅ Verify Discord connection
7. ✅ Send Discord notification
8. ✅ Auto-rollback if deployment fails

**Monitor deployment:**

- GitHub Actions: `https://github.com/<your-repo>/actions`
- Discord notification (if webhook configured)

---

### Method 2: Manual Deployment

For manual control or testing:

```bash
# SSH into sunny-pi
ssh sunny-pi
cd ~/bwaincell

# Pull latest code
git pull origin main

# Build Docker image (ARM64 optimized)
docker build --no-cache -t bwaincell:latest -f Dockerfile .

# Start the bot
docker compose up -d

# Check status
docker compose ps
docker compose logs -f

# Verify health
curl http://localhost:3000/health
```

---

## Part 3: Monitoring & Management

### Check Bot Status

```bash
# Container status
ssh sunny-pi "docker ps | grep bwaincell"

# Quick health check
ssh sunny-pi "curl -s http://localhost:3000/health"
```

### View Logs

```bash
# Real-time logs
ssh sunny-pi "docker logs -f bwaincell-bot"

# Last 100 lines
ssh sunny-pi "docker logs --tail=100 bwaincell-bot"

# Follow logs for specific keyword
ssh sunny-pi "docker logs -f bwaincell-bot | grep 'Ready!'"
```

### Resource Usage

```bash
# Current resource usage
ssh sunny-pi "docker stats bwaincell-bot --no-stream"

# Output example:
# NAME           CPU %  MEM USAGE / LIMIT   MEM %
# bwaincell-bot  0.5%   85MB / 512MB        16.6%
```

### Restart Bot

```bash
# Graceful restart
ssh sunny-pi "cd ~/bwaincell && docker compose restart"

# Full rebuild and restart
ssh sunny-pi "cd ~/bwaincell && docker compose down && docker compose up -d --build"
```

---

## Part 4: Updating the Bot

### Code Changes

```bash
# Make changes locally, then commit and push
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions automatically deploys
```

### Dependency Updates

```bash
# Update packages locally
npm update

# Commit changes
git add package.json package-lock.json
git commit -m "Update dependencies"
git push origin main

# GitHub Actions rebuilds with new dependencies
```

### Emergency Rollback

```bash
ssh sunny-pi
cd ~/bwaincell

# Stop current version
docker compose down

# Restore previous image (auto-tagged during deployment)
docker tag bwaincell:backup bwaincell:latest

# Start previous version
docker compose up -d

# Verify
docker logs -f bwaincell-bot
```

---

## Part 5: Backup & Restore

### Backup SQLite Database

```bash
# Create timestamped backup
ssh sunny-pi "cd ~/bwaincell && cp data/bwaincell.sqlite data/bwaincell.sqlite.backup-$(date +%Y%m%d-%H%M%S)"

# Download to local machine
scp sunny-pi:~/bwaincell/data/bwaincell.sqlite ./bwaincell-backup-$(date +%Y%m%d).sqlite
```

### Automated Daily Backups (Cron Job)

```bash
ssh sunny-pi

# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * cd ~/bwaincell && cp data/bwaincell.sqlite data/backups/bwaincell-$(date +\%Y\%m\%d).sqlite && find data/backups -name "bwaincell-*.sqlite" -mtime +7 -delete
```

### Restore from Backup

```bash
# Upload backup to Pi
scp ./bwaincell-backup.sqlite sunny-pi:~/bwaincell/data/bwaincell.sqlite

# Restart bot to use restored database
ssh sunny-pi "cd ~/bwaincell && docker compose restart"
```

---

## Troubleshooting

### Bot Won't Start

```bash
# Check logs
ssh sunny-pi "docker logs bwaincell-bot"

# Common issues:
# - Missing .env file
# - Invalid BOT_TOKEN
# - Permission errors on data/ directory
# - Port 3000 already in use
```

**Solutions:**

```bash
# Verify .env exists
ssh sunny-pi "ls -la ~/bwaincell/.env"

# Check port availability
ssh sunny-pi "lsof -i :3000"

# Fix permissions
ssh sunny-pi "cd ~/bwaincell && sudo chown -R 1001:1001 data logs"
```

### Build Fails

```bash
# Clear Docker cache
ssh sunny-pi "docker builder prune -af"

# Rebuild from scratch
ssh sunny-pi "cd ~/bwaincell && docker build --no-cache --pull -t bwaincell:latest ."
```

### Disk Space Full

```bash
# Check disk usage
ssh sunny-pi "df -h"

# Clean Docker images
ssh sunny-pi "docker system prune -a --volumes"

# Clean old logs
ssh sunny-pi "sudo journalctl --vacuum-time=7d"

# Remove old database backups (keep last 7 days)
ssh sunny-pi "find ~/bwaincell/data/backups -name 'bwaincell-*.sqlite' -mtime +7 -delete"
```

### Health Check Failing

```bash
# Test health endpoint manually
ssh sunny-pi "curl -v http://localhost:3000/health"

# Check if Express API is running
ssh sunny-pi "docker logs bwaincell-bot | grep 'Server listening'"

# Verify port mapping
ssh sunny-pi "docker port bwaincell-bot"
```

### Discord Bot Offline

```bash
# Check Discord connection in logs
ssh sunny-pi "docker logs bwaincell-bot | grep -E 'Ready!|logged in|Connected'"

# Verify BOT_TOKEN
ssh sunny-pi "cd ~/bwaincell && docker compose exec bwaincell printenv | grep BOT_TOKEN"

# Restart bot
ssh sunny-pi "cd ~/bwaincell && docker compose restart"
```

---

## Performance Optimization

### Adjust Resource Limits

Edit `docker-compose.yml` to increase limits if needed:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0' # Increase from 1.0
      memory: 1G # Increase from 512M
    reservations:
      cpus: '0.5' # Increase from 0.25
      memory: 256M # Increase from 128M
```

Then redeploy:

```bash
ssh sunny-pi "cd ~/bwaincell && docker compose up -d --force-recreate"
```

### Monitor Resource Usage Over Time

```bash
# Watch resources in real-time (Ctrl+C to exit)
ssh sunny-pi "watch docker stats bwaincell-bot"
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│      Raspberry Pi 4B (sunny-pi)         │
│                                         │
│  ┌────────────────────────────────┐    │
│  │   Bwaincell Container          │    │
│  │   (ARM64 Multi-Stage Build)    │    │
│  │                                │    │
│  │  • Discord.js 14.14.1          │    │
│  │  • Express 4.21.2 (API)        │    │
│  │  • SQLite 3 (in /app/data)     │    │
│  │  • Winston Logging             │    │
│  │  • node-cron (reminders)       │    │
│  │                                │    │
│  │  Resources:                    │    │
│  │  • CPU: 1 core max             │    │
│  │  • RAM: 512 MB max             │    │
│  │  • User: botuser (1001:1001)   │    │
│  └────────────────────────────────┘    │
│                                         │
│  Also Running:                          │
│  • sunny-stack-bot (separate)           │
│  • sunny-stack-db (PostgreSQL)          │
│                                         │
│  Total Usage: ~650 MB RAM, <15% CPU    │
└─────────────────────────────────────────┘
         │
         │ Internet
         ▼
┌─────────────────────┐
│   Discord Gateway   │
└─────────────────────┘
```

---

## Migration Checklist

Complete these steps to migrate from Fly.io to Raspberry Pi:

- [ ] **1. Add GitHub Secrets** (PI_HOST, PI_SSH_KEY, etc.)
- [ ] **2. SSH into sunny-pi and create ~/bwaincell directory**
- [ ] **3. Clone repository to ~/bwaincell**
- [ ] **4. Create .env file with production credentials**
- [ ] **5. Test manual deployment first**
  ```bash
  cd ~/bwaincell
  docker build -t bwaincell:latest .
  docker compose up -d
  ```
- [ ] **6. Verify bot works (check Discord, test health endpoint)**
- [ ] **7. Stop manual test deployment**
  ```bash
  docker compose down
  ```
- [ ] **8. Enable GitHub Actions workflow**
  - Push to main branch
  - Monitor deployment in Actions tab
- [ ] **9. Verify auto-deployment succeeded**
- [ ] **10. Monitor for 24-48 hours**
- [ ] **11. Cancel Fly.io subscription**
- [ ] **12. Celebrate $576/year savings!** 🎉

---

## Cost Comparison

### Before (Fly.io)

- **Monthly:** $50
- **Annual:** $600
- **Uptime:** 99.9% SLA
- **Scaling:** Automatic
- **Maintenance:** Fully managed
- **Backups:** Automated

### After (Raspberry Pi)

- **Monthly:** $2 (electricity at ~3W)
- **Annual:** $24
- **Uptime:** Depends on Pi stability (sunny-stack is proven stable)
- **Scaling:** Limited to Pi resources (sufficient for household use)
- **Maintenance:** Manual (but automated via GitHub Actions)
- **Backups:** Manual (setup cron job)

**Savings:** $576/year (96% cost reduction)

**Worth it?** Absolutely for a household Discord bot with light usage.

---

## Support & Documentation

### Related Files

- [`Dockerfile`](Dockerfile) - Multi-stage ARM64 build
- [`docker-compose.yml`](docker-compose.yml) - Production service definition
- [`.github/workflows/deploy-bot.yml`](.github/workflows/deploy-bot.yml) - Auto-deployment workflow

### Helpful Commands

```bash
# View all running containers on Pi
ssh sunny-pi "docker ps"

# View all images on Pi
ssh sunny-pi "docker images"

# Check Pi system resources
ssh sunny-pi "htop"  # (if installed) or "top"

# Check disk usage
ssh sunny-pi "du -sh ~/bwaincell/*"

# View GitHub Actions logs
# Visit: https://github.com/<your-repo>/actions
```

### Monitoring Recommendations

1. **Set up Discord webhook** for deployment notifications
2. **Monitor disk space weekly** (target <80% usage)
3. **Check logs daily** for first week after migration
4. **Test backup/restore process** before you need it
5. **Document any Pi-specific issues** in trinity/investigations/

---

**Last Updated:** 2026-01-07
**Deployment Target:** Raspberry Pi 4B (sunny-pi)
**Architecture:** Docker + GitHub Actions + ARM64
**Annual Savings:** $576 🚀
