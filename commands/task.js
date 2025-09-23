const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const Task = require('../database/models/Task');

module.exports = {
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
                    option.setName('due_date')
                        .setDescription('Due date (YYYY-MM-DD HH:MM)')
                        .setRequired(false)))
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

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'add': {
                    const description = interaction.options.getString('description');
                    const dueDateStr = interaction.options.getString('due_date');
                    let dueDate = null;

                    if (dueDateStr) {
                        dueDate = new Date(dueDateStr);
                        if (isNaN(dueDate)) {
                            return await interaction.reply({
                                content: 'Invalid date format. Use YYYY-MM-DD HH:MM',
                                ephemeral: true
                            });
                        }
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

                    const row = new ActionRowBuilder()
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

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'list': {
                    const filter = interaction.options.getString('filter') || 'all';
                    const tasks = await Task.getUserTasks(userId, guildId, filter);

                    if (tasks.length === 0) {
                        const emptyEmbed = new EmbedBuilder()
                            .setTitle('📋 No Tasks Found')
                            .setDescription(`You don't have any ${filter === 'all' ? '' : filter} tasks.`)
                            .setColor(0xFFFF00)
                            .setTimestamp();

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('task_add_new')
                                    .setLabel('Create Your First Task')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('➕')
                            );

                        await interaction.reply({ embeds: [emptyEmbed], components: [row] });
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
                    const components = [];
                    const row = new ActionRowBuilder();

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
                        const selectRow = new ActionRowBuilder()
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

                    await interaction.reply({ embeds: [embed], components });
                    break;
                }

                case 'done': {
                    const taskId = interaction.options.getInteger('task_id');
                    const task = await Task.completeTask(taskId, userId, guildId);

                    if (!task) {
                        await interaction.reply({
                            content: `❌ Task #${taskId} not found or doesn't belong to you.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🎉 Task Completed!')
                        .setDescription(`✅ Task #${task.id}: ${task.description}`)
                        .setColor(0x00FF00)
                        .setTimestamp()
                        .addFields({ name: '🏆 Status', value: 'Marked as complete!' });

                    const row = new ActionRowBuilder()
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

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'delete': {
                    const taskId = interaction.options.getInteger('task_id');
                    const deleted = await Task.deleteTask(taskId, userId, guildId);

                    if (!deleted) {
                        await interaction.reply({
                            content: `❌ Task #${taskId} not found or doesn't belong to you.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🗑️ Task Deleted')
                        .setDescription(`Task #${taskId} has been removed from your list.`)
                        .setColor(0xFF0000)
                        .setTimestamp();

                    const row = new ActionRowBuilder()
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

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'edit': {
                    const taskId = interaction.options.getInteger('task_id');
                    const newText = interaction.options.getString('new_text');
                    const task = await Task.editTask(taskId, userId, guildId, newText);

                    if (!task) {
                        await interaction.reply({
                            content: `❌ Task #${taskId} not found or doesn't belong to you.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('✏️ Task Updated')
                        .setDescription(`Task #${task.id}: ${task.description}`)
                        .setColor(0x0099FF)
                        .setTimestamp()
                        .addFields({ name: '📝 Status', value: 'Successfully updated!' });

                    const editRow = new ActionRowBuilder()
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

                    await interaction.reply({ embeds: [embed], components: [editRow] });
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in task ${subcommand}:`, error);
            const errorMessage = {
                content: '❌ An error occurred while processing your request.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);

        if (focused.name === 'task_id') {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
            const subcommand = interaction.options.getSubcommand();

            // Get appropriate tasks based on subcommand
            let filter = 'all';
            if (subcommand === 'done') {
                filter = 'pending';
            }

            const tasks = await Task.getUserTasks(userId, guildId, filter);

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
        }
    }
};