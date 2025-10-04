import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChatInputCommandInteraction,
    AutocompleteInteraction
} from 'discord.js';
import { logger } from '../shared/utils/logger';
import Task from '../database/models/Task';

type TaskFilter = 'all' | 'pending' | 'completed';

// Parse date in MM-DD-YYYY hh:mm AM/PM format
function parseDateString(dateStr: string): Date | null {
    // Match MM-DD-YYYY hh:mm AM/PM format
    const match = dateStr.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);

    if (!match) return null;

    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const year = parseInt(match[3]);
    let hours = parseInt(match[4]);
    const minutes = parseInt(match[5]);
    const period = match[6].toUpperCase();

    // Validate ranges
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (hours < 1 || hours > 12) return null;
    if (minutes < 0 || minutes > 59) return null;

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }

    const date = new Date(year, month - 1, day, hours, minutes);

    // Check if date is valid
    if (isNaN(date.getTime())) return null;

    return date;
}

export default {
    data: new SlashCommandBuilder()
        .setName('task')
        .setDescription('Manage your tasks')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Create a new task')
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Task description')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('date')
                        .setDescription('Due date (MM-DD-YYYY)')
                        .setRequired(false)
                        .setMaxLength(10))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Due time (hh:mm AM/PM)')
                        .setRequired(false)
                        .setMaxLength(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show your tasks')
                .addStringOption(option =>
                    option.setName('filter')
                        .setDescription('Filter tasks')
                        .setRequired(false)
                        .addChoices(
                            { name: 'All', value: 'all' },
                            { name: 'Pending', value: 'pending' },
                            { name: 'Completed', value: 'completed' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('done')
                .setDescription('Mark a task as complete')
                .addIntegerOption(option =>
                    option.setName('task_id')
                        .setDescription('Task ID to complete')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Remove a task')
                .addIntegerOption(option =>
                    option.setName('task_id')
                        .setDescription('Task ID to delete')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit task description')
                .addIntegerOption(option =>
                    option.setName('task_id')
                        .setDescription('Task ID to edit')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('new_text')
                        .setDescription('New task description')
                        .setRequired(true))),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        // Note: Interaction is already deferred by bot.js for immediate acknowledgment

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;

        if (!guildId) {
            await interaction.editReply({
                content: 'This command can only be used in a server.'
            });
            return;
        }

        try {
            switch (subcommand) {
                case 'add': {
                    const description = interaction.options.getString('description', true);
                    const dateStr = interaction.options.getString('date');
                    const timeStr = interaction.options.getString('time');
                    let dueDate: Date | undefined = undefined;

                    // If both date and time are provided, combine them
                    if (dateStr && timeStr) {
                        const combined = `${dateStr.trim()} ${timeStr.trim()}`;
                        const parsed = parseDateString(combined);
                        if (!parsed) {
                            await interaction.editReply({
                                content: `❌ Invalid date/time format.\n\nDate format: MM-DD-YYYY (e.g., 10-03-2025)\nTime format: hh:mm AM/PM (e.g., 2:30 PM)\n\nYou entered: "${combined}"`
                            });
                            return;
                        }
                        dueDate = parsed;
                        logger.info('Task date parsed successfully', {
                            input: combined,
                            parsed: dueDate.toISOString()
                        });
                    } else if (dateStr || timeStr) {
                        // Only one provided - show error
                        await interaction.editReply({
                            content: '❌ Please provide both date and time, or leave both empty.'
                        });
                        return;
                    }

                    const task = await Task.createTask(userId, guildId, description, dueDate);

                    const embed = new EmbedBuilder()
                        .setTitle('✨ Task Created')
                        .setDescription(`Task #${task.id}: ${task.description}`)
                        .setColor(0x00FF00)
                        .setTimestamp();

                    if (dueDate) {
                        embed.addFields({ name: '📅 Due Date', value: dueDate.toLocaleString(), inline: true });
                    }

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`task_done_${task.id}`)
                                .setLabel('Mark as Done')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('✅'),
                            new ButtonBuilder()
                                .setCustomId(`task_edit_${task.id}`)
                                .setLabel('Edit Task')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('✏️'),
                            new ButtonBuilder()
                                .setCustomId('task_list_all')
                                .setLabel('View All Tasks')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('📋')
                        );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'list': {
                    const filter = (interaction.options.getString('filter') as TaskFilter) || 'all';
                    const tasks= await Task.getUserTasks(userId, guildId, filter);

                    if (tasks.length === 0) {
                        const emptyEmbed = new EmbedBuilder()
                            .setTitle('📋 No Tasks Found')
                            .setDescription(`You don't have any ${filter === 'all' ? '' : filter} tasks.`)
                            .setColor(0xFFFF00)
                            .setTimestamp();

                        const row = new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('task_add_new')
                                    .setLabel('Create Your First Task')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('➕')
                            );

                        await interaction.editReply({ embeds: [emptyEmbed], components: [row] });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`📋 Your ${filter === 'all' ? '' : filter.charAt(0).toUpperCase() + filter.slice(1)} Tasks`)
                        .setColor(0x0099FF)
                        .setTimestamp()
                        .setFooter({ text: `Total: ${tasks.length} tasks` });

                    const taskList = tasks.slice(0, 25).map(task => {
                        const status = task.completed ? '✅' : '⏳';
                        const dueInfo = task.due_date ? ` 📅 Due: ${new Date(task.due_date).toLocaleDateString()}` : '';
                        return `${status} **#${task.id}** - ${task.description}${dueInfo}`;
                    }).join('\n');

                    embed.setDescription(taskList);

                    if (tasks.length > 25) {
                        embed.addFields({ name: '📌 Note', value: `Showing 25 of ${tasks.length} tasks` });
                    }

                    // Add interactive components
                    const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];
                    const row = new ActionRowBuilder<ButtonBuilder>();

                    if (tasks.some(t => !t.completed)) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId('task_quick_complete')
                                .setLabel('Quick Complete')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('✅')
                        );
                    }

                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId('task_add_new')
                            .setLabel('Add New Task')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('➕'),
                        new ButtonBuilder()
                            .setCustomId('task_refresh')
                            .setLabel('Refresh')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔄')
                    );

                    components.push(row);

                    // Add select menu for quick actions if not too many tasks
                    if (tasks.length <= 25 && tasks.length > 0) {
                        const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('task_quick_action')
                                    .setPlaceholder('Select a task for quick action')
                                    .addOptions(tasks.map(task => ({
                                        label: `#${task.id} - ${task.description.substring(0, 50)}`,
                                        description: task.completed ? 'Completed' : task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No due date',
                                        value: `${task.id}`,
                                        emoji: task.completed ? '✅' : '⏳'
                                    })))
                            );
                        components.push(selectRow);
                    }

                    await interaction.editReply({ embeds: [embed], components });
                    break;
                }

                case 'done': {
                    const taskId = interaction.options.getInteger('task_id', true);
                    const task = await Task.completeTask(taskId, userId, guildId);

                    if (!task) {
                        await interaction.editReply({
                            content: `❌ Task #${taskId} not found or doesn't belong to you.`

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🎉 Task Completed!')
                        .setDescription(`✅ Task #${task.id}: ${task.description}`)
                        .setColor(0x00FF00)
                        .setTimestamp()
                        .addFields({ name: '🏆 Status', value: 'Marked as complete!' });

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('task_add_new')
                                .setLabel('Add Another Task')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('➕'),
                            new ButtonBuilder()
                                .setCustomId('task_list_pending')
                                .setLabel('View Pending Tasks')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('⏳'),
                            new ButtonBuilder()
                                .setCustomId('task_list_all')
                                .setLabel('View All Tasks')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('📋')
                        );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'delete': {
                    const taskId = interaction.options.getInteger('task_id', true);
                    const deleted: boolean = await Task.deleteTask(taskId, userId, guildId);

                    if (!deleted) {
                        await interaction.editReply({
                            content: `❌ Task #${taskId} not found or doesn't belong to you.`
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🗑️ Task Deleted')
                        .setDescription(`Task #${taskId} has been removed from your list.`)
                        .setColor(0xFF0000)
                        .setTimestamp();

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('task_add_new')
                                .setLabel('Add New Task')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('➕'),
                            new ButtonBuilder()
                                .setCustomId('task_list_all')
                                .setLabel('View Remaining Tasks')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('📋')
                        );

                    await interaction.editReply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'edit': {
                    const taskId = interaction.options.getInteger('task_id', true);
                    const newText = interaction.options.getString('new_text', true);
                    const task = await Task.editTask(taskId, userId, guildId, newText);

                    if (!task) {
                        await interaction.editReply({
                            content: `❌ Task #${taskId} not found or doesn't belong to you.`

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('✏️ Task Updated')
                        .setDescription(`Task #${task.id}: ${task.description}`)
                        .setColor(0x0099FF)
                        .setTimestamp()
                        .addFields({ name: '📝 Status', value: 'Successfully updated!' });

                    const editRow = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`task_done_${task.id}`)
                                .setLabel('Mark as Done')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('✅'),
                            new ButtonBuilder()
                                .setCustomId(`task_delete_${task.id}`)
                                .setLabel('Delete Task')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🗑️'),
                            new ButtonBuilder()
                                .setCustomId('task_list_all')
                                .setLabel('View All Tasks')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('📋')
                        );

                    await interaction.editReply({ embeds: [embed], components: [editRow] });
                    break;
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;

            logger.error('Error in task command', {
                command: interaction.commandName,
                subcommand,
                error: errorMessage,
                stack: errorStack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });

            const replyMessage = {
                content: '❌ An error occurred while processing your request.',

            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyMessage);
            } else {
                await interaction.reply(replyMessage);
            }
        }
    },

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focused = interaction.options.getFocused(true);

        if (focused.name === 'task_id') {
            const userId = interaction.user.id;
            const guildId = interaction.guild?.id;
            const subcommand = interaction.options.getSubcommand();

            if (!guildId) {
                await interaction.respond([]);
                return;
            }

            try {
                // Get appropriate tasks based on subcommand
                let filter: TaskFilter = 'all';
                if (subcommand === 'done') {
                    filter = 'pending';
                }

                const tasks= await Task.getUserTasks(userId, guildId, filter);

                const choices = tasks.slice(0, 25).map(task => {
                    const description = task.description.length > 50
                        ? task.description.substring(0, 47) + '...'
                        : task.description;
                    const status = task.completed ? '✅' : '⏳';
                    const dueInfo = task.due_date ? ` (Due: ${new Date(task.due_date).toLocaleDateString()})` : '';

                    return {
                        name: `#${task.id} ${status} ${description}${dueInfo}`,
                        value: task.id
                    };
                });

                // Filter based on what user typed
                const filtered = choices.filter(choice =>
                    choice.name.toLowerCase().includes(focused.value.toLowerCase()) ||
                    choice.value.toString().includes(focused.value)
                );

                await interaction.respond(filtered);
            } catch (error) {
                logger.error('Error in task autocomplete', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    userId,
                    guildId
                });
                await interaction.respond([]);
            }
        }
    }
};
