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
    StringSelectMenuBuilder
} from 'discord.js';
import { getModels } from '../helpers/databaseHelper';
import { handleInteractionError } from '../responses/errorResponses';

export async function handleListButton(interaction: ButtonInteraction<CacheType>): Promise<void> {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;

    if (!guildId) {
        // Check if already acknowledged before responding
        if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({ content: '❌ This command can only be used in a server.', flags: 64 });
        } else {
            await interaction.followUp({ content: '❌ This command can only be used in a server.', flags: 64 });
        }
        return;
    }

    const { List } = await getModels();

    try {
        // Add item to list modal
        if (customId.startsWith('list_add_')) {
            const listName = customId.replace('list_add_', '');
            const modal = new ModalBuilder()
                .setCustomId(`list_add_item_modal_${encodeURIComponent(listName)}`)
                .setTitle(`Add Item to ${listName}`);

            const itemInput = new TextInputBuilder()
                .setCustomId('list_item')
                .setLabel('Item to add')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(100);

            const row = new ActionRowBuilder<TextInputBuilder>().addComponents(itemInput);
            modal.addComponents(row);
            await interaction.showModal(modal);
            return;
        }

        // View list
        if (customId.startsWith('list_view_')) {
            const listName = customId.replace('list_view_', '');
            const list = await List.findOne({
                where: { user_id: userId, guild_id: guildId, name: listName }
            });

            if (!list) {
                // Check if already acknowledged before responding
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({
                        content: `❌ List "${listName}" not found.`,
                        flags: 64
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ List "${listName}" not found.`,
                        flags: 64
                    });
                }
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`📝 ${list.name}`)
                .setColor(0x0099FF)
                .setTimestamp();

            if (!list.items || list.items.length === 0) {
                embed.setDescription('This list is empty. Add some items to get started!');
            } else {
                const itemList = list.items.map(item => {
                    const checkbox = item.completed ? '☑️' : '⬜';
                    return `${checkbox} ${item.text}`;
                }).join('\n');
                embed.setDescription(itemList);
                embed.setFooter({
                    text: `${list.items.filter(i => i.completed).length}/${list.items.length} completed`
                });
            }

            const row = new ActionRowBuilder<ButtonBuilder>()
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
                        .setEmoji('🧹')
                        .setDisabled(!list.items || !list.items.some(i => i.completed))
                );

            // Check if already acknowledged before responding
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
            } else {
                await interaction.followUp({ embeds: [embed], components: [row], flags: 64 });
            }
            return;
        }

        // Mark item complete - show select menu
        if (customId.startsWith('list_mark_complete_')) {
            const listName = customId.replace('list_mark_complete_', '');
            const list = await List.findOne({
                where: { user_id: userId, guild_id: guildId, name: listName }
            });

            if (!list) {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({
                        content: `❌ List "${listName}" not found.`,
                        flags: 64
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ List "${listName}" not found.`,
                        flags: 64
                    });
                }
                return;
            }

            // Get incomplete items
            const incompleteItems = list.items.filter(item => !item.completed);

            if (incompleteItems.length === 0) {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '✅ All items are already completed!'
                    });
                } else {
                    await interaction.reply({
                        content: '✅ All items are already completed!',
                        flags: 64
                    });
                }
                return;
            }

            // Build select menu with incomplete items (max 25 options)
            const options = incompleteItems.slice(0, 25).map((item, index) => ({
                label: item.text.substring(0, 100), // Discord max label length
                value: `${index}`,
                description: `Mark "${item.text.substring(0, 50)}" as complete`
            }));

            const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`list_complete_select_${listName}`)
                        .setPlaceholder('Select an item to mark as complete')
                        .addOptions(options)
                );

            if (interaction.deferred) {
                await interaction.editReply({
                    content: `Select an item from "${listName}" to mark as complete:`,
                    components: [selectMenu]
                });
            } else {
                await interaction.reply({
                    content: `Select an item from "${listName}" to mark as complete:`,
                    components: [selectMenu],
                    flags: 64
                });
            }
            return;
        }

        // Clear completed items
        if (customId.startsWith('list_clear_completed_')) {
            const listName = customId.replace('list_clear_completed_', '');
            const list = await (List as any).clearCompleted(userId, guildId, listName);

            if (!list) {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: `❌ List "${listName}" not found.`
                    });
                } else {
                    await interaction.reply({
                        content: `❌ List "${listName}" not found.`,
                        flags: 64
                    });
                }
                return;
            }

            if (interaction.deferred) {
                await interaction.editReply({
                    content: `🧹 Cleared all completed items from "${listName}".`
                });
            } else {
                await interaction.reply({
                    content: `🧹 Cleared all completed items from "${listName}".`,
                    flags: 64
                });
            }
            return;
        }

        // Delete list confirmation
        if (customId.startsWith('list_delete_confirm_')) {
            const listName = customId.replace('list_delete_confirm_', '');
            const deleted = await (List as any).deleteList(userId, guildId, listName);

            if (deleted) {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: `🗑️ List "${listName}" has been deleted.`,
                        components: []
                    });
                } else {
                    await interaction.reply({
                        content: `🗑️ List "${listName}" has been deleted.`,
                        components: [],
                        flags: 64
                    });
                }
            } else {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: `❌ List "${listName}" not found.`,
                        components: []
                    });
                } else {
                    await interaction.reply({
                        content: `❌ List "${listName}" not found.`,
                        components: [],
                        flags: 64
                    });
                }
            }
            return;
        }

        // Cancel delete
        if (customId === 'list_delete_cancel') {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Delete cancelled.',
                    components: []
                });
            } else {
                await interaction.reply({
                    content: '❌ Delete cancelled.',
                    components: [],
                    flags: 64
                });
            }
            return;
        }
    } catch (error) {
        await handleInteractionError(interaction, error, 'list button handler');
    }
}
