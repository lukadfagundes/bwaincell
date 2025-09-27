import {
    ButtonInteraction,
    CacheType,
    ChatInputCommandInteraction
} from 'discord.js';
import { getModels } from '../helpers/databaseHelper';
import { handleInteractionError } from '../responses/errorResponses';

export async function handleReminderButton(interaction: ButtonInteraction<CacheType>): Promise<void> {
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

    const { Reminder } = await getModels();

    try {
        // Delete reminder
        if (customId.startsWith('reminder_delete_')) {
            const reminderId = parseInt(customId.split('_')[2]);
            const deleted = await Reminder.deleteReminder(reminderId, userId, guildId);
            // Check if already acknowledged before responding
            if (!interaction.deferred && !interaction.replied) {
                if (deleted) {
                    await interaction.reply({
                        content: `🗑️ Reminder #${reminderId} has been cancelled.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `❌ Reminder #${reminderId} not found.`,
                        ephemeral: true
                    });
                }
            } else {
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
            }
            return;
        }

        // Add new reminder
        if (customId === 'reminder_add_new' || customId === 'reminder_add_another') {
            // Check if already acknowledged before responding
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({
                    content: '⏰ Use `/remind me`, `/remind daily`, or `/remind weekly` to create a new reminder!',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: '⏰ Use `/remind me`, `/remind daily`, or `/remind weekly` to create a new reminder!',
                    ephemeral: true
                });
            }
            return;
        }

        // List reminders
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

        // Create reminder of specific type
        if (customId.startsWith('reminder_create_')) {
            const type = customId.split('_')[2];
            // Check if already acknowledged before responding
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({
                    content: `⏰ Use \`/remind ${type === 'once' ? 'me' : type}\` to create a ${type} reminder!`,
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: `⏰ Use \`/remind ${type === 'once' ? 'me' : type}\` to create a ${type} reminder!`,
                    ephemeral: true
                });
            }
            return;
        }
    } catch (error) {
        await handleInteractionError(interaction, error, 'reminder button handler');
    }
}
