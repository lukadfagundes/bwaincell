import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from 'discord.js';
import { DateTime } from 'luxon';
import { logger } from '../shared/utils/logger';
import Reminder from '../database/models/Reminder';
import { getScheduler } from '../utils/scheduler';
import config from '../config/config';

// Convert 12-hour time format to 24-hour format
function parseTimeToMilitaryFormat(timeStr: string): string | null {
  const time = timeStr.trim();

  // Check for 12-hour format (e.g., "2:30 PM", "2:30PM", "2:30 pm")
  const twelveHourMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (twelveHourMatch) {
    let hours = parseInt(twelveHourMatch[1]);
    const minutes = twelveHourMatch[2];
    const period = twelveHourMatch[3].toUpperCase();

    if (hours < 1 || hours > 12) return null;
    if (parseInt(minutes) < 0 || parseInt(minutes) > 59) return null;

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  return null;
}

// Convert 24-hour time format to 12-hour format for display
function formatTimeTo12Hour(time24: string): string {
  const [hoursStr, minutes] = time24.split(':');
  let hours = parseInt(hoursStr);
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  return `${hours}:${minutes} ${period}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Manage reminders')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('me')
        .setDescription('Set a one-time reminder')
        .addStringOption((option) =>
          option.setName('message').setDescription('Reminder message').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('time')
            .setDescription('Time (12-hour format, e.g., 2:30 PM)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('date')
            .setDescription('Date (MM-DD-YYYY, or "tomorrow"). Defaults to today/tomorrow.')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('daily')
        .setDescription('Set a daily recurring reminder')
        .addStringOption((option) =>
          option.setName('message').setDescription('Reminder message').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('time')
            .setDescription('Time (12-hour format, e.g., 2:30 PM)')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('weekly')
        .setDescription('Set a weekly recurring reminder')
        .addStringOption((option) =>
          option.setName('message').setDescription('Reminder message').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('day')
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
            )
        )
        .addStringOption((option) =>
          option
            .setName('time')
            .setDescription('Time (12-hour format, e.g., 2:30 PM)')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('Show all your reminders')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Remove a reminder')
        .addIntegerOption((option) =>
          option
            .setName('reminder_id')
            .setDescription('Reminder ID to delete')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Note: Interaction is already deferred by bot.js for immediate acknowledgment

    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;
    // Use configured announcement channel, fall back to command channel if not set
    const channelId = config.settings.defaultReminderChannel || interaction.channel?.id;

    if (!guildId) {
      await interaction.editReply({
        content: 'This command can only be used in a server.',
      });
      return;
    }

    if (!channelId) {
      await interaction.editReply({
        content: 'Unable to determine channel ID.',
      });
      return;
    }

    try {
      switch (subcommand) {
        case 'me': {
          const message = interaction.options.getString('message', true);
          const timeInput = interaction.options.getString('time', true);
          const dateInput = interaction.options.getString('date', false);

          const time = parseTimeToMilitaryFormat(timeInput);
          if (!time) {
            await interaction.editReply({
              content: '❌ Invalid time format. Use 12-hour format (e.g., 2:30 PM).',
            });
            return;
          }

          // Parse date if provided
          let targetDate: Date | null = null;
          if (dateInput) {
            if (dateInput.toLowerCase() === 'tomorrow') {
              targetDate = DateTime.now()
                .setZone(config.settings.timezone)
                .plus({ days: 1 })
                .toJSDate();
            } else {
              // Try parsing MM-DD-YYYY format
              const dateMatch = dateInput.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
              if (dateMatch) {
                const [, month, day, year] = dateMatch;
                targetDate = DateTime.fromObject(
                  { year: parseInt(year), month: parseInt(month), day: parseInt(day) },
                  { zone: config.settings.timezone }
                ).toJSDate();
              } else {
                await interaction.editReply({
                  content: '❌ Invalid date format. Use MM-DD-YYYY or "tomorrow".',
                });
                return;
              }
            }
          }

          const reminder = await Reminder.createReminder(
            guildId,
            channelId,
            message,
            time,
            'once',
            null,
            userId,
            targetDate
          );

          // Add reminder to scheduler
          const scheduler = getScheduler();
          if (scheduler) {
            await scheduler.addReminder(reminder.id);
          }

          const embed = new EmbedBuilder()
            .setTitle('⏰ Reminder Set')
            .setDescription(`I'll remind you: **"${message}"**`)
            .addFields(
              { name: '🕐 Time', value: formatTimeTo12Hour(time), inline: true },
              { name: '📅 Frequency', value: 'One-time', inline: true },
              {
                name: '⏱️ Next Trigger',
                value: reminder.next_trigger
                  ? DateTime.fromJSDate(reminder.next_trigger)
                      .setZone(config.settings.timezone)
                      .toLocaleString(DateTime.DATETIME_FULL)
                  : 'N/A',
              }
            )
            .setColor(0x00ff00)
            .setTimestamp();

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

          await interaction.editReply({ embeds: [embed], components: [row] });
          break;
        }

        case 'daily': {
          const message = interaction.options.getString('message', true);
          const timeInput = interaction.options.getString('time', true);

          const time = parseTimeToMilitaryFormat(timeInput);
          if (!time) {
            await interaction.editReply({
              content: '❌ Invalid time format. Use 12-hour format (e.g., 2:30 PM).',
            });
            return;
          }

          const reminder = await Reminder.createReminder(
            guildId,
            channelId,
            message,
            time,
            'daily',
            null,
            userId
          );

          // Add reminder to scheduler
          const scheduler = getScheduler();
          if (scheduler) {
            await scheduler.addReminder(reminder.id);
          }

          const embed = new EmbedBuilder()
            .setTitle('⏰ Daily Reminder Set')
            .setDescription(`I'll remind you daily: **"${message}"**`)
            .addFields(
              { name: '🕐 Time', value: `Every day at ${formatTimeTo12Hour(time)}`, inline: true },
              { name: '📅 Frequency', value: 'Daily', inline: true },
              {
                name: '⏱️ Next Trigger',
                value: reminder.next_trigger
                  ? DateTime.fromJSDate(reminder.next_trigger)
                      .setZone(config.settings.timezone)
                      .toLocaleString(DateTime.DATETIME_FULL)
                  : 'N/A',
              }
            )
            .setColor(0x00ff00)
            .setTimestamp();

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

          await interaction.editReply({ embeds: [embed], components: [row] });
          break;
        }

        case 'weekly': {
          const message = interaction.options.getString('message', true);
          const dayOfWeek = parseInt(interaction.options.getString('day', true));
          const timeInput = interaction.options.getString('time', true);

          const time = parseTimeToMilitaryFormat(timeInput);
          if (!time) {
            await interaction.editReply({
              content: '❌ Invalid time format. Use 12-hour format (e.g., 2:30 PM).',
            });
            return;
          }

          const reminder = await Reminder.createReminder(
            guildId,
            channelId,
            message,
            time,
            'weekly',
            dayOfWeek,
            userId
          );

          // Add reminder to scheduler
          const scheduler = getScheduler();
          if (scheduler) {
            await scheduler.addReminder(reminder.id);
          }

          const dayNames = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ];

          const embed = new EmbedBuilder()
            .setTitle('⏰ Weekly Reminder Set')
            .setDescription(`I'll remind you weekly: **"${message}"**`)
            .addFields(
              { name: '📅 Day', value: dayNames[dayOfWeek], inline: true },
              { name: '🕐 Time', value: formatTimeTo12Hour(time), inline: true },
              { name: '🔄 Frequency', value: 'Weekly', inline: true },
              {
                name: '⏱️ Next Trigger',
                value: reminder.next_trigger
                  ? DateTime.fromJSDate(reminder.next_trigger)
                      .setZone(config.settings.timezone)
                      .toLocaleString(DateTime.DATETIME_FULL)
                  : 'N/A',
              }
            )
            .setColor(0x00ff00)
            .setTimestamp();

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

          await interaction.editReply({ embeds: [embed], components: [row] });
          break;
        }

        case 'list': {
          const reminders = await Reminder.getUserReminders(guildId);

          if (reminders.length === 0) {
            const emptyEmbed = new EmbedBuilder()
              .setTitle('📋 No Reminders')
              .setDescription("You don't have any active reminders.")
              .setColor(0xffff00)
              .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

            await interaction.editReply({ embeds: [emptyEmbed], components: [row] });
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle('📋 Your Reminders')
            .setColor(0x0099ff)
            .setTimestamp()
            .setFooter({ text: `Total: ${reminders.length} reminders` });

          const reminderList = reminders
            .slice(0, 25)
            .map((reminder) => {
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              let frequency = reminder.frequency;
              let emoji = '⏰';

              let displayFrequency: string;
              if (frequency === 'daily') {
                emoji = '📅';
                displayFrequency = 'Daily';
              } else if (
                frequency === 'weekly' &&
                reminder.day_of_week !== null &&
                reminder.day_of_week !== undefined
              ) {
                emoji = '📆';
                displayFrequency = `Weekly (${dayNames[reminder.day_of_week]})`;
              } else if (frequency === 'once') {
                emoji = '⏰';
                displayFrequency = 'One-time';
              } else {
                displayFrequency = frequency;
              }

              const nextTriggerDisplay = reminder.next_trigger
                ? DateTime.fromJSDate(reminder.next_trigger)
                    .setZone(config.settings.timezone)
                    .toLocaleString(DateTime.DATETIME_FULL)
                : 'N/A';

              return `${emoji} **#${reminder.id}** - "${reminder.message}"\n🕐 ${formatTimeTo12Hour(reminder.time)} | ${displayFrequency}\n⏱️ Next: ${nextTriggerDisplay}`;
            })
            .join('\n\n');

          embed.setDescription(reminderList);

          if (reminders.length > 25) {
            embed.addFields({
              name: '📌 Note',
              value: `Showing 25 of ${reminders.length} reminders`,
            });
          }

          const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
            const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('reminder_quick_delete')
                .setPlaceholder('Select a reminder to manage')
                .addOptions(
                  reminders.map((reminder) => {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    let freq =
                      reminder.frequency === 'weekly' &&
                      reminder.day_of_week !== null &&
                      reminder.day_of_week !== undefined
                        ? `Weekly (${dayNames[reminder.day_of_week]})`
                        : reminder.frequency;

                    return {
                      label: `#${reminder.id} - ${reminder.message.substring(0, 40)}`,
                      description: `${freq} at ${reminder.time}`,
                      value: `${reminder.id}`,
                      emoji:
                        reminder.frequency === 'daily'
                          ? '📅'
                          : reminder.frequency === 'weekly'
                            ? '📆'
                            : '⏰',
                    };
                  })
                )
            );
            components.push(selectRow);
          }

          await interaction.editReply({ embeds: [embed], components });
          break;
        }

        case 'delete': {
          const reminderId = interaction.options.getInteger('reminder_id', true);
          const deleted: boolean = await Reminder.deleteReminder(reminderId, guildId);

          if (!deleted) {
            await interaction.editReply({
              content: `❌ Reminder #${reminderId} not found or doesn't belong to you.`,
            });
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle('🗑️ Reminder Deleted')
            .setDescription(`Reminder #${reminderId} has been cancelled.`)
            .setColor(0xff0000)
            .setTimestamp();

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

          await interaction.editReply({ embeds: [embed], components: [row] });
          break;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('Error in remind command', {
        command: interaction.commandName,
        subcommand,
        error: errorMessage,
        stack: errorStack,
        fullError: error, // Log the full error object for Sequelize details
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
      });

      const replyMessage = {
        content: '❌ An error occurred while processing your request.',
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyMessage);
      } else {
        await interaction.editReply(replyMessage);
      }
    }
  },

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focused = interaction.options.getFocused(true);

    if (focused.name === 'reminder_id') {
      const userId = interaction.user.id;
      const guildId = interaction.guild?.id;

      if (!guildId) {
        await interaction.respond([]);
        return;
      }

      try {
        const reminders = await Reminder.getUserReminders(guildId);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const choices = reminders.slice(0, 25).map((reminder) => {
          const message =
            reminder.message.length > 30
              ? reminder.message.substring(0, 27) + '...'
              : reminder.message;

          let displayFrequency: string = reminder.frequency;
          if (
            reminder.frequency === 'weekly' &&
            reminder.day_of_week !== null &&
            reminder.day_of_week !== undefined
          ) {
            displayFrequency = `Weekly (${dayNames[reminder.day_of_week]})`;
          }

          return {
            name: `#${reminder.id} - ${message} (${displayFrequency} at ${reminder.time})`,
            value: reminder.id,
          };
        });

        // Filter based on what user typed
        const filtered = choices.filter(
          (choice) =>
            choice.name.toLowerCase().includes(focused.value.toLowerCase()) ||
            choice.value.toString().includes(focused.value)
        );

        await interaction.respond(filtered);
      } catch (error) {
        logger.error('Error in remind autocomplete', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId,
          guildId,
        });
        await interaction.respond([]);
      }
    }
  },
};
