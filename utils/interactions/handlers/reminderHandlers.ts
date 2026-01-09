import {
  ButtonInteraction,
  CacheType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getModels } from '../helpers/databaseHelper';
import { handleInteractionError } from '../responses/errorResponses';

export async function handleReminderButton(
  interaction: ButtonInteraction<CacheType>
): Promise<void> {
  const customId = interaction.customId;
  const guildId = interaction.guild?.id;

  if (!guildId) {
    // Check if already acknowledged before responding
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
    } else {
      await interaction.followUp({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
    }
    return;
  }

  const { Reminder } = await getModels();

  try {
    // Delete reminder
    if (customId.startsWith('reminder_delete_')) {
      const reminderId = parseInt(customId.split('_')[2]);
      const deleted = await Reminder.deleteReminder(reminderId, guildId);
      // Check if already acknowledged before responding
      if (!interaction.deferred && !interaction.replied) {
        if (deleted) {
          await interaction.reply({
            content: `🗑️ Reminder #${reminderId} has been cancelled.`,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: `❌ Reminder #${reminderId} not found.`,
            ephemeral: true,
          });
        }
      } else {
        if (deleted) {
          await interaction.followUp({
            content: `🗑️ Reminder #${reminderId} has been cancelled.`,
            ephemeral: true,
          });
        } else {
          await interaction.followUp({
            content: `❌ Reminder #${reminderId} not found.`,
            ephemeral: true,
          });
        }
      }
      return;
    }

    // Add new reminder - show selection menu
    if (customId === 'reminder_add_new' || customId === 'reminder_add_another') {
      const embed = new EmbedBuilder()
        .setTitle('⏰ Create New Reminder')
        .setDescription('Choose the type of reminder you want to create:')
        .setColor(0x9932cc);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('reminder_create_daily')
          .setLabel('Daily Reminder')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📅'),
        new ButtonBuilder()
          .setCustomId('reminder_create_weekly')
          .setLabel('Weekly Reminder')
          .setStyle(ButtonStyle.Success)
          .setEmoji('📆'),
        new ButtonBuilder()
          .setCustomId('reminder_create_once')
          .setLabel('One-Time Reminder')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⏰')
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }

    // List reminders
    if (customId === 'reminder_list' || customId === 'reminder_refresh') {
      const { Reminder } = await getModels();
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

      // Helper function to format time
      const formatTimeTo12Hour = (time24: string): string => {
        const [hoursStr, minutes] = time24.split(':');
        let hours = parseInt(hoursStr);
        const period = hours >= 12 ? 'PM' : 'AM';

        if (hours === 0) {
          hours = 12;
        } else if (hours > 12) {
          hours -= 12;
        }

        return `${hours}:${minutes} ${period}`;
      };

      const embed = new EmbedBuilder()
        .setTitle('📋 Your Reminders')
        .setColor(0x0099ff)
        .setTimestamp()
        .setFooter({ text: `Total: ${reminders.length} reminders` });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const reminderList = reminders
        .slice(0, 25)
        .map((reminder) => {
          let emoji = '⏰';
          let displayFrequency: string;

          if (reminder.frequency === 'daily') {
            emoji = '📅';
            displayFrequency = 'Daily';
          } else if (
            reminder.frequency === 'weekly' &&
            reminder.day_of_week !== null &&
            reminder.day_of_week !== undefined
          ) {
            emoji = '📆';
            displayFrequency = `Weekly (${dayNames[reminder.day_of_week]})`;
          } else if (reminder.frequency === 'once') {
            emoji = '⏰';
            displayFrequency = 'One-time';
          } else {
            displayFrequency = reminder.frequency;
          }

          return `${emoji} **#${reminder.id}** - "${reminder.message}"\n🕐 ${formatTimeTo12Hour(reminder.time)} | ${displayFrequency}\n⏱️ Next: ${reminder.next_trigger?.toLocaleString() || 'N/A'}`;
        })
        .join('\n\n');

      embed.setDescription(reminderList);

      if (reminders.length > 25) {
        embed.addFields({ name: '📌 Note', value: `Showing 25 of ${reminders.length} reminders` });
      }

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

      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }

    // Create reminder of specific type
    if (customId.startsWith('reminder_create_')) {
      const type = customId.split('_')[2]; // daily, weekly, or once

      if (type === 'daily') {
        const modal = new ModalBuilder()
          .setCustomId('modal_reminder_daily')
          .setTitle('Create Daily Reminder');

        const messageInput = new TextInputBuilder()
          .setCustomId('reminder_message')
          .setLabel('Reminder Message')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('What should I remind you about?');

        const timeInput = new TextInputBuilder()
          .setCustomId('reminder_time')
          .setLabel('Time (12-hour format)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('2:30 PM');

        const messageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
        const timeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);

        modal.addComponents(messageRow, timeRow);
        await interaction.showModal(modal);
        return;
      }

      if (type === 'weekly') {
        const modal = new ModalBuilder()
          .setCustomId('modal_reminder_weekly')
          .setTitle('Create Weekly Reminder');

        const messageInput = new TextInputBuilder()
          .setCustomId('reminder_message')
          .setLabel('Reminder Message')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('What should I remind you about?');

        const dayInput = new TextInputBuilder()
          .setCustomId('reminder_day')
          .setLabel('Day of Week (0=Sun, 1=Mon, ... 6=Sat)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('0-6');

        const timeInput = new TextInputBuilder()
          .setCustomId('reminder_time')
          .setLabel('Time (12-hour format)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('2:30 PM');

        const messageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
        const dayRow = new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput);
        const timeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);

        modal.addComponents(messageRow, dayRow, timeRow);
        await interaction.showModal(modal);
        return;
      }

      if (type === 'once') {
        const modal = new ModalBuilder()
          .setCustomId('modal_reminder_once')
          .setTitle('Create One-Time Reminder');

        const messageInput = new TextInputBuilder()
          .setCustomId('reminder_message')
          .setLabel('Reminder Message')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('What should I remind you about?');

        const timeInput = new TextInputBuilder()
          .setCustomId('reminder_time')
          .setLabel('Time (12-hour format)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('2:30 PM');

        const messageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
        const timeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);

        modal.addComponents(messageRow, timeRow);
        await interaction.showModal(modal);
        return;
      }
    }
  } catch (error) {
    await handleInteractionError(interaction, error, 'reminder button handler');
  }
}
