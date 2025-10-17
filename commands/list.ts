import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  TextChannel,
  Message,
  FetchMessagesOptions,
} from 'discord.js';
import { logger } from '../shared/utils/logger';
import List from '../database/models/List';

export default {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Manage your lists')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a new list')
        .addStringOption((option) =>
          option.setName('name').setDescription('List name').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add item to a list')
        .addStringOption((option) =>
          option
            .setName('list_name')
            .setDescription('Name of the list')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option.setName('item').setDescription('Item to add').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Display a list')
        .addStringOption((option) =>
          option
            .setName('list_name')
            .setDescription('Name of the list to show')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove item from a list')
        .addStringOption((option) =>
          option
            .setName('list_name')
            .setDescription('Name of the list')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName('item')
            .setDescription('Item to remove')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('clear')
        .setDescription('Clear completed items from a list')
        .addStringOption((option) =>
          option
            .setName('list_name')
            .setDescription('Name of the list')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete entire list')
        .addStringOption((option) =>
          option
            .setName('list_name')
            .setDescription('Name of the list to delete')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) => subcommand.setName('all').setDescription('Show all your lists'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('complete')
        .setDescription('Mark an item as complete')
        .addStringOption((option) =>
          option
            .setName('list_name')
            .setDescription('Name of the list')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName('item')
            .setDescription('Item to mark as complete')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('consolidate')
        .setDescription('Create a list from all messages in this channel')
    ),

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focused = interaction.options.getFocused(true);
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.respond([]);
      return;
    }

    try {
      if (focused.name === 'list_name') {
        const lists = await List.getUserLists(userId, guildId);
        const choices = lists.map((list: any) => list.name).slice(0, 25);

        const filtered = choices.filter((choice: string) =>
          choice.toLowerCase().includes(focused.value.toLowerCase())
        );

        await interaction.respond(
          filtered.map((choice: string) => ({ name: choice, value: choice }))
        );
      } else if (focused.name === 'item') {
        const listName = interaction.options.getString('list_name');
        if (listName) {
          const list = await List.getList(userId, guildId, listName);
          if (list && list.items) {
            const items = list.items.map((item: any) => item.text).slice(0, 25);
            const filtered = items.filter((item: string) =>
              item.toLowerCase().includes(focused.value.toLowerCase())
            );

            await interaction.respond(
              filtered.map((choice: string) => ({ name: choice, value: choice }))
            );
          } else {
            await interaction.respond([]);
          }
        } else {
          await interaction.respond([]);
        }
      }
    } catch (error) {
      logger.error('Error in list autocomplete', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        guildId,
      });
      await interaction.respond([]);
    }
  },

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Note: Interaction is already deferred by bot.js for immediate acknowledgment

    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.editReply({
        content: 'This command can only be used in a server.',
      });
      return;
    }

    try {
      switch (subcommand) {
        case 'create': {
          const name = interaction.options.getString('name', true);
          const list = await List.createList(userId, guildId, name);

          if (!list) {
            await interaction.editReply({
              content: `A list named "${name}" already exists.`,
            });
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle('List Created')
            .setDescription(`List "${name}" has been created successfully.`)
            .setColor(0x00ff00)
            .setTimestamp();

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

          await interaction.editReply({ embeds: [embed], components: [row] });
          break;
        }

        case 'add': {
          const listName = interaction.options.getString('list_name', true);
          const item = interaction.options.getString('item', true);
          const list = await List.addItem(userId, guildId, listName, item);

          if (!list) {
            await interaction.editReply({
              content: `List "${listName}" not found.`,
            });
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle('Item Added')
            .setDescription(`Added "${item}" to list "${listName}"`)
            .setColor(0x00ff00)
            .addFields({ name: 'Total Items', value: list.items.length.toString() })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'show': {
          const listName = interaction.options.getString('list_name', true);
          const list = await List.getList(userId, guildId, listName);

          if (!list) {
            await interaction.editReply({
              content: `List "${listName}" not found.`,
            });
            return;
          }

          const embed = new EmbedBuilder()
            .setTitle(`List: ${listName}`)
            .setColor(0x0099ff)
            .setTimestamp();

          if (list.items.length === 0) {
            embed.setDescription('This list is empty.');
          } else {
            const itemsList = list.items
              .map((item: any, index: number) => {
                const status = item.completed ? '✅' : '⬜';
                return `${status} ${index + 1}. ${item.text}`;
              })
              .join('\n');

            embed.setDescription(itemsList);

            const completed = list.items.filter((item: any) => item.completed).length;
            embed.setFooter({ text: `${completed}/${list.items.length} completed` });
          }

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`list_add_${listName}`)
              .setLabel('Add Item')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('➕'),
            new ButtonBuilder()
              .setCustomId(`list_mark_complete_${listName}`)
              .setLabel('Mark Complete')
              .setStyle(ButtonStyle.Success)
              .setEmoji('✅')
              .setDisabled(
                list.items.length === 0 || list.items.every((item: any) => item.completed)
              ),
            new ButtonBuilder()
              .setCustomId(`list_clear_completed_${listName}`)
              .setLabel('Clear Completed')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🧹')
              .setDisabled(!list.items || !list.items.some((item: any) => item.completed))
          );

          await interaction.editReply({ embeds: [embed], components: [row] });
          break;
        }

        case 'remove': {
          const listName = interaction.options.getString('list_name', true);
          const item = interaction.options.getString('item', true);
          const list = await List.removeItem(userId, guildId, listName, item);

          if (!list) {
            await interaction.editReply({
              content: `List "${listName}" not found or item "${item}" doesn't exist.`,
            });
            return;
          }

          await interaction.editReply({
            content: `Removed "${item}" from list "${listName}".`,
          });
          break;
        }

        case 'clear': {
          const listName = interaction.options.getString('list_name', true);
          const list = await List.clearCompleted(userId, guildId, listName);

          if (!list) {
            await interaction.editReply({
              content: `List "${listName}" not found.`,
            });
            return;
          }

          await interaction.editReply({
            content: `Cleared completed items from list "${listName}".`,
          });
          break;
        }

        case 'delete': {
          const listName = interaction.options.getString('list_name', true);

          const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

          await interaction.editReply({
            content: `Are you sure you want to delete list "${listName}"? This action cannot be undone.`,
            components: [confirmRow],
          });
          break;
        }

        case 'all': {
          const lists = await List.getUserLists(userId, guildId);

          if (lists.length === 0) {
            await interaction.editReply({
              content: 'You have no lists.',
            });
            return;
          }

          const embed = new EmbedBuilder().setTitle('Your Lists').setColor(0x0099ff).setTimestamp();

          const listInfo = lists
            .map((list: any) => {
              const itemCount = list.items ? list.items.length : 0;
              const completedCount = list.items
                ? list.items.filter((item: any) => item.completed).length
                : 0;
              return `📋 **${list.name}** - ${itemCount} items (${completedCount} completed)`;
            })
            .join('\n');

          embed.setDescription(listInfo);
          embed.setFooter({ text: `Total lists: ${lists.length}` });

          if (lists.length > 0 && lists.length <= 5) {
            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId('list_select_view')
              .setPlaceholder('Select a list to view')
              .addOptions(
                lists.map((list, index) => ({
                  label: list.name,
                  description: `${list.items ? list.items.length : 0} items`,
                  value: `${list.name}_${index}`,
                }))
              );

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            await interaction.editReply({ embeds: [embed], components: [row] });
          } else {
            await interaction.editReply({ embeds: [embed] });
          }
          break;
        }

        case 'complete': {
          const listName = interaction.options.getString('list_name', true);
          const item = interaction.options.getString('item', true);
          const list = await List.toggleItem(userId, guildId, listName, item);

          if (!list) {
            await interaction.editReply({
              content: `List "${listName}" not found or item "${item}" doesn't exist.`,
            });
            return;
          }

          const toggledItem = list.items.find(
            (i: any) => i.text.toLowerCase() === item.toLowerCase()
          );
          if (!toggledItem) {
            await interaction.editReply({
              content: `Item "${item}" not found in list "${listName}".`,
            });
            return;
          }

          const status = toggledItem.completed ? 'completed' : 'uncompleted';

          await interaction.editReply({
            content: `Item "${item}" marked as ${status}.`,
          });
          break;
        }

        case 'consolidate': {
          const channel = interaction.channel as TextChannel;

          // Check permissions
          if (!channel.permissionsFor(interaction.client.user!)?.has('ReadMessageHistory')) {
            await interaction.editReply({
              content: '❌ I need "Read Message History" permission to consolidate messages.',
            });
            return;
          }

          // Phase 1: Fetch all messages with pagination
          const allMessages: Message[] = [];
          let lastMessageId: string | undefined = undefined;
          let fetchedCount = 0;

          logger.info('Starting message consolidation', {
            channelId: channel.id,
            channelName: channel.name,
            userId,
            guildId,
          });

          let hasMore = true;
          while (hasMore) {
            const options: FetchMessagesOptions = { limit: 100 };
            if (lastMessageId) {
              options.before = lastMessageId;
            }

            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) {
              hasMore = false;
              break;
            }

            allMessages.push(...messages.values());
            lastMessageId = messages.last()?.id;
            fetchedCount += messages.size;

            // Progress update every 500 messages
            if (fetchedCount % 500 === 0) {
              await interaction.editReply(`🔄 Fetching messages... ${fetchedCount} found so far`);
            }

            // Rate limit protection: 100ms delay between requests
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          logger.info('Messages fetched', {
            totalFetched: fetchedCount,
            channelId: channel.id,
          });

          // Phase 2: Filter out bot messages
          const userMessages = allMessages.filter((msg) => !msg.author.bot);

          // Phase 3: Sort oldest to newest
          userMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

          // Phase 4: Determine list name (handle collision)
          const channelName = channel.name;
          let listName = channelName;

          const existingList = await List.getList(userId, guildId, listName);

          if (existingList) {
            listName = `${channelName} Consolidated List`;
          }

          // Phase 5: Create list
          const newList = await List.createList(userId, guildId, listName);

          if (!newList) {
            await interaction.editReply({
              content: `❌ Failed to create list. A list named "${listName}" may already exist.`,
            });
            return;
          }

          // Phase 6: Add messages as list items (first 1000 chars, include empty as placeholder)
          let itemsCreated = 0;

          for (const message of userMessages) {
            const content = message.content.substring(0, 1000).trim();

            // If empty, add placeholder text
            const itemText = content.length === 0 ? '(empty message)' : content;

            await List.addItem(userId, guildId, listName, itemText);
            itemsCreated++;
          }

          logger.info('List consolidation complete', {
            listName,
            itemsCreated,
            totalMessages: fetchedCount,
            userMessages: userMessages.length,
            channelId: channel.id,
          });

          // Phase 7: Create success embed
          const embed = new EmbedBuilder()
            .setTitle(`📋 List: ${listName}`)
            .setDescription(
              `✅ Created list with **${itemsCreated}** items from **${fetchedCount}** total messages\n\n` +
                `${userMessages.length} user messages found (${fetchedCount - userMessages.length} bot messages filtered)`
            )
            .setColor(0x00ff00)
            .setTimestamp();

          // Add preview of first 10 items
          const updatedList = await List.getList(userId, guildId, listName);

          if (updatedList && updatedList.items && updatedList.items.length > 0) {
            const previewItems = updatedList.items.slice(0, 10);
            const itemList = previewItems
              .map((item: any, idx: number) => {
                const preview = item.text.substring(0, 50);
                return `${idx + 1}. ${preview}${item.text.length > 50 ? '...' : ''}`;
              })
              .join('\n');

            embed.addFields({ name: 'Preview', value: itemList || 'No items' });

            if (itemsCreated > 10) {
              embed.setFooter({ text: `Showing 10 of ${itemsCreated} items` });
            }
          }

          // Add action buttons
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`list_view_${listName}`)
              .setLabel('View Full List')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📋'),
            new ButtonBuilder()
              .setCustomId(`list_add_${listName}`)
              .setLabel('Add Item')
              .setStyle(ButtonStyle.Success)
              .setEmoji('➕')
          );

          await interaction.editReply({
            embeds: [embed],
            components: [row],
          });
          break;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('Error in list command', {
        command: interaction.commandName,
        subcommand,
        error: errorMessage,
        stack: errorStack,
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
      });

      const replyMessage = {
        content: 'An error occurred while processing your request.',
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyMessage);
      } else {
        await interaction.reply(replyMessage);
      }
    }
  },
};
