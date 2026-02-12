import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  TextBasedChannel,
} from 'discord.js';
import { ImageService } from '../utils/imageService';
import { logger } from '../shared/utils/logger';

// Exported for testing
export function parseMessageInput(input: string): {
  messageId: string;
  channelId: string | null;
  guildId: string | null;
} {
  const linkMatch = input.match(/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
  if (linkMatch) {
    return {
      guildId: linkMatch[1],
      channelId: linkMatch[2],
      messageId: linkMatch[3],
    };
  }
  return { messageId: input, channelId: null, guildId: null };
}

export default {
  data: new SlashCommandBuilder()
    .setName('make-it-a-quote')
    .setDescription('Generate a dramatic quote image from a message')
    .addStringOption((option) =>
      option
        .setName('message_id')
        .setDescription('Message ID or message link (right-click → Copy Message Link)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Note: Bot automatically defers all command interactions globally
      // No need to defer here - interaction is already deferred by bot.ts

      // Get message input from command options (plain ID or Discord message link)
      const rawInput = interaction.options.getString('message_id', true);
      const { messageId, channelId, guildId } = parseMessageInput(rawInput);

      // Validate channel context
      if (!interaction.channel) {
        await interaction.editReply({
          content: '❌ This command can only be used in a text channel.',
        });
        return;
      }

      // Fetch the message by ID (cross-channel if link provided)
      let targetMessage;
      try {
        if (channelId) {
          // Cross-channel: message link provided
          if (guildId && interaction.guild && guildId !== interaction.guild.id) {
            await interaction.editReply({
              content: '❌ That message link points to a different server.',
            });
            return;
          }

          if (!interaction.guild) {
            await interaction.editReply({
              content: '❌ Cross-channel quoting is only available in servers.',
            });
            return;
          }

          let targetChannel;
          try {
            targetChannel = await interaction.guild.channels.fetch(channelId);
          } catch {
            await interaction.editReply({
              content:
                '❌ Could not access the channel from that message link. Make sure the bot has access to that channel.',
            });
            return;
          }

          if (!targetChannel || !targetChannel.isTextBased()) {
            await interaction.editReply({
              content: '❌ The channel from that message link is not a text channel.',
            });
            return;
          }

          targetMessage = await (targetChannel as TextBasedChannel).messages.fetch(messageId);
        } else {
          // Same channel: plain message ID (backward compatible)
          targetMessage = await interaction.channel.messages.fetch(messageId);
        }
      } catch (error) {
        logger.error('Failed to fetch message for quote:', { messageId, channelId, error });
        await interaction.editReply({
          content:
            '❌ Could not find message with that ID. Make sure:\n' +
            '• You copied the correct message ID or link\n' +
            '• The message still exists\n' +
            '• The bot has access to that channel',
        });
        return;
      }

      // Extract message content and author info
      const quoteText = targetMessage.content;
      const author = targetMessage.author;

      if (!quoteText || quoteText.trim().length === 0) {
        await interaction.editReply({
          content: '❌ The selected message has no text content.',
        });
        return;
      }

      // Get guild-specific avatar URL (server PFP takes precedence over global PFP)
      // When targetMessage.member is null (common for other users' fetched messages),
      // explicitly fetch the guild member to get their server-specific profile picture
      let member = targetMessage.member;
      if (!member && interaction.guild) {
        try {
          member = await interaction.guild.members.fetch(author.id);
        } catch {
          // User may have left the server — fall back to global avatar
        }
      }
      const avatarUrl = member
        ? member.displayAvatarURL({ extension: 'png', size: 512 })
        : author.displayAvatarURL({ extension: 'png', size: 512 });

      // Generate quote image
      logger.info(`Generating quote image for message from ${author.username}`, {
        userId: author.id,
        guildId: interaction.guild?.id,
        messageLength: quoteText.length,
      });

      const imageBuffer = await ImageService.generateQuoteImage(
        avatarUrl,
        quoteText,
        author.username
      );

      // Create attachment and send
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'quote.png' });

      await interaction.editReply({
        content: "✨ Here's your quote:",
        files: [attachment],
      });

      logger.info(`Quote image sent successfully for ${author.username}`, {
        userId: author.id,
        guildId: interaction.guild?.id,
      });
    } catch (error) {
      logger.error('Failed to generate quote image:', error);

      const isCanvasUnavailable =
        error instanceof Error && error.message.includes('skia-canvas is not available');

      const errorMessage = isCanvasUnavailable
        ? '❌ Quote image generation is not available on this server. The required image library (`skia-canvas`) is missing for this platform.'
        : '❌ Failed to generate quote image. Please try again.';

      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },
};
