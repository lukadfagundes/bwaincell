import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    ButtonInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    CacheType,
    Collection
} from 'discord.js';
import { dinnerOptions, movieData } from './recipeData';
import { logger } from '../shared/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Remove unused interfaces
interface TaskModel {
    id: number;
    description: string;
    due_date?: Date;
    completed: boolean;
    user_id: string;
    guild_id: string;
}

interface ListModel {
    id: number;
    name: string;
    items: Array<{ text: string; completed: boolean }>;
    user_id: string;
    guild_id: string;
    save(): Promise<void>;
}

// Database operations interfaces
interface TaskOperations {
    getUserTasks(userId: string, guildId: string, status?: string): Promise<TaskModel[]>;
    completeTask(taskId: number, userId: string, guildId: string): Promise<TaskModel | null>;
    findOne(options: any): Promise<TaskModel | null>;
    createTask(userId: string, guildId: string, description: string, dueDate?: Date): Promise<TaskModel>;
    editTask(taskId: number, userId: string, guildId: string, description: string): Promise<TaskModel | null>;
    deleteTask(taskId: number, userId: string, guildId: string): Promise<boolean>;
}

interface ListOperations {
    findOne(options: any): Promise<ListModel | null>;
    createList(userId: string, guildId: string, name: string): Promise<ListModel>;
    addItem(userId: string, guildId: string, listName: string, item: string): Promise<boolean>;
}

interface ReminderOperations {
    deleteReminder(reminderId: number, userId: string, guildId: string): Promise<boolean>;
}

interface DatabaseModels {
    Task: TaskOperations;
    List: ListOperations;
    Reminder: ReminderOperations;
}

