import {
    SlashCommandBuilder,
    EmbedBuilder,
    ChatInputCommandInteraction
} from 'discord.js';
import { logger } from '../shared/utils/logger';
import Schedule from '../database/models/Schedule';

interface ScheduleEvent {
    id: number;
    user_id: string;
    guild_id: string;
    event: string;
    date: string; // DATEONLY format (YYYY-MM-DD)
    time: string; // HH:MM format
    description?: string | null;
    created_at: Date;
}

interface CountdownResult {
    event: Schedule;
    timeLeft: string;
}

export default {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Manage your schedule')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Schedule an event')
                .addStringOption(option =>
                    option.setName('event')
                        .setDescription('Event name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('date')
                        .setDescription('Date (YYYY-MM-DD)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Time (HH:MM in 24-hour format)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Event description')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show events')
                .addStringOption(option =>
                    option.setName('filter')
                        .setDescription('Filter events')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Upcoming', value: 'upcoming' },
                            { name: 'Past', value: 'past' },
                            { name: 'All', value: 'all' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Remove an event')
                .addIntegerOption(option =>
                    option.setName('event_id')
                        .setDescription('Event ID to delete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('countdown')
                .setDescription('Show countdown to an event')
                .addStringOption(option =>
                    option.setName('event')
                        .setDescription('Event name (partial match)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('today')
                .setDescription('Show today\'s events'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('week')
                .setDescription('Show this week\'s events')),

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
                    const event = interaction.options.getString('event', true);
                    const dateStr = interaction.options.getString('date', true);
                    const timeStr = interaction.options.getString('time', true);
                    const description = interaction.options.getString('description');

                    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        await interaction.editReply({
                            content: 'Invalid date format. Use YYYY-MM-DD.',
                            
                        });
                        return;
                    }

                    if (!timeStr.match(/^\d{1,2}:\d{2}$/)) {
                        await interaction.editReply({
                            content: 'Invalid time format. Use HH:MM (24-hour format).',
                            
                        });
                        return;
                    }

                    const eventDate = new Date(`${dateStr} ${timeStr}`);
                    if (isNaN(eventDate.getTime())) {
                        await interaction.editReply({
                            content: 'Invalid date or time.',
                            
                        });
                        return;
                    }

                    await Schedule.addEvent(userId, guildId, event, dateStr, timeStr, description);

                    const embed = new EmbedBuilder()
                        .setTitle('Event Scheduled')
                        .setDescription(`📅 **${event}**`)
                        .addFields(
                            { name: 'Date', value: dateStr, inline: true },
                            { name: 'Time', value: timeStr, inline: true }
                        )
                        .setColor(0x00FF00)
                        .setTimestamp();

                    if (description) {
                        embed.addFields({ name: 'Description', value: description });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'list': {
                    const filter = interaction.options.getString('filter') || 'upcoming';const events= await Schedule.getEvents(userId, guildId, filter as 'upcoming' | 'past' | 'all');

                    if (events.length === 0) {
                        await interaction.editReply({
                            content: `No ${filter} events found.`

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Your ${filter.charAt(0).toUpperCase() + filter.slice(1)} Events`)
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const eventList = events.slice(0, 10).map(event => {
                        const desc = event.description ? `\n   📝 ${event.description}` : '';
                        return `**#${event.id}** - ${event.event}\n   📅 ${event.date} at ${event.time}${desc}`;
                    }).join('\n\n');

                    embed.setDescription(eventList);

                    if (events.length > 10) {
                        embed.setFooter({ text: `Showing 10 of ${events.length} events` });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'delete': {
                    const eventId = interaction.options.getInteger('event_id', true);
                    const deleted: boolean = await Schedule.deleteEvent(eventId, userId, guildId);

                    if (!deleted) {
                        await interaction.editReply({
                            content: `Event #${eventId} not found or doesn't belong to you.`,
                            
                        });
                        return;
                    }

                    await interaction.editReply({
                        content: `Event #${eventId} has been deleted.`,
                        
                    });
                    break;
                }

                case 'countdown': {
                    const eventName = interaction.options.getString('event', true);
                    const result: CountdownResult | null = await Schedule.getCountdown(userId, guildId, eventName);

                    if (!result) {
                        await interaction.editReply({
                            content: `No event found matching "${eventName}".`,
                            
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('⏳ Countdown')
                        .setDescription(`**${result.event.event}**`)
                        .addFields(
                            { name: 'Date', value: result.event.date, inline: true },
                            { name: 'Time', value: result.event.time, inline: true },
                            { name: 'Time Remaining', value: result.timeLeft }
                        )
                        .setColor(0x9932CC)
                        .setTimestamp();

                    if (result.event.description) {
                        embed.addFields({ name: 'Description', value: result.event.description });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'today': {const events= await Schedule.getTodaysEvents(userId, guildId);

                    if (events.length === 0) {
                        await interaction.editReply({
                            content: 'No events scheduled for today.'

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Today\'s Events')
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const eventList = events.map(event => {
                        const desc = event.description ? `\n   📝 ${event.description}` : '';
                        return `⏰ **${event.time}** - ${event.event}${desc}`;
                    }).join('\n\n');

                    embed.setDescription(eventList);
                    embed.setFooter({ text: `${events.length} event(s) today` });

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'week': {const events= await Schedule.getUpcomingEvents(userId, guildId, 7);

                    if (events.length === 0) {
                        await interaction.editReply({
                            content: 'No events scheduled for the next 7 days.'

                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('This Week\'s Events')
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const eventsByDate: Record<string, ScheduleEvent[]> = {};
                    events.forEach(event => {
                        if (!eventsByDate[event.date]) {
                            eventsByDate[event.date] = [];
                        }
                        eventsByDate[event.date].push(event);
                    });

                    const eventList = Object.entries(eventsByDate).map(([date, dayEvents]) => {
                        const dateObj = new Date(date);
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                        const eventDetails = dayEvents.map(e => `  • ${e.time} - ${e.event}`).join('\n');
                        return `**${dayName}, ${date}**\n${eventDetails}`;
                    }).join('\n\n');

                    embed.setDescription(eventList);
                    embed.setFooter({ text: `${events.length} event(s) this week` });

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;

            logger.error('Error in schedule command', {
                command: interaction.commandName,
                subcommand,
                error: errorMessage,
                stack: errorStack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });

            const replyMessage = {
                content: 'An error occurred while processing your request.',
                
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyMessage);
            } else {
                await interaction.editReply(replyMessage);
            }
        }
    }
};