import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from './shared/utils/logger';

dotenv.config();

const commands: any[] = [];
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    logger.error('Commands directory not found. Run build first.');
    process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js') && !file.endsWith('.d.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath).default || require(filePath);

    if (command.data && command.execute) {
        commands.push(command.data.toJSON());
        logger.info(`Loaded command: ${command.data.name}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID!,
                process.env.GUILD_ID!
            ),
            { body: commands }
        );

        logger.info(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
        logger.error('Failed to deploy commands', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        process.exit(1);
    }
})();
