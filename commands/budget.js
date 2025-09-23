const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Budget = require('../database/models/Budget');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('budget')
        .setDescription('Track your budget and expenses')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add an expense')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Expense category')
                        .setRequired(true))
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Amount spent')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description of expense')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('income')
                .setDescription('Add income')
                .addNumberOption(option =>
                    option.setName('amount')
                        .setDescription('Income amount')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Income source/description')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('summary')
                .setDescription('Show budget summary')
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Month number (1-12)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(12)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('categories')
                .setDescription('List spending by category'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('recent')
                .setDescription('Show recent transactions')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of transactions to show')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(25)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('trend')
                .setDescription('Show monthly spending trend')
                .addIntegerOption(option =>
                    option.setName('months')
                        .setDescription('Number of months to show')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(12))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'add': {
                    const category = interaction.options.getString('category');
                    const amount = interaction.options.getNumber('amount');
                    const description = interaction.options.getString('description');

                    if (amount <= 0) {
                        await interaction.reply({
                            content: 'Amount must be greater than 0.',
                            ephemeral: true
                        });
                        return;
                    }

                    const expense = await Budget.addExpense(userId, guildId, category, amount, description);

                    const embed = new EmbedBuilder()
                        .setTitle('Expense Recorded')
                        .setDescription(`💸 -$${amount.toFixed(2)}`)
                        .addFields(
                            { name: 'Category', value: category, inline: true },
                            { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true }
                        )
                        .setColor(0xFF0000)
                        .setTimestamp();

                    if (description) {
                        embed.addFields({ name: 'Description', value: description });
                    }

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'income': {
                    const amount = interaction.options.getNumber('amount');
                    const description = interaction.options.getString('description');

                    if (amount <= 0) {
                        await interaction.reply({
                            content: 'Amount must be greater than 0.',
                            ephemeral: true
                        });
                        return;
                    }

                    const income = await Budget.addIncome(userId, guildId, amount, description);

                    const embed = new EmbedBuilder()
                        .setTitle('Income Recorded')
                        .setDescription(`💰 +$${amount.toFixed(2)}`)
                        .addFields({ name: 'Amount', value: `$${amount.toFixed(2)}` })
                        .setColor(0x00FF00)
                        .setTimestamp();

                    if (description) {
                        embed.addFields({ name: 'Source', value: description });
                    }

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'summary': {
                    const month = interaction.options.getInteger('month');
                    const summary = await Budget.getSummary(userId, guildId, month);

                    const monthName = month
                        ? new Date(2024, month - 1).toLocaleString('default', { month: 'long' })
                        : 'Current Month';

                    const embed = new EmbedBuilder()
                        .setTitle(`Budget Summary - ${monthName}`)
                        .addFields(
                            { name: '💰 Income', value: `$${summary.income}`, inline: true },
                            { name: '💸 Expenses', value: `$${summary.expenses}`, inline: true },
                            { name: '💵 Balance', value: `$${summary.balance}`, inline: true }
                        )
                        .setColor(parseFloat(summary.balance) >= 0 ? 0x00FF00 : 0xFF0000)
                        .setTimestamp();

                    if (summary.categories.length > 0) {
                        const topCategories = summary.categories.slice(0, 5).map(cat =>
                            `${cat.name}: $${cat.amount} (${cat.percentage}%)`
                        ).join('\n');
                        embed.addFields({ name: 'Top Expense Categories', value: topCategories });
                    }

                    embed.setFooter({ text: `${summary.entryCount} transactions this month` });

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'categories': {
                    const categories = await Budget.getCategories(userId, guildId);

                    if (categories.length === 0) {
                        await interaction.reply({
                            content: 'No expense categories found.',
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Spending by Category')
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const categoryList = categories.slice(0, 15).map((cat, index) => {
                        const bar = '█'.repeat(Math.floor(parseFloat(cat.total) / 100));
                        return `${index + 1}. **${cat.category}**\n   $${cat.total} (${cat.count} transactions)\n   ${bar}`;
                    }).join('\n\n');

                    embed.setDescription(categoryList);

                    if (categories.length > 15) {
                        embed.setFooter({ text: `Showing 15 of ${categories.length} categories` });
                    }

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'recent': {
                    const limit = interaction.options.getInteger('limit') || 10;
                    const entries = await Budget.getRecentEntries(userId, guildId, limit);

                    if (entries.length === 0) {
                        await interaction.reply({
                            content: 'No transactions found.',
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Recent Transactions')
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const transactionList = entries.map(entry => {
                        const emoji = entry.type === 'income' ? '💰' : '💸';
                        const sign = entry.type === 'income' ? '+' : '-';
                        const date = new Date(entry.date).toLocaleDateString();
                        const desc = entry.description ? ` - ${entry.description}` : '';
                        return `${emoji} ${date} | **${sign}$${entry.amount.toFixed(2)}** | ${entry.category}${desc}`;
                    }).join('\n');

                    embed.setDescription(transactionList);
                    embed.setFooter({ text: `Showing ${entries.length} transactions` });

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'trend': {
                    const months = interaction.options.getInteger('months') || 6;
                    const trend = await Budget.getMonthlyTrend(userId, guildId, months);

                    const embed = new EmbedBuilder()
                        .setTitle(`Budget Trend - Last ${months} Months`)
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const trendList = trend.map(month => {
                        const balance = parseFloat(month.balance);
                        const balanceEmoji = balance >= 0 ? '✅' : '❌';
                        return `**${month.month}**\n💰 Income: $${month.income}\n💸 Expenses: $${month.expenses}\n${balanceEmoji} Balance: $${month.balance}`;
                    }).join('\n\n');

                    embed.setDescription(trendList);

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in budget ${subcommand}:`, error);
            const errorMessage = {
                content: 'An error occurred while processing your request.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};