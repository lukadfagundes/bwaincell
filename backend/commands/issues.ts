import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { logger } from '../shared/utils/logger';
import { githubService } from '../utils/githubService';

export default {
  data: new SlashCommandBuilder()
    .setName('issues')
    .setDescription('Submit an issue or suggestion to the GitHub repository')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Issue title (brief summary)')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('Detailed description of the issue or suggestion')
        .setRequired(true)
        .setMaxLength(2000)
    )
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Type of issue')
        .setRequired(false)
        .addChoices(
          { name: 'Bug Report', value: 'bug' },
          { name: 'Feature Request', value: 'feature' },
          { name: 'Question', value: 'question' },
          { name: 'Documentation', value: 'documentation' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Note: Interaction is already deferred by bot.ts for immediate acknowledgment

    const userId = interaction.user.id;
    const username = interaction.user.username;
    const guildId = interaction.guild?.id;

    if (!guildId) {
      await interaction.editReply({
        content: '❌ This command can only be used in a server.',
      });
      return;
    }

    // Check if GitHub service is configured
    if (!githubService.isConfigured()) {
      logger.error('GitHub service not configured - /issues command unavailable', {
        userId,
        guildId,
      });

      await interaction.editReply({
        content:
          '❌ GitHub integration is not configured. Please contact the administrator to set up the /issues command.',
      });
      return;
    }

    try {
      const title = interaction.options.getString('title', true);
      const description = interaction.options.getString('description', true);
      const issueType = interaction.options.getString('type') || 'general';

      // Build issue body with metadata
      const issueBody = `## Description

${description}

---

**Submitted by:** ${username} (Discord ID: ${userId})
**Guild ID:** ${guildId}
**Issue Type:** ${issueType}
**Timestamp:** ${new Date().toISOString()}`;

      // Determine labels based on issue type
      const labels: string[] = [];
      if (issueType === 'bug') labels.push('bug');
      if (issueType === 'feature') labels.push('enhancement');
      if (issueType === 'question') labels.push('question');
      if (issueType === 'documentation') labels.push('documentation');

      logger.info('Creating GitHub issue from Discord', {
        userId,
        username,
        guildId,
        title,
        issueType,
        labels,
      });

      // Create GitHub issue
      const result = await githubService.createIssue(title, issueBody, labels);

      if (!result.success) {
        logger.error('GitHub issue creation failed', {
          userId,
          title,
          error: result.error,
        });

        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Failed to Create Issue')
          .setDescription(
            result.error ||
              'An error occurred while creating the GitHub issue. Please try again later.'
          )
          .setColor(0xff0000)
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Success response
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Issue Created Successfully')
        .setDescription(`**${title}**`)
        .addFields(
          { name: '📝 Issue Number', value: `#${result.issueNumber}`, inline: true },
          { name: '🏷️ Type', value: issueType, inline: true },
          {
            name: '👤 Submitted By',
            value: username,
            inline: true,
          }
        )
        .setColor(0x00ff00)
        .setTimestamp()
        .setFooter({ text: 'Thank you for your feedback!' });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('View on GitHub')
          .setURL(result.issueUrl!)
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗'),
        new ButtonBuilder()
          .setCustomId('issues_create_another')
          .setLabel('Submit Another Issue')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('➕')
      );

      await interaction.editReply({ embeds: [successEmbed], components: [row] });

      logger.info('GitHub issue created and Discord response sent', {
        userId,
        issueNumber: result.issueNumber,
        issueUrl: result.issueUrl,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('Error in issues command', {
        command: interaction.commandName,
        error: errorMessage,
        stack: errorStack,
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
      });

      const replyMessage = {
        content: '❌ An error occurred while processing your request. Please try again later.',
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyMessage);
      } else {
        await interaction.editReply(replyMessage);
      }
    }
  },
};
