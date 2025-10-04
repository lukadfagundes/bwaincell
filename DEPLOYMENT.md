# Bwaincell Bot - Fly.io Deployment Guide

This guide will help you deploy your Bwaincell Discord bot to Fly.io for free 24/7 hosting.

## Prerequisites

- A Fly.io account (sign up at <https://fly.io>)
- Your Discord bot tokens (from `.env` file)
- Git installed on your computer

## Step 1: Install Fly.io CLI

### Windows (PowerShell)

```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### macOS/Linux

```bash
curl -L https://fly.io/install.sh | sh
```

After installation, restart your terminal.

## Step 2: Login to Fly.io

```bash
fly auth login
```

This will open your browser to authenticate.

## Step 3: Create Fly.io App

```bash
fly launch --no-deploy
```

When prompted:

- **App name**: Press Enter to use "bwaincell-bot" (or choose your own)
- **Region**: Choose the closest region to you (e.g., `sjc` for San Jose)
- **PostgreSQL database**: Select **No**
- **Redis database**: Select **No**

## Step 4: Create Volume for Database

Your SQLite database needs persistent storage:

```bash
fly volumes create bwaincell_data --size 1
```

## Step 5: Set Environment Variables

Set your Discord bot credentials as secrets:

```bash
fly secrets set DISCORD_TOKEN="your_discord_token_here"
fly secrets set CLIENT_ID="your_client_id_here"
fly secrets set GUILD_ID="your_guild_id_here"
fly secrets set TIMEZONE="America/Los_Angeles"
fly secrets set DEFAULT_REMINDER_CHANNEL="your_channel_id_here"
```

**Important**: Replace the placeholder values with your actual credentials from your `.env` file.

## Step 6: Deploy Commands to Discord

Before deploying, you need to register your slash commands with Discord:

```bash
npm run build
npm run deploy
```

## Step 7: Deploy to Fly.io

```bash
fly deploy
```

This will:

1. Build a Docker image with your bot
2. Upload it to Fly.io
3. Start your bot in the cloud

## Step 8: Verify Deployment

Check if your bot is running:

```bash
fly status
```

View logs:

```bash
fly logs
```

Your bot should now be online 24/7!

## Updating Your Bot

After making code changes:

1. Commit your changes to git
2. Deploy updates:

```bash
fly deploy
```

## Monitoring

- **View logs**: `fly logs`
- **Check status**: `fly status`
- **SSH into container**: `fly ssh console`
- **Dashboard**: <https://fly.io/dashboard>

## Troubleshooting

### Bot not starting

```bash
fly logs
```

Check logs for errors.

### Commands not working

Make sure you ran `npm run deploy` before deploying to Fly.io.

### Database not persisting

Verify volume is mounted:

```bash
fly volumes list
```

### Out of memory

Increase memory in `fly.toml`:

```toml
[[vm]]
  memory_mb = 512
```

Then redeploy: `fly deploy`

## Free Tier Limits

Fly.io free tier includes:

- Up to 3 shared-cpu-1x VMs with 256MB RAM each
- 3GB persistent volume storage
- 160GB outbound data transfer

Your bot should easily fit within these limits!

## Stopping/Destroying the App

**Stop the app** (keeps data):

```bash
fly apps stop bwaincell-bot
```

**Restart the app**:

```bash
fly apps restart bwaincell-bot
```

**Delete the app** (deletes everything):

```bash
fly apps destroy bwaincell-bot
```

## Cost Estimate

With default settings (256MB RAM, 1 CPU), your bot will run **completely free** on Fly.io's free tier.

---

**Need help?** Check out the Fly.io docs at <https://fly.io/docs/>
