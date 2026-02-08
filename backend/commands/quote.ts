import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js';
import { ImageService } from '../utils/imageService';
import { logger } from '../shared/utils/logger';

export default {
  data: new SlashCommandBuilder()
    .setName('make-it-a-quote')
    .setDescription('Generate a dramatic quote image from a message')
    .addStringOption((option) =>
      option
        .setName('message_id')
        .setDescription('The ID of the message to quote (right-click → Copy Message ID)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Note: Bot automatically defers all command interactions globally
      // No need to defer here - interaction is already deferred by bot.ts

      // Get message ID from command options
      const messageId = interaction.options.getString('message_id', true);

      // Validate channel context
      if (!interaction.channel) {
        await interaction.editReply({
          content: '❌ This command can only be used in a text channel.',
        });
        return;
      }

      // Fetch the message by ID
      let targetMessage;
      try {
        targetMessage = await interaction.channel.messages.fetch(messageId);
      } catch (error) {
        logger.error('Failed to fetch message for quote:', { messageId, error });
        await interaction.editReply({
          content:
            '❌ Could not find message with that ID. Make sure:\n' +
            '• You copied the correct message ID\n' +
            '• The message is in this channel\n' +
            '• The message still exists',
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

      // Get guild-specific avatar URL (member avatar takes precedence over user avatar)
      // This ensures we use the server-specific profile picture if one is set
      const member = targetMessage.member;
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

      const errorMessage = '❌ Failed to generate quote image. Please try again.';

      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },
};
