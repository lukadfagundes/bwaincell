import dotenv from 'dotenv';

// Load environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export interface DiscordConfig {
  token: string;
  clientId: string;
  guildId?: string;
}

export interface DatabaseConfig {
  path: string;
}

export interface SettingsConfig {
  timezone: string;
  defaultReminderChannel?: string;
  deleteCommandAfter: number;
}

export interface BotConfig {
  discord: DiscordConfig;
  database: DatabaseConfig;
  settings: SettingsConfig;
}

const config: BotConfig = {
  discord: {
    token: process.env.BOT_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID,
  },
  database: {
    path: process.env.DATABASE_PATH || './data/bwaincell.sqlite',
  },
  settings: {
    timezone: process.env.TIMEZONE || 'America/Los_Angeles',
    defaultReminderChannel: process.env.DEFAULT_REMINDER_CHANNEL,
    deleteCommandAfter: parseInt(process.env.DELETE_COMMAND_AFTER || '5000') || 5000,
  },
};

// Validation
if (!config.discord.token) {
  throw new Error('BOT_TOKEN environment variable is required');
}

if (!config.discord.clientId) {
  throw new Error('CLIENT_ID environment variable is required');
}

export default config;
