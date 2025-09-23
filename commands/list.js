const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const List = require('../database/models/List');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Manage your lists')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new list')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('List name')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add item to a list')
                .addStringOption(option =>
                    option.setName('list_name')
                        .setDescription('Name of the list')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Display a list')
                .addStringOption(option =>
                    option.setName('list_name')
                        .setDescription('Name of the list to show')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove item from a list')
                .addStringOption(option =>
                    option.setName('list_name')
                        .setDescription('Name of the list')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item to remove')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear completed items from a list')
                .addStringOption(option =>
                    option.setName('list_name')
                        .setDescription('Name of the list')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete entire list')
                .addStringOption(option =>
                    option.setName('list_name')
                        .setDescription('Name of the list to delete')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Show all your lists'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle item completion status')
                .addStringOption(option =>
                    option.setName('list_name')
                        .setDescription('Name of the list')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('item')
                        .setDescription('Item to toggle')
                        .setRequired(true)
                        .setAutocomplete(true))),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        if (focused.name === 'list_name') {
            const lists = await List.getUserLists(userId, guildId);
            const choices = lists.map(list => list.name).slice(0, 25);

            const filtered = choices.filter(choice =>
                choice.toLowerCase().includes(focused.value.toLowerCase())
            );

            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice }))
            );
        } else if (focused.name === 'item') {
            const listName = interaction.options.getString('list_name');
            if (listName) {
                const list = await List.getList(userId, guildId, listName);
                if (list && list.items) {
                    const items = list.items.map(item => item.text).slice(0, 25);
                    const filtered = items.filter(item =>
                        item.toLowerCase().includes(focused.value.toLowerCase())
                    );

                    await interaction.respond(
                        filtered.map(choice => ({ name: choice, value: choice }))
                    );
                } else {
                    await interaction.respond([]);
                }
            } else {
                await interaction.respond([]);
            }
        }
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'create': {
                    const name = interaction.options.getString('name');
                    const list = await List.createList(userId, guildId, name);

                    if (!list) {
                        await interaction.reply({
                            content: `A list named "${name}" already exists.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('List Created')
                        .setDescription(`List "${name}" has been created successfully.`)
                        .setColor(0x00FF00)
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`list_add_${name}`)
                                .setLabel('Add Item')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('➕'),
                            new ButtonBuilder()
                                .setCustomId(`list_view_${name}`)
                                .setLabel('View List')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('👁️')
                        );

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'add': {
                    const listName = interaction.options.getString('list_name');
                    const item = interaction.options.getString('item');
                    const list = await List.addItem(userId, guildId, listName, item);

                    if (!list) {
                        await interaction.reply({
                            content: `List "${listName}" not found.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Item Added')
                        .setDescription(`Added "${item}" to list "${listName}"`)
                        .setColor(0x00FF00)
                        .addFields({ name: 'Total Items', value: list.items.length.toString() })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'show': {
                    const listName = interaction.options.getString('list_name');
                    const list = await List.getList(userId, guildId, listName);

                    if (!list) {
                        await interaction.reply({
                            content: `List "${listName}" not found.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`List: ${listName}`)
                        .setColor(0x0099FF)
                        .setTimestamp();

                    if (list.items.length === 0) {
                        embed.setDescription('This list is empty.');
                    } else {
                        const itemsList = list.items.map((item, index) => {
                            const status = item.completed ? '✅' : '⬜';
                            return `${status} ${index + 1}. ${item.text}`;
                        }).join('\n');

                        embed.setDescription(itemsList);

                        const completed = list.items.filter(item => item.completed).length;
                        embed.setFooter({ text: `${completed}/${list.items.length} completed` });
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`list_add_${listName}`)
                                .setLabel('Add Item')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('➕'),
                            new ButtonBuilder()
                                .setCustomId(`list_clear_${listName}`)
                                .setLabel('Clear Completed')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🧹'),
                            new ButtonBuilder()
                                .setCustomId(`list_refresh_${listName}`)
                                .setLabel('Refresh')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🔄')
                        );

                    await interaction.reply({ embeds: [embed], components: [row] });
                    break;
                }

                case 'remove': {
                    const listName = interaction.options.getString('list_name');
                    const item = interaction.options.getString('item');
                    const list = await List.removeItem(userId, guildId, listName, item);

                    if (!list) {
                        await interaction.reply({
                            content: `List "${listName}" not found or item "${item}" doesn't exist.`,
                            ephemeral: true
                        });
                        return;
                    }

                    await interaction.reply({
                        content: `Removed "${item}" from list "${listName}".`,
                        ephemeral: true
                    });
                    break;
                }

                case 'clear': {
                    const listName = interaction.options.getString('list_name');
                    const list = await List.clearCompleted(userId, guildId, listName);

                    if (!list) {
                        await interaction.reply({
                            content: `List "${listName}" not found.`,
                            ephemeral: true
                        });
                        return;
                    }

                    await interaction.reply({
                        content: `Cleared completed items from list "${listName}".`,
                        ephemeral: true
                    });
                    break;
                }

                case 'delete': {
                    const listName = interaction.options.getString('list_name');

                    const confirmRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`list_delete_confirm_${listName}`)
                                .setLabel('Confirm Delete')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('⚠️'),
                            new ButtonBuilder()
                                .setCustomId('list_delete_cancel')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('❌')
                        );

                    await interaction.reply({
                        content: `Are you sure you want to delete list "${listName}"? This action cannot be undone.`,
                        components: [confirmRow],
                        ephemeral: true
                    });
                    break;
                }

                case 'all': {
                    const lists = await List.getUserLists(userId, guildId);

                    if (lists.length === 0) {
                        await interaction.reply({
                            content: 'You have no lists.',
                            ephemeral: true
                        });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Your Lists')
                        .setColor(0x0099FF)
                        .setTimestamp();

                    const listInfo = lists.map(list => {
                        const itemCount = list.items ? list.items.length : 0;
                        const completedCount = list.items ? list.items.filter(item => item.completed).length : 0;
                        return `📋 **${list.name}** - ${itemCount} items (${completedCount} completed)`;
                    }).join('\n');

                    embed.setDescription(listInfo);
                    embed.setFooter({ text: `Total lists: ${lists.length}` });

                    if (lists.length <= 5) {
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId('list_select_view')
                            .setPlaceholder('Select a list to view')
                            .addOptions(
                                lists.map(list => ({
                                    label: list.name,
                                    description: `${list.items ? list.items.length : 0} items`,
                                    value: list.name
                                }))
                            );

                        const row = new ActionRowBuilder()
                            .addComponents(selectMenu);

                        await interaction.reply({ embeds: [embed], components: [row] });
                    } else {
                        await interaction.reply({ embeds: [embed] });
                    }
                    break;
                }

                case 'toggle': {
                    const listName = interaction.options.getString('list_name');
                    const item = interaction.options.getString('item');
                    const list = await List.toggleItem(userId, guildId, listName, item);

                    if (!list) {
                        await interaction.reply({
                            content: `List "${listName}" not found or item "${item}" doesn't exist.`,
                            ephemeral: true
                        });
                        return;
                    }

                    const toggledItem = list.items.find(i => i.text.toLowerCase() === item.toLowerCase());
                    const status = toggledItem.completed ? 'completed' : 'uncompleted';

                    await interaction.reply({
                        content: `Item "${item}" marked as ${status}.`,
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error(`Error in list ${subcommand}:`, error);
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