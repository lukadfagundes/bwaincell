require('dotenv').config();

module.exports = {
    discord: {
        token: process.env.BOT_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID
    },
    database: {
        path: process.env.DATABASE_PATH || './data/bwaincell.sqlite'
    },
    settings: {
        timezone: process.env.TIMEZONE || 'America/Los_Angeles',
        defaultReminderChannel: process.env.DEFAULT_REMINDER_CHANNEL,
        deleteCommandAfter: parseInt(process.env.DELETE_COMMAND_AFTER) || 5000
    }
};