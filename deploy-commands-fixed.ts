import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from './shared/utils/logger';

dotenv.config();

interface Command {
    data: {
        name: string;
        toJSON(): any;
    };
    execute: Function;
}

interface DeployedCommand {
    length: number;
}

const commands: any[] = [];
const commandsPath = path.join(__dirname, 'commands');

// Check if commands directory exists
if (!fs.existsSync(commandsPath)) {
    logger.error('Commands directory not found', { path: commandsPath });
    process.exit(1);
}

// CRITICAL FIX: Filter out .d.ts files and only load .js or .ts files
const commandFiles = fs.readdirSync(commandsPath).filter(file => {
    return (file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts');
});

for (const file of commandFiles) {
    try {
        // CRITICAL FIX: Handle both default and named exports
        const commandModule = require(path.join(commandsPath, file));
        const command: Command = commandModule.default || commandModule;

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            logger.info('Loaded command for deployment', { command: command.data.name, file });
        } else {
            logger.warn('Command file missing required data or execute properties', { file });
        }
    } catch (error) {
        logger.error('Error loading command file', {
            file,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

if (commands.length === 0) {
    logger.warn('No commands found to deploy');
    process.exit(0);
}

// Validate required environment variables
if (!process.env.BOT_TOKEN) {
    logger.error('BOT_TOKEN environment variable is required');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    logger.error('CLIENT_ID environment variable is required');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async (): Promise<void> => {
    try {
        logger.info('Started refreshing application commands', { count: commands.length });

        if (process.env.GUILD_ID) {
            // Fix: Add type assertion to bypass TS error
            const clientId = process.env.CLIENT_ID as string;
            const guildId = process.env.GUILD_ID as string;

            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            ) as DeployedCommand;

            logger.info('Successfully reloaded guild commands', {
                count: data.length,
                guildId: process.env.GUILD_ID
            });
        } else {
            const clientId = process.env.CLIENT_ID as string;

            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            ) as DeployedCommand;

            logger.info('Successfully reloaded global commands', { count: data.length });
        }
    } catch (error) {
        logger.error('Error deploying commands', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        process.exit(1);
    }
})();