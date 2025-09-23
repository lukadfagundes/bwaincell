const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const Reminder = require('../database/models/Reminder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Manage reminders')
        .addSubcommand(subcommand =>
            subcommand
                .setName('me')
                .setDescription('Set a one-time reminder')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Reminder message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Time (HH:MM in 24-hour format)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('Set a daily recurring reminder')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Reminder message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Time (HH:MM in 24-hour format)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('weekly')
                .setDescription('Set a weekly recurring reminder')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Reminder message')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('day')
                        .setDescription('Day of week')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Sunday', value: '0' },
                            { name: 'Monday', value: '1' },
                            { name: 'Tuesday', value: '2' },
                            { name: 'Wednesday', value: '3' },
                            { name: 'Thursday', value: '4' },
                            { name: 'Friday', value: '5' },
                            { name: 'Saturday', value: '6' }
                        ))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Time (HH:MM in 24-hour format)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show all your reminders'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Remove a reminder')
                .addIntegerOption(option =>
                    option.setName('reminder_id')
                        .setDescription('Reminder ID to delete')
                        .setRequired(true)
                        .setAutocomplete(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const channelId = interaction.channel.id;

        try {
            switch (subcommand) {
                case 'me': {
                    const message = interaction.options.getString('message');
                    const time = interaction.options.getString('time');

                    if (!time.match(/^\d{1,2}:\d{2}$/)) {
                        await interaction.reply({
                            content: '❌ Invalid time format. Use HH:MM (24-hour format).',
                            ephemeral: true
                        });
                        return;
                    }

                    const reminder = await Reminder.createReminder(
                        userId, guildId, channelId, message, time, 'once'
                    );

                    const embed = new EmbedBuilder()
                        .setTitle('⏰ Reminder Set')
                        .setDescription(`I'll remind you: **"${message}"**`)
                        .addFields(
                            { name: '🕐 Time', value: time, inline: true },
                            { name: '📅 Frequency', value: 'One-time', inline: true },
                            { name: '⏱️ Next Trigger', value: reminder.next_trigger.toLocaleString() }
                        )
                        .setColor(0x00FF00)
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`reminder_delete_${reminder.id}`)
                                .setLabel('Cancel Reminder')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🗑️'),
                            new ButtonBuilder()
                                .setCustomId('reminder_list')
                                .setLabel('View All Reminders')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('📋'),
                            new ButtonBuilder()
                                .setCustomId('reminder_add_another')
                                .setLabel('Add Another')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('➕')
                        );

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'daily': {
                    const message = interaction.options.getString('message');
                    const time = interaction.options.getString('time');

                    if (!time.match(/^\d{1,2}:\d{2}$/)) {
                        await interaction.reply({
                            content: '❌ Invalid time format. Use HH:MM (24-hour format).',
                            ephemeral: true
                        });
                        return;
                    }

                    const reminder = await Reminder.createReminder(
                        userId, guildId, channelId, message, time, 'daily'
                    );

                    const embed = new EmbedBuilder()
                        .setTitle('⏰ Daily Reminder Set')
                        .setDescription(`I'll remind you daily: **"${message}"**`)
                        .addFields(
                            { name: '🕐 Time', value: `Every day at ${time}`, inline: true },
                            { name: '📅 Frequency', value: 'Daily', inline: true },
                            { name: '⏱️ Next Trigger', value: reminder.next_trigger.toLocaleString() }
                        )
                        .setColor(0x00FF00)
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`reminder_delete_${reminder.id}`)
                                .setLabel('Cancel Reminder')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🗑️'),
                            new ButtonBuilder()
                                .setCustomId('reminder_list')
                                .setLabel('View All Reminders')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('📋'),
                            new ButtonBuilder()
                                .setCustomId('reminder_add_another')
                                .setLabel('Add Another')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('➕')
                        );

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'weekly': {
                    const message = interaction.options.getString('message');
                    const dayOfWeek = parseInt(interaction.options.getString('day'));
                    const time = interaction.options.getString('time');

                    if (!time.match(/^\d{1,2}:\d{2}$/)) {
                        await interaction.reply({
                            content: '❌ Invalid time format. Use HH:MM (24-hour format).',
                            ephemeral: true
                        });
                        return;
                    }

                    const reminder = await Reminder.createReminder(
                        userId, guildId, channelId, message, time, 'weekly', dayOfWeek
                    );

                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                    const embed = new EmbedBuilder()
                        .setTitle('⏰ Weekly Reminder Set')
                        .setDescription(`I'll remind you weekly: **"${message}"**`)
                        .addFields(
                            { name: '📅 Day', value: dayNames[dayOfWeek], inline: true },
                            { name: '🕐 Time', value: time, inline: true },
                            { name: '🔄 Frequency', value: 'Weekly', inline: true },
                            { name: '⏱️ Next Trigger', value: reminder.next_trigger.toLocaleString() }
                        )
                        .setColor(0x00FF00)
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`reminder_delete_${reminder.id}`)
                                .setLabel('Cancel Reminder')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🗑️'),
                            new ButtonBuilder()
                                .setCustomId('reminder_list')
                                .setLabel('View All Reminders')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('📋'),
                            new ButtonBuilder()
                                .setCustomId('reminder_add_another')
                                .setLabel('Add Another')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('➕')
                        );

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'list': {
                    const reminders = await Reminder.getUserReminders(userId, guildId);

                    if (reminders.length === 0) {
                        const emptyEmbed = new EmbedBuilder()
                            .setTitle('📋 No Reminders')
                            .setDescription("You don't have any active reminders.")
                            .setColor(0xFFFF00)
                            .setTimestamp();

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('reminder_create_daily')
                                    .setLabel('Create Daily Reminder')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('📅'),
                                new ButtonBuilder()
                                    .setCustomId('reminder_create_weekly')
                                    .setLabel('Create Weekly Reminder')
                                    .setStyle(ButtonStyle.Success)
                                    .setEmoji('📆'),
                                new ButtonBuilder()
                                    .setCustomId('reminder_create_once')
                                    .setLabel('One-Time Reminder')
                                    .setStyle(ButtonStyle.Secondary)
                                    .setEmoji('⏰')
                            );

                        await interaction.reply({ embeds: [emptyEmbed], components: [row] });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('📋 Your Reminders')
                        .setColor(0x0099FF)
                        .setTimestamp()
                        .setFooter({ text: `Total: ${reminders.length} reminders` });

                    const reminderList = reminders.slice(0, 25).map(reminder => {
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        let frequency = reminder.frequency;
                        let emoji = '⏰';

                        if (frequency === 'daily') {
                            emoji = '📅';
                            frequency = 'Daily';
                        } else if (frequency === 'weekly' && reminder.day_of_week !== null) {
                            emoji = '📆';
                            frequency = `Weekly (${dayNames[reminder.day_of_week]})`;
                        } else if (frequency === 'once') {
                            emoji = '⏰';
                            frequency = 'One-time';
                        }

                        return `${emoji} **#${reminder.id}** - "${reminder.message}"\n🕐 ${reminder.time} | ${frequency}\n⏱️ Next: ${reminder.next_trigger.toLocaleString()}`;
                    }).join('\n\n');

                    embed.setDescription(reminderList);

                    if (reminders.length > 25) {
                        embed.addFields({ name: '📌 Note', value: `Showing 25 of ${reminders.length} reminders` });
                    }

                    const components = [];
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('reminder_add_new')
                                .setLabel('Add New Reminder')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('➕'),
                            new ButtonBuilder()
                                .setCustomId('reminder_refresh')
                                .setLabel('Refresh')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🔄')
                        );

                    components.push(row);

                    // Add select menu for quick deletion if not too many reminders
                    if (reminders.length <= 25 && reminders.length > 0) {
                        const selectRow = new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('reminder_quick_delete')
                                    .setPlaceholder('Select a reminder to manage')
                                    .addOptions(reminders.map(reminder => {
                                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                        let freq = reminder.frequency === 'weekly' && reminder.day_of_week !== null
                                            ? `Weekly (${dayNames[reminder.day_of_week]})`
                                            : reminder.frequency;

                                        return {
                                            label: `#${reminder.id} - ${reminder.message.substring(0, 40)}`,
                                            description: `${freq} at ${reminder.time}`,
                                            value: `${reminder.id}`,
                                            emoji: reminder.frequency === 'daily' ? '📅' : reminder.frequency === 'weekly' ? '📆' : '⏰'
                                        };
                                    }))
                            );
                        components.push(selectRow);
                    }

                    await interaction.reply({ embeds: [embed], components });
                    break;
                }

                case 'delete': {
                    const reminderId = interaction.options.getInteger('reminder_id');
                    const deleted = await Reminder.deleteReminder(reminderId, userId, guildId);

                    if (!deleted) {
                        await interaction.reply({
                            content: `❌ Reminder #${reminderId} not found or doesn't belong to you.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('🗑️ Reminder Deleted')
                        .setDescription(`Reminder #${reminderId} has been cancelled.`)
                        .setColor(0xFF0000)
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('reminder_add_new')
                                .setLabel('Add New Reminder')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('➕'),
                            new ButtonBuilder()
                                .setCustomId('reminder_list')
                                .setLabel('View Remaining')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('📋')
                        );

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in remind ${subcommand}:`, error);
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

        if (focused.name === 'reminder_id') {
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            const reminders = await Reminder.getUserReminders(userId, guildId);

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const choices = reminders.slice(0, 25).map(reminder => {
                const message = reminder.message.length > 30
                    ? reminder.message.substring(0, 27) + '...'
                    : reminder.message;

                let frequency = reminder.frequency;
                if (frequency === 'weekly' && reminder.day_of_week !== null) {
                    frequency = `Weekly (${dayNames[reminder.day_of_week]})`;
                }

                return {
                    name: `#${reminder.id} - ${message} (${frequency} at ${reminder.time})`,
                    value: reminder.id
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