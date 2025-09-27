import {
    ModalSubmitInteraction,
    CacheType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import { getModels } from '../helpers/databaseHelper';
import { handleInteractionError } from '../responses/errorResponses';
import { logger } from '@shared/utils/logger';

export async function handleModalSubmit(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
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

    const { Task, List } = await getModels();

    try {
        // Add task modal
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

        // Edit task modal
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

        // Add list item modal
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
        await handleInteractionError(interaction, error, 'modal submit handler');
    }
}
