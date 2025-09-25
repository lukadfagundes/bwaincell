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
    ChatInputCommandInteraction
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
            await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
        } else {
            await interaction.followUp({ content: '❌ This command can only be used in a server.', ephemeral: true });
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
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ List "${listName}" not found.`,
                        ephemeral: true
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
                await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
            } else {
                await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
            }
            return;
        }

        // Clear completed items
        if (customId.startsWith('list_clear_')) {
            const listName = customId.replace('list_clear_', '');
            const list = await List.findOne({
                where: { user_id: userId, guild_id: guildId, name: listName }
            });

            if (!list) {
                // Check if already acknowledged before responding
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({
                        content: `❌ List "${listName}" not found.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: `❌ List "${listName}" not found.`,
                        ephemeral: true
                    });
                }
                return;
            }

            let cleared = 0;
            if (list.items && list.items.length > 0) {
                const beforeCount = list.items.length;
                list.items = list.items.filter(item => !item.completed);
                cleared = beforeCount - list.items.length;
                await list.save();
            }

            // Check if already acknowledged before responding
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({
                    content: `🧹 Cleared ${cleared} completed items from "${listName}".`,
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: `🧹 Cleared ${cleared} completed items from "${listName}".`,
                    ephemeral: true
                });
            }
            return;
        }

        // Refresh list view
        if (customId.startsWith('list_refresh_')) {
            const listName = customId.replace('list_refresh_', '');

            const command = interaction.client.commands.get('list');
            if (command) {
                const mockInteraction = {
                    ...interaction,
                    options: {
                        getSubcommand: () => 'show',
                        getString: (name: string) => {
                            if (name === 'list_name') return listName;
                            return null;
                        }
                    }
                } as unknown as ChatInputCommandInteraction;

                await command.execute(mockInteraction);
            }
            return;
        }
    } catch (error) {
        await handleInteractionError(interaction, error, 'list button handler');
    }
}