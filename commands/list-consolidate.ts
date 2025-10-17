import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  TextChannel,
  Message,
  FetchMessagesOptions,
} from 'discord.js';
import { logger } from '../shared/utils/logger';
import List from '../database/models/List';

export default {
  data: new SlashCommandBuilder()
    .setName('list-consolidate')
    .setDescription('Create a list from all messages in this channel'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const channel = interaction.channel as TextChannel;
      const userId = interaction.user.id;
      const guildId = interaction.guild!.id;

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
      const list = await List.createList(userId, guildId, listName);

      if (!list) {
        await interaction.editReply({
          content: `❌ Failed to create list. A list named "${listName}" may already exist.`,
        });
        return;
      }

      // Phase 6: Add messages as list items (first 1000 chars, skip empty)
      let itemsCreated = 0;

      for (const message of userMessages) {
        const content = message.content.substring(0, 1000).trim();

        // Skip empty messages
        if (content.length === 0) continue;

        await List.addItem(userId, guildId, listName, content);
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
    } catch (error) {
      logger.error('List consolidate command failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
        channelId: interaction.channel?.id,
      });

      await interaction.editReply({
        content:
          '❌ An error occurred while consolidating messages. Please try again or check my permissions.',
      });
    }
  },
};
