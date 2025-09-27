# Bwaincell Discord Bot

A pure utility Discord bot for personal server management, providing task management, reminders, lists, and planning tools through slash commands.

## Features

### 📋 Task Management (`/task`)

- Create tasks with optional due dates
- List all, pending, or completed tasks
- Mark tasks as complete
- Edit task descriptions
- Delete tasks

### 📝 List Management (`/list`)

- Create multiple lists
- Add/remove items
- Toggle item completion status
- Clear completed items
- View all lists

### ⏰ Reminder System (`/remind`)

- One-time reminders
- Daily recurring reminders
- Weekly recurring reminders
- List all active reminders
- Delete reminders

### 📊 Tracking (`/track`)

- Track any numeric metric
- View statistics (average, min, max, total)
- Filter by time period
- List all tracked metrics

### 🎲 Random Generators (`/random`)

- Random movie picker
- Random dinner suggestion
- Date idea generator
- Conversation starters
- Custom choice picker
- Coin flip & dice roll

### 📅 Scheduling (`/schedule`)

- Schedule future events
- View upcoming/past events
- Event countdowns
- Today's events
- Weekly overview

### 💰 Budget Tracking (`/budget`)

- Track expenses by category
- Record income
- Monthly summaries
- Category breakdowns
- Spending trends

### 📓 Notes (`/note`)

- Create notes with tags
- Search notes by keyword
- Filter by tags
- Edit existing notes
- View all tags

## Installation

1. **Clone the repository**

```bash
cd "C:/Users/lukaf/Desktop/Dev Work/Bwaincell"
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

- Copy `.env.example` to `.env`
- Fill in your Discord bot credentials:

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_for_testing
```

4. **Deploy slash commands**

```bash
node deploy-commands.js
```

5. **Start the bot**

```bash
node src/bot.js
```

## Setup Guide

### Creating a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "Bwaincell"
3. Go to the "Bot" section
4. Click "Add Bot"
5. Copy the bot token (save it for `.env`)
6. Under "Privileged Gateway Intents", enable:
   - Server Members Intent (if needed)
   - Message Content Intent (if needed)

### Getting Your IDs

1. **Client ID**: In Discord Developer Portal, go to "General Information" and copy Application ID
2. **Guild ID**: Enable Developer Mode in Discord settings, right-click your server, and copy ID

### Inviting the Bot

1. In Discord Developer Portal, go to "OAuth2" > "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select bot permissions:
   - Send Messages
   - Embed Links
   - Read Message History
   - Use Slash Commands
4. Copy the generated URL and open it to invite the bot

## Project Structure

```
Bwaincell/
├── src/
│   └── bot.js                 # Main bot entry
├── commands/                  # All command implementations
│   ├── task.js
│   ├── list.js
│   ├── remind.js
│   ├── track.js
│   ├── random.js
│   ├── schedule.js
│   ├── budget.js
│   └── note.js
├── database/
│   ├── schema.js             # Database schemas
│   └── models/               # Sequelize models
├── utils/
│   ├── scheduler.js          # Reminder scheduler
│   └── validators.js         # Input validation
├── config/
│   └── config.js             # Configuration loader
├── data/                     # SQLite database (auto-created)
├── deploy-commands.js        # Command registration script
├── package.json
├── .env.example
└── README.md
```

## Commands Reference

### Task Management

- `/task add <description> [due_date]` - Create new task
- `/task list [filter]` - Show tasks
- `/task done <task_id>` - Complete task
- `/task delete <task_id>` - Remove task
- `/task edit <task_id> <new_text>` - Edit task

### List Management

- `/list create <name>` - Create new list
- `/list add <list_name> <item>` - Add item
- `/list show <list_name>` - Display list
- `/list remove <list_name> <item>` - Remove item
- `/list toggle <list_name> <item>` - Toggle completion
- `/list clear <list_name>` - Clear completed
- `/list delete <list_name>` - Delete list
- `/list all` - Show all lists

### Reminders

- `/remind me <message> <time>` - One-time reminder
- `/remind daily <message> <time>` - Daily reminder
- `/remind weekly <message> <day> <time>` - Weekly reminder
- `/remind list` - Show reminders
- `/remind delete <reminder_id>` - Remove reminder

### And more

## Database

The bot uses SQLite with Sequelize ORM. The database file is automatically created at `./data/bwaincell.sqlite` on first run.

### Data Persistence

- All user data is isolated by user ID and guild ID
- Database is stored locally
- Automatic schema synchronization on startup

## Troubleshooting

### Bot not responding to commands

1. Ensure slash commands are deployed: `node deploy-commands.js`
2. Check bot has proper permissions in the channel
3. Verify bot is online and connected

### Database errors

1. Delete `./data/bwaincell.sqlite` to reset database
2. Ensure write permissions in the data directory
3. Check for SQLite installation issues

### Reminders not working

1. Check bot stays online continuously
2. Verify timezone settings in `.env`
3. Check reminder time format (24-hour)

## Development

### Adding New Commands

1. Create new file in `commands/` directory
2. Use the existing command structure as template
3. Add corresponding model in `database/models/` if needed
4. Run `node deploy-commands.js` to register

### Running in Development

```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Run with auto-restart
nodemon src/bot.js
```

## Security Notes

- Never commit `.env` file
- Keep bot token secret
- Use environment variables for sensitive data
- Regular backups of database recommended

## Support

For issues or questions about the bot implementation, refer to the command implementations in the `commands/` directory or check the error logs.

## License

This bot is for personal use. Modify as needed for your server.

---

**Bot Version**: 1.0.0
**Discord.js Version**: 14.14.1
**Node.js Required**: 16.9.0 or higher