// Command interface for Discord.js client
interface CommandWithExecute {
    data: any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

// Extend the Discord.js Client interface
declare module 'discord.js' {
    interface Client {
        commands: Collection<string, CommandWithExecute>;
    }
}

// Type guards removed - not used in current implementation

// Helper function to get models
async function getModels(): Promise<DatabaseModels> {
    const TaskModule = require('../database/models/Task');
    const ListModule = require('../database/models/List');
    const ReminderModule = require('../database/models/Reminder');

    // Handle both default and named exports
    const Task = (TaskModule.default || TaskModule) as TaskOperations;
    const List = (ListModule.default || ListModule) as ListOperations;
    const Reminder = (ReminderModule.default || ReminderModule) as ReminderOperations;

    return { Task, List, Reminder };
}

export const interactionHandler = {
    async handleButtonInteraction(interaction: ButtonInteraction<CacheType>): Promise<void> {
        const customId = interaction.customId;
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;

        if (!guildId) {
            logger.warn('Button interaction attempted outside of guild', { userId, customId });
            await interaction.followUp({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        // Get models
        const { Task, List, Reminder } = await getModels();

        try {
            // CRITICAL: Immediately acknowledge the button interaction (except for modals)
            // Modals can't be shown after deferring
            const isModalButton = customId.includes('_add_new') || customId.includes('_edit_') ||
                                customId.includes('list_add_') && !customId.includes('list_add_item_modal');

            if (!isModalButton) {
                await interaction.deferUpdate().catch(() =>
                    interaction.deferReply({ ephemeral: true })
                );
            }

            // Task button handlers
            if (customId.startsWith('task_')) {
                if (customId === 'task_add_new') {
                    const modal = new ModalBuilder()
                        .setCustomId('task_add_modal')
                        .setTitle('Create New Task');

                    const descriptionInput = new TextInputBuilder()
                        .setCustomId('task_description')
                        .setLabel('Task Description')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMaxLength(200);

                    const dueDateInput = new TextInputBuilder()
                        .setCustomId('task_due_date')
                        .setLabel('Due Date (optional, YYYY-MM-DD HH:MM)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setPlaceholder('2025-12-25 14:00');

                    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
                    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(dueDateInput);

                    modal.addComponents(firstRow, secondRow);
                    await interaction.showModal(modal);
                    return;
                }

                if (customId === 'task_quick_complete') {
                    const tasks = await Task.getUserTasks(userId, guildId, 'pending');
                    if (!tasks || tasks.length === 0) {
                        await interaction.followUp({ content: '❌ No pending tasks to complete!', ephemeral: true });
                        return;
                    }

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('task_complete_select')
                        .setPlaceholder('Select a task to complete')
                        .addOptions(tasks.slice(0, 25).map(task => ({
                            label: `#${task.id} - ${task.description.substring(0, 50)}`,
                            description: task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No due date',
                            value: `${task.id}`
                        })));

                    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
                    await interaction.followUp({
                        content: '✅ Select a task to mark as complete:',
                        components: [row],
                        ephemeral: true
                    });
                    return;
                }

                if (customId.startsWith('task_done_')) {
                    const taskId = parseInt(customId.split('_')[2]);
                    const task = await Task.completeTask(taskId, userId, guildId);
                    if (task) {
                        await interaction.followUp({
                            content: `✅ Task #${taskId}: "${task.description}" marked as complete!`,
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: `❌ Task #${taskId} not found.`,
                            ephemeral: true
                        });
                    }
                    return;
                }

                if (customId.startsWith('task_edit_')) {
                    const taskId = parseInt(customId.split('_')[2]);
                    const task = await Task.findOne({
                        where: { id: taskId, user_id: userId, guild_id: guildId }
                    });

                    if (!task) {
                        await interaction.followUp({
                            content: `❌ Task #${taskId} not found.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const modal = new ModalBuilder()
                        .setCustomId(`task_edit_modal_${taskId}`)
                        .setTitle(`Edit Task #${taskId}`);

                    const newDescriptionInput = new TextInputBuilder()
                        .setCustomId('task_new_description')
                        .setLabel('New Task Description')
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue(task.description)
                        .setRequired(true)
                        .setMaxLength(200);

                    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(newDescriptionInput);
                    modal.addComponents(row);
                    await interaction.showModal(modal);
                    return;
                }

                if (customId.startsWith('task_delete_')) {
                    const taskId = parseInt(customId.split('_')[2]);
                    const deleted = await Task.deleteTask(taskId, userId, guildId);
                    if (deleted) {
                        await interaction.followUp({
                            content: `🗑️ Task #${taskId} has been deleted.`,
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: `❌ Task #${taskId} not found.`,
                            ephemeral: true
                        });
                    }
                    return;
                }

                if (customId === 'task_list_all' || customId === 'task_list_pending' || customId === 'task_refresh') {
                    const filter = customId === 'task_list_pending' ? 'pending' : 'all';

                    const command = interaction.client.commands.get('task');
                    if (command) {
                        // Create a mock options object for the command
                        const mockInteraction = {
                            ...interaction,
                            options: {
                                getSubcommand: () => 'list',
                                getString: (name: string) => {
                                    if (name === 'filter') return filter;
                                    return null;
                                }
                            }
                        } as unknown as ChatInputCommandInteraction;

                        await command.execute(mockInteraction);
                    }
                    return;
                }
            }

            // List button handlers
            if (customId.startsWith('list_')) {
                if (customId.startsWith('list_add_')) {
                    const listName = customId.replace('list_add_', '');
                    const modal = new ModalBuilder()
                        .setCustomId(`list_add_item_modal_${encodeURIComponent(listName)}`)
                        .setTitle(`Add Item to ${listName}`);

                    const itemInput = new TextInputBuilder()
                        .setCustomId('list_item')
                        .setLabel('Item to add')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setMaxLength(100);

                    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(itemInput);
                    modal.addComponents(row);
                    await interaction.showModal(modal);
                    return;
                }

                if (customId.startsWith('list_view_')) {
                    const listName = customId.replace('list_view_', '');
                    const list = await List.findOne({
                        where: { user_id: userId, guild_id: guildId, name: listName }
                    });

                    if (!list) {
                        await interaction.followUp({
                            content: `❌ List "${listName}" not found.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`📝 ${list.name}`)
                        .setColor(0x0099FF)
                        .setTimestamp();

                    if (!list.items || list.items.length === 0) {
                        embed.setDescription('This list is empty. Add some items to get started!');
                    } else {
                        const itemList = list.items.map(item => {
                            const checkbox = item.completed ? '☑️' : '⬜';
                            return `${checkbox} ${item.text}`;
                        }).join('\n');
                        embed.setDescription(itemList);
                        embed.setFooter({
                            text: `${list.items.filter(i => i.completed).length}/${list.items.length} completed`
                        });
                    }

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`list_add_${listName}`)
                                .setLabel('Add Item')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('➕'),
                            new ButtonBuilder()
                                .setCustomId(`list_clear_${listName}`)
                                .setLabel('Clear Completed')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🧹')
                                .setDisabled(!list.items || !list.items.some(i => i.completed))
                        );

                    await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
                    return;
                }

                if (customId.startsWith('list_clear_')) {
                    const listName = customId.replace('list_clear_', '');
                    const list = await List.findOne({
                        where: { user_id: userId, guild_id: guildId, name: listName }
                    });

                    if (!list) {
                        await interaction.followUp({
                            content: `❌ List "${listName}" not found.`,
                            ephemeral: true
                        });
                        return;
                    }

                    let cleared = 0;
                    if (list.items && list.items.length > 0) {
                        const beforeCount = list.items.length;
                        list.items = list.items.filter(item => !item.completed);
                        cleared = beforeCount - list.items.length;
                        await list.save();
                    }

                    await interaction.followUp({
                        content: `🧹 Cleared ${cleared} completed items from "${listName}".`,
                        ephemeral: true
                    });
                    return;
                }

                if (customId.startsWith('list_refresh_')) {
                    const listName = customId.replace('list_refresh_', '');

                    const command = interaction.client.commands.get('list');
                    if (command) {
                        const mockInteraction = {
                            ...interaction,
                            options: {
                                getSubcommand: () => 'show',
                                getString: (name: string) => {
                                    if (name === 'list_name') return listName;
                                    return null;
                                }
                            }
                        } as unknown as ChatInputCommandInteraction;

                        await command.execute(mockInteraction);
                    }
                    return;
                }
            }

            // Reminder button handlers
            if (customId.startsWith('reminder_')) {
                if (customId.startsWith('reminder_delete_')) {
                    const reminderId = parseInt(customId.split('_')[2]);
                    const deleted = await Reminder.deleteReminder(reminderId, userId, guildId);
                    if (deleted) {
                        await interaction.followUp({
                            content: `🗑️ Reminder #${reminderId} has been cancelled.`,
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: `❌ Reminder #${reminderId} not found.`,
                            ephemeral: true
                        });
                    }
                    return;
                }

                if (customId === 'reminder_add_new' || customId === 'reminder_add_another') {
                    await interaction.followUp({
                        content: '⏰ Use `/remind me`, `/remind daily`, or `/remind weekly` to create a new reminder!',
                        ephemeral: true
                    });
                    return;
                }

                if (customId === 'reminder_list' || customId === 'reminder_refresh') {
                    const command = interaction.client.commands.get('remind');
                    if (command) {
                        const mockInteraction = {
                            ...interaction,
                            options: {
                                getSubcommand: () => 'list'
                            }
                        } as unknown as ChatInputCommandInteraction;

                        await command.execute(mockInteraction);
                    }
                    return;
                }

                if (customId.startsWith('reminder_create_')) {
                    const type = customId.split('_')[2];
                    await interaction.followUp({
                        content: `⏰ Use \`/remind ${type === 'once' ? 'me' : type}\` to create a ${type} reminder!`,
                        ephemeral: true
                    });
                    return;
                }
            }

            // Random button handlers
            if (customId.startsWith('random_')) {
                if (customId === 'random_movie_reroll') {
                    const movieTitles = Object.keys(movieData);
                    const movie = movieTitles[Math.floor(Math.random() * movieTitles.length)];
                    const details = (movieData as any)[movie];

                    const embed = new EmbedBuilder()
                        .setTitle('🎬 Random Movie Pick')
                        .setDescription(`**${movie}**`)
                        .addFields(
                            { name: 'Year', value: details.year, inline: true },
                            { name: 'Genre', value: details.genre, inline: true },
                            { name: 'IMDb Rating', value: `⭐ ${details.rating}/10`, inline: true }
                        )
                        .setColor(0x9932CC)
                        .setTimestamp()
                        .setFooter({ text: 'Click the button below for more info' });

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('View on IMDb')
                                .setURL(details.link)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji('🎥'),
                            new ButtonBuilder()
                                .setCustomId('random_movie_reroll')
                                .setLabel('Pick Another')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🎲')
                        );

                    await interaction.update({ embeds: [embed], components: [row] });
                    return;
                }

                if (customId === 'random_dinner_reroll') {
                    const dinnerNames = Object.keys(dinnerOptions);
                    const dinner = dinnerNames[Math.floor(Math.random() * dinnerNames.length)];
                    const details = (dinnerOptions as any)[dinner];

                    const embed = new EmbedBuilder()
                        .setTitle('🍽️ Random Dinner Pick')
                        .setDescription(`**${dinner}**\n${details.description}`)
                        .setImage(details.image)
                        .addFields(
                            { name: '⏱️ Prep Time', value: details.prepTime, inline: true },
                            { name: '📊 Difficulty', value: details.difficulty, inline: true }
                        )
                        .setColor(0x9932CC)
                        .setTimestamp()
                        .setFooter({ text: 'Click below for the full recipe!' });

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('View Recipe')
                                .setURL(details.recipe)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji('📖'),
                            new ButtonBuilder()
                                .setCustomId('random_dinner_reroll')
                                .setLabel('Pick Another')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🎲'),
                            new ButtonBuilder()
                                .setCustomId(`save_dinner_${encodeURIComponent(dinner)}`)
                                .setLabel('Save to List')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('💾')
                        );

                    await interaction.update({ embeds: [embed], components: [row] });
                    return;
                }

                if (customId.startsWith('save_dinner_')) {
                    const dinnerName = decodeURIComponent(customId.replace('save_dinner_', ''));

                    // Try to find or create a "Meal Ideas" list
                    let list = await List.findOne({
                        where: { user_id: userId, guild_id: guildId, name: 'Meal Ideas' }
                    });

                    if (!list) {
                        list = await List.createList(userId, guildId, 'Meal Ideas');
                    }

                    // Add the dinner to the list
                    const updated = await List.addItem(userId, guildId, 'Meal Ideas', dinnerName);

                    if (updated) {
                        await interaction.followUp({
                            content: `✅ Added "${dinnerName}" to your Meal Ideas list!`,
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: `❌ Could not add item to list.`,
                            ephemeral: true
                        });
                    }
                    return;
                }

                if (customId === 'random_date_reroll') {
                    const dateIdeas = [
                        "Picnic in the park", "Movie night at home", "Visit a museum", "Go bowling",
                        "Wine tasting", "Beach walk at sunset", "Cooking class together", "Escape room",
                        "Mini golf", "Board game night", "Stargazing", "Visit a farmers market",
                        "Go to a concert", "Take a dance class", "Visit an aquarium", "Go hiking"
                    ];

                    const date = dateIdeas[Math.floor(Math.random() * dateIdeas.length)];
                    const embed = new EmbedBuilder()
                        .setTitle('💑 Random Date Idea')
                        .setDescription(`**${date}**`)
                        .addFields({ name: '💡 Tip', value: 'Make it special by adding your personal touch!' })
                        .setColor(0x9932CC)
                        .setTimestamp();

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('random_date_reroll')
                                .setLabel('Get Another Idea')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('💝')
                        );

                    await interaction.update({ embeds: [embed], components: [row] });
                    return;
                }

                if (customId === 'random_question_reroll') {
                    const conversationStarters = [
                        "What's the best advice you've ever received?",
                        "If you could have dinner with anyone, dead or alive, who would it be?",
                        "What's your favorite childhood memory?",
                        "What skill would you love to learn and why?",
                        "If you could live anywhere in the world, where would it be?",
                        "What's the most interesting place you've ever visited?",
                        "What's something you've always wanted to try but haven't yet?",
                        "If you won the lottery tomorrow, what's the first thing you'd do?",
                        "What's your biggest pet peeve?",
                        "What's the best compliment you've ever received?",
                        "If you could time travel, would you go to the past or future?",
                        "What's your hidden talent?",
                        "What's the most spontaneous thing you've ever done?",
                        "If your life was a movie, what would it be called?",
                        "What's your favorite way to spend a weekend?"
                    ];

                    const question = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
                    const embed = new EmbedBuilder()
                        .setTitle('💭 Conversation Starter')
                        .setDescription(question)
                        .setColor(0x9932CC)
                        .setTimestamp();

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('random_question_reroll')
                                .setLabel('Next Question')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('💬')
                        );

                    await interaction.update({ embeds: [embed], components: [row] });
                    return;
                }
            }

            // Schedule, Budget, Track, Note button handlers
            if (customId === 'schedule_add_new' || customId === 'budget_add_new' ||
                customId === 'tracker_add_new' || customId === 'note_add_new') {
                const commandName = customId.split('_')[0];
                await interaction.followUp({
                    content: `📝 Use \`/${commandName} add\` to create a new ${commandName} entry!`,
                    ephemeral: true
                });
                return;
            }

        } catch (error) {
            logger.error('Button interaction error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                customId,
                userId,
                guildId
            });
            if (!interaction.replied && !interaction.deferred) {
                await interaction.followUp({
                    content: '❌ An error occurred while processing this button.',
                    ephemeral: true
                });
            }
        }
    },

    async handleSelectMenuInteraction(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
        const customId = interaction.customId;
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;

        if (!guildId) {
            logger.warn('Select menu interaction attempted outside of guild', { userId, customId });
            await interaction.followUp({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        // Get models
        const { Task, List, Reminder } = await getModels();

        try {
            if (customId === 'task_quick_action') {
                const taskId = parseInt(interaction.values[0]);
                const task = await Task.findOne({
                    where: { id: taskId, user_id: userId, guild_id: guildId }
                });

                if (!task) {
                    await interaction.followUp({
                        content: '❌ Task not found.',
                        ephemeral: true
                    });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle(`📋 Task #${task.id}`)
                    .setDescription(task.description)
                    .setColor(task.completed ? 0x00FF00 : 0x0099FF)
                    .setTimestamp();

                if (task.due_date) {
                    embed.addFields({
                        name: '📅 Due Date',
                        value: new Date(task.due_date).toLocaleString()
                    });
                }

                if (task.completed) {
                    embed.addFields({
                        name: '✅ Status',
                        value: 'Completed'
                    });
                }

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`task_done_${task.id}`)
                            .setLabel('Mark as Done')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('✅')
                            .setDisabled(task.completed),
                        new ButtonBuilder()
                            .setCustomId(`task_edit_${task.id}`)
                            .setLabel('Edit')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('✏️'),
                        new ButtonBuilder()
                            .setCustomId(`task_delete_${task.id}`)
                            .setLabel('Delete')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🗑️')
                    );

                await interaction.followUp({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
                return;
            }

            if (customId === 'task_complete_select') {
                const taskId = parseInt(interaction.values[0]);
                const task = await Task.completeTask(taskId, userId, guildId);
                if (task) {
                    await interaction.followUp({
                        content: `✅ Task #${taskId}: "${task.description}" marked as complete!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ Task #${taskId} not found.`,
                        ephemeral: true
                    });
                }
                return;
            }

            if (customId === 'reminder_quick_delete') {
                const reminderId = parseInt(interaction.values[0]);
                const deleted = await Reminder.deleteReminder(reminderId, userId, guildId);
                if (deleted) {
                    await interaction.followUp({
                        content: `🗑️ Reminder #${reminderId} has been cancelled.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ Reminder #${reminderId} not found.`,
                        ephemeral: true
                    });
                }
                return;
            }

            if (customId === 'list_quick_select') {
                const listId = parseInt(interaction.values[0]);
                const list = await List.findOne({
                    where: { id: listId, user_id: userId, guild_id: guildId }
                });

                if (!list) {
                    await interaction.followUp({
                        content: '❌ List not found.',
                        ephemeral: true
                    });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle(`📝 ${list.name}`)
                    .setColor(0x0099FF)
                    .setTimestamp()
                    .setFooter({ text: `${list.items ? list.items.length : 0} items total` });

                if (!list.items || list.items.length === 0) {
                    embed.setDescription('This list is empty. Add some items to get started!');
                } else {
                    const itemList = list.items.slice(0, 20).map(item => {
                        const checkbox = item.completed ? '☑️' : '⬜';
                        return `${checkbox} ${item.text}`;
                    }).join('\n');
                    embed.setDescription(itemList);

                    if (list.items.length > 20) {
                        embed.addFields({
                            name: '📌 Note',
                            value: `Showing first 20 of ${list.items.length} items`
                        });
                    }
                }

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`list_add_${list.name}`)
                            .setLabel('Add Item')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('➕'),
                        new ButtonBuilder()
                            .setCustomId(`list_clear_${list.name}`)
                            .setLabel('Clear Completed')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🧹')
                            .setDisabled(!list.items || !list.items.some(i => i.completed))
                    );

                await interaction.followUp({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
                return;
            }

        } catch (error) {
            logger.error('Select menu interaction error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                customId,
                userId,
                guildId
            });
            if (!interaction.replied && !interaction.deferred) {
                await interaction.followUp({
                    content: '❌ An error occurred while processing this selection.',
                    ephemeral: true
                });
            }
        }
    },

    async handleModalSubmit(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
        const customId = interaction.customId;
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;

        if (!guildId) {
            logger.warn('Modal submit attempted outside of guild', { userId, customId });
            await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        // Defer the modal reply immediately
        await interaction.deferReply({ ephemeral: true });

        // Get models
        const { Task, List } = await getModels();

        try {
            if (customId === 'task_add_modal') {
                const description = interaction.fields.getTextInputValue('task_description');
                const dueDateStr = interaction.fields.getTextInputValue('task_due_date');
                let dueDate: Date | null = null;

                if (dueDateStr && dueDateStr.trim()) {
                    dueDate = new Date(dueDateStr);
                    if (isNaN(dueDate.getTime())) {
                        await interaction.editReply({
                            content: '❌ Invalid date format. Use YYYY-MM-DD HH:MM'

                        });
                        return;
                    }
                }

                const task = await Task.createTask(userId, guildId, description, dueDate || undefined);

                const embed = new EmbedBuilder()
                    .setTitle('✨ Task Created')
                    .setDescription(`Task #${task.id}: ${task.description}`)
                    .setColor(0x00FF00)
                    .setTimestamp();

                if (dueDate) {
                    embed.addFields({
                        name: '📅 Due Date',
                        value: dueDate.toLocaleString()
                    });
                }

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`task_done_${task.id}`)
                            .setLabel('Mark as Done')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('✅'),
                        new ButtonBuilder()
                            .setCustomId('task_list_all')
                            .setLabel('View All Tasks')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('📋')
                    );

                await interaction.followUp({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
                return;
            }

            if (customId.startsWith('task_edit_modal_')) {
                const taskId = parseInt(customId.split('_')[3]);
                const newDescription = interaction.fields.getTextInputValue('task_new_description');

                const task = await Task.editTask(taskId, userId, guildId, newDescription);

                if (task) {
                    const embed = new EmbedBuilder()
                        .setTitle('✏️ Task Updated')
                        .setDescription(`Task #${task.id}: ${task.description}`)
                        .setColor(0x0099FF)
                        .setTimestamp();

                    await interaction.followUp({
                        embeds: [embed],
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ Task #${taskId} not found or doesn't belong to you.`,
                        ephemeral: true
                    });
                }
                return;
            }

            if (customId.startsWith('list_add_item_modal_')) {
                const listName = decodeURIComponent(customId.replace('list_add_item_modal_', ''));
                const item = interaction.fields.getTextInputValue('list_item');

                const updated = await List.addItem(userId, guildId, listName, item);

                if (updated) {
                    await interaction.editReply({
                        content: `✅ Added "${item}" to "${listName}"!`

                    });
                } else {
                    await interaction.editReply({
                        content: `❌ Could not add item. List "${listName}" may not exist.`

                    });
                }
                return;
            }

        } catch (error) {
            logger.error('Modal submit error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                customId,
                userId,
                guildId
            });
            if (!interaction.replied && !interaction.deferred) {
                await interaction.followUp({
                    content: '❌ An error occurred while processing this form.',
                    ephemeral: true
                });
            }
        }
    }
};

// Export the handler functions for use in bot.ts
export const handleButtonInteraction = interactionHandler.handleButtonInteraction;
export const handleSelectMenuInteraction = interactionHandler.handleSelectMenuInteraction;
export const handleModalSubmit = interactionHandler.handleModalSubmit;
