const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { handleButtonInteraction, handleSelectMenuInteraction, handleModalSubmit } = require('../utils/interactionHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
    ]
});

client.commands = new Collection();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DATABASE_PATH || './data/bwaincell.sqlite',
    logging: false
});

async function loadModels() {
    const modelsPath = path.join(__dirname, '..', 'database', 'models');
    const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));

    for (const file of modelFiles) {
        const model = require(path.join(modelsPath, file));
        if (model.init) {
            model.init(sequelize);
        }
    }

    await sequelize.sync();
    console.log('Database synced successfully');
}

async function loadCommands() {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        }
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        await loadModels();
        await loadCommands();

        const scheduler = require('../utils/scheduler');
        scheduler.initialize(client);

        console.log('Bot initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize bot:', error);
        process.exit(1);
    }
});

client.on('interactionCreate', async interaction => {
    // Handle autocomplete interactions
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        if (!command.autocomplete) {
            console.error(`Command ${interaction.commandName} does not have autocomplete.`);
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(`Error handling autocomplete for ${interaction.commandName}:`, error);
        }
        return;
    }

    // Handle button interactions
    if (interaction.isButton()) {
        try {
            await handleButtonInteraction(interaction);
        } catch (error) {
            console.error('Error handling button interaction:', error);
            await interaction.reply({ content: 'An error occurred while processing this button.', ephemeral: true });
        }
        return;
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
        try {
            await handleSelectMenuInteraction(interaction);
        } catch (error) {
            console.error('Error handling select menu interaction:', error);
            await interaction.reply({ content: 'An error occurred while processing this selection.', ephemeral: true });
        }
        return;
    }

    // Handle modal submits
    if (interaction.isModalSubmit()) {
        try {
            await handleModalSubmit(interaction);
        } catch (error) {
            console.error('Error handling modal submit:', error);
            await interaction.reply({ content: 'An error occurred while processing this form.', ephemeral: true });
        }
        return;
    }

    // Handle slash commands
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        await interaction.reply({ content: 'Unknown command!', ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);

        const errorMessage = {
            content: 'There was an error executing this command!',
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

client.login(process.env.BOT_TOKEN).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});