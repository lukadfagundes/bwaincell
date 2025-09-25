import {
    StringSelectMenuInteraction,
    CacheType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import { getModels } from '../helpers/databaseHelper';
import { handleInteractionError } from '../responses/errorResponses';
import { logger } from '@shared/utils/logger';

export async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction<CacheType>): Promise<void> {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;

    if (!guildId) {
        logger.warn('Select menu interaction attempted outside of guild', { userId, customId });
        await interaction.followUp({ content: '❌ This command can only be used in a server.', ephemeral: true });
        return;
    }

    const { Task, List, Reminder } = await getModels();

    try {
        // Task quick action
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

        // Task complete select
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

        // Reminder quick delete
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

        // List quick select
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
        await handleInteractionError(interaction, error, 'select menu handler');
    }
}