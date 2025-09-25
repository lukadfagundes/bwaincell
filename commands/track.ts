import {
    SlashCommandBuilder,
    EmbedBuilder,
    ChatInputCommandInteraction
} from 'discord.js';
import { logger } from '../shared/utils/logger';
import Tracker from '../database/models/Tracker';

interface TrackerStats {
    count: number;
    average: string;
    latest: string;
    min: string;
    max: string;
    sum: string;
    data?: Array<{
        timestamp: Date;
        value: number;
    }>;
}

export default {
    data: new SlashCommandBuilder()
        .setName('track')
        .setDescription('Track metrics and data points')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Log a data point')
                .addStringOption(option =>
                    option.setName('metric')
                        .setDescription('Metric name (e.g., weight, mood, hours_slept)')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('value')
                        .setDescription('Value to track')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Show statistics for a metric')
                .addStringOption(option =>
                    option.setName('metric')
                        .setDescription('Metric name')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('period')
                        .setDescription('Time period')
                        .setRequired(false)
                        .addChoices(
                            { name: 'All Time', value: 'all' },
                            { name: 'Today', value: 'day' },
                            { name: 'This Week', value: 'week' },
                            { name: 'This Month', value: 'month' },
                            { name: 'This Year', value: 'year' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show all tracked metrics'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Remove metric data')
                .addStringOption(option =>
                    option.setName('metric')
                        .setDescription('Metric to delete')
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
                    const metric = interaction.options.getString('metric', true);
                    const value = interaction.options.getNumber('value', true);

                    await Tracker.addDataPoint(userId, guildId, metric, value);

                    const embed = new EmbedBuilder()
                        .setTitle('Data Point Logged')
                        .setDescription(`Tracked ${metric}: ${value}`)
                        .setColor(0x00FF00)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'stats': {
                    const metric = interaction.options.getString('metric', true);
                    const periodInput = interaction.options.getString('period') || 'all';
                    const period = periodInput as 'all' | 'day' | 'week' | 'month' | 'year';

                    const stats: TrackerStats | null = await Tracker.getStats(userId, guildId, metric, period);

                    if (!stats) {
                        await interaction.editReply({
                            content: `No data found for metric "${metric}".`,
                            
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`Statistics: ${metric}`)
                        .setDescription(`Period: ${period === 'all' ? 'All Time' : period}`)
                        .addFields(
                            { name: 'Data Points', value: stats.count.toString(), inline: true },
                            { name: 'Average', value: stats.average, inline: true },
                            { name: 'Latest', value: stats.latest, inline: true },
                            { name: 'Minimum', value: stats.min, inline: true },
                            { name: 'Maximum', value: stats.max, inline: true },
                            { name: 'Total', value: stats.sum, inline: true }
                        )
                        .setColor(0x0099FF)
                        .setTimestamp();

                    if (stats.data && stats.data.length > 0) {
                        const recentData = stats.data.slice(-5).map(d =>
                            `${new Date(d.timestamp).toLocaleDateString()}: ${d.value}`
                        ).join('\n');
                        embed.addFields({ name: 'Recent Values', value: recentData });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'list': {
                    const metrics: string[] = await Tracker.getMetrics(userId, guildId);

                    if (metrics.length === 0) {
                        await interaction.editReply({
                            content: 'You are not tracking any metrics.',
                            
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Your Tracked Metrics')
                        .setDescription(metrics.map(m => `📊 ${m}`).join('\n'))
                        .setFooter({ text: `Total metrics: ${metrics.length}` })
                        .setColor(0x0099FF)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case 'delete': {
                    const metric = interaction.options.getString('metric', true);
                    const deleted: boolean = await Tracker.deleteMetric(userId, guildId, metric);

                    if (!deleted) {
                        await interaction.editReply({
                            content: `Metric "${metric}" not found.`,
                            
                        });
                        return;
                    }

                    await interaction.editReply({
                        content: `All data for metric "${metric}" has been deleted.`,
                        
                    });
                    break;
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;

            logger.error('Error in track command', {
                subcommand,
                error: errorMessage,
                stack: errorStack
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