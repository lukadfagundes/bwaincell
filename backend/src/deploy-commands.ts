/* eslint-disable @typescript-eslint/no-explicit-any */
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { logger } from '../shared/utils/logger';

/**
 * Deploy Discord slash commands to guild
 *
 * Environment variables are loaded by:
 * - Development: dotenv-cli wrapper in package.json scripts
 * - Production: docker-compose env_file directive
 */

const commands: any[] = [];
const commandsPath = path.join(__dirname, '..', 'commands');

if (!fs.existsSync(commandsPath)) {
  logger.error('Commands directory not found.');
  process.exit(1);
}

// Support both TypeScript (dev) and JavaScript (production)
const isDevelopment = !__dirname.includes('dist');
const fileExtension = isDevelopment ? '.ts' : '.js';

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(fileExtension) && !file.endsWith('.d.ts'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath).default || require(filePath);

  if (command.data && command.execute) {
    commands.push(command.data.toJSON());
    logger.info(`Loaded command: ${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

(async () => {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), {
      body: commands,
    });

    logger.info(`Successfully reloaded ${commands.length} application (/) commands.`);
  } catch (error) {
    logger.error('Failed to deploy commands', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
})();
