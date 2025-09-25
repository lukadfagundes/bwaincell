/**
 * @module TaskHandlers
 * @description Handles all task-related Discord button interactions including
 * create, complete, edit, delete, and list operations for the task management system.
 * @requires discord.js
 * @requires database/models/Task
 */

import {
    ButtonInteraction,
    CacheType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ChatInputCommandInteraction
} from 'discord.js';
import { getModels } from '../helpers/databaseHelper';
import { handleInteractionError } from '../responses/errorResponses';

/**
 * Handles all task-related button interactions from Discord
 *
 * @param {ButtonInteraction<CacheType>} interaction - Discord button interaction
 * @returns {Promise<void>} Sends response to Discord through interaction methods
 * @throws {Error} Database errors are caught and handled gracefully
 *
 * @example
 * // Handles task completion button
 * await handleTaskButton(interaction); // where customId is 'task_done_123'
 *
 * @example
 * // Handles task creation modal
 * await handleTaskButton(interaction); // where customId is 'task_add_new'
 */
export async function handleTaskButton(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;

    if (!guildId) {
        // Check if already acknowledged before responding
        if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
        } else {
            await interaction.followUp({ content: '❌ This command can only be used in a server.', ephemeral: true });
        }
        return;
    }

    const { Task } = await getModels();

    try {
        // Add new task modal
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

        // Quick complete task select menu
        if (customId === 'task_quick_complete') {
            const tasks = await Task.getUserTasks(userId, guildId, 'pending');
            if (!tasks || tasks.length === 0) {
                // Check if already acknowledged before responding
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({ content: '❌ No pending tasks to complete!', ephemeral: true });
                } else {
                    await interaction.followUp({ content: '❌ No pending tasks to complete!', ephemeral: true });
                }
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
            // Check if already acknowledged before responding
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({
                    content: '✅ Select a task to mark as complete:',
                    components: [row],
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: '✅ Select a task to mark as complete:',
                    components: [row],
                    ephemeral: true
                });
            }
            return;
        }

        // Complete task
        if (customId.startsWith('task_done_')) {
            const taskId = parseInt(customId.split('_')[2]);
            const task = await Task.completeTask(taskId, userId, guildId);
            // Check if already acknowledged before responding
            if (!interaction.deferred && !interaction.replied) {
                if (task) {
                    await interaction.reply({
                        content: `✅ Task #${taskId}: "${task.description}" marked as complete!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `❌ Task #${taskId} not found.`,
                        ephemeral: true
                    });
                }
            } else {
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
            }
            return;
        }

        // Edit task modal
        if (customId.startsWith('task_edit_')) {
            const taskId = parseInt(customId.split('_')[2]);
            const task = await Task.findOne({
                where: { id: taskId, user_id: userId, guild_id: guildId }
            });

            if (!task) {
                // Check if already acknowledged before responding
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({
                        content: `❌ Task #${taskId} not found.`,
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

        // Delete task
        if (customId.startsWith('task_delete_')) {
            const taskId = parseInt(customId.split('_')[2]);
            const deleted = await Task.deleteTask(taskId, userId, guildId);
            // Check if already acknowledged before responding
            if (!interaction.deferred && !interaction.replied) {
                if (deleted) {
                    await interaction.reply({
                        content: `🗑️ Task #${taskId} has been deleted.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `❌ Task #${taskId} not found.`,
                        ephemeral: true
                    });
                }
            } else {
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
            }
            return;
        }

        // List tasks
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
    } catch (error) {
        await handleInteractionError(interaction, error, 'task button handler');
    }
}