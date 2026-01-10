import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  CacheType,
} from 'discord.js';
import { logger } from '@shared/utils/logger';

type Interaction =
  | ButtonInteraction<CacheType>
  | StringSelectMenuInteraction<CacheType>
  | ModalSubmitInteraction<CacheType>;

export async function handleInteractionError(
  interaction: Interaction,
  error: unknown,
  context: string
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(`Error in ${context}`, {
    error: errorMessage,
    stack: errorStack,
    userId: interaction.user.id,
    guildId: interaction.guildId,
    interactionType: interaction.type,
    customId: 'customId' in interaction ? interaction.customId : undefined,
  });

  const userMessage = 'There was an error processing your request. Please try again later.';

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: userMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: userMessage, ephemeral: true });
    }
  } catch (replyError) {
    logger.error('Failed to send error message to user', {
      originalError: errorMessage,
      replyError: replyError instanceof Error ? replyError.message : 'Unknown error',
    });
  }
}

export async function sendErrorEmbed(
  interaction: Interaction,
  title: string,
  description: string
): Promise<void> {
  try {
    const errorEmbed = {
      color: 0xff0000,
      title: `❌ ${title}`,
      description: description,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Error occurred',
      },
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  } catch (error) {
    logger.error('Failed to send error embed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
