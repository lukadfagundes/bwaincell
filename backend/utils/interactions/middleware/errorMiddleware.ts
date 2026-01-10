/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module ErrorMiddleware
 * @description Middleware for graceful error handling and recovery
 */

import { logger } from '@shared/utils/logger';
import { InteractionMiddleware, MiddlewareContext } from './types';

/**
 * Error types and their user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  DATABASE_ERROR: '❌ A database error occurred. Please try again later.',
  PERMISSION_ERROR: "❌ You don't have permission to perform this action.",
  NOT_FOUND: '❌ The requested item could not be found.',
  VALIDATION_ERROR: '❌ Invalid input provided. Please check your input.',
  RATE_LIMIT: "⏱️ You're doing that too fast. Please slow down.",
  TIMEOUT: '⏰ The operation timed out. Please try again.',
  UNKNOWN: '❌ An unexpected error occurred. Please try again.',
};

/**
 * Error recovery strategies
 * @TODO: Implement error recovery strategies
 */
// const RECOVERY_STRATEGIES = {
//     retry: async (_context: MiddlewareContext, handler: () => Promise<void>, retries = 3) => {
//         for (let i = 0; i < retries; i++) {
//             try {
//                 await handler();
//                 return;
//             } catch (error) {
//                 if (i === retries - 1) throw error;
//                 // Exponential backoff
//                 await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
//             }
//         }
//     },
//     fallback: async (context: MiddlewareContext, fallbackMessage: string) => {
//         const interaction = context.interaction;
//         if ('followUp' in interaction && typeof interaction.followUp === 'function') {
//             await interaction.followUp({
//                 content: fallbackMessage,
//                 ephemeral: true
//             });
//         }
//     }
// };

/**
 * Error handling middleware
 */
export const errorMiddleware: InteractionMiddleware = {
  name: 'error',
  execute: async (context: MiddlewareContext, next: () => Promise<void>) => {
    const { interaction, userId, guildId } = context;

    try {
      // Execute next middleware/handler
      await next();
    } catch (error) {
      // Classify the error
      const errorType = classifyError(error);
      const userMessage = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.UNKNOWN;

      // Log the error with context
      logger.error('Interaction error caught', {
        errorType,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        guildId,
        interactionId: interaction.id,
        metadata: context.metadata,
      });

      // Attempt to send error message to user
      try {
        if ('deferred' in interaction && interaction.deferred) {
          if ('editReply' in interaction && typeof interaction.editReply === 'function') {
            await interaction.editReply({
              content: userMessage,
            });
          }
        } else if ('replied' in interaction && interaction.replied) {
          if ('followUp' in interaction && typeof interaction.followUp === 'function') {
            await interaction.followUp({
              content: userMessage,
              ephemeral: true,
            });
          }
        } else {
          if ('reply' in interaction && typeof interaction.reply === 'function') {
            await interaction.reply({
              content: userMessage,
              ephemeral: true,
            });
          }
        }
      } catch (replyError) {
        logger.error('Failed to send error message to user', {
          originalError: error instanceof Error ? error.message : 'Unknown',
          replyError: replyError instanceof Error ? replyError.message : 'Unknown',
          userId,
          guildId,
        });
      }

      // Store error info in context for debugging
      context.metadata.error = {
        type: errorType,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };

      // Attempt recovery based on error type
      if (shouldAttemptRecovery(errorType)) {
        await attemptRecovery(context, errorType);
      }

      // Don't re-throw the error - we've handled it
    }
  },
};

/**
 * Classify error into categories
 */
function classifyError(error: any): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('database') || message.includes('sequelize')) {
    return 'DATABASE_ERROR';
  }
  if (message.includes('permission') || message.includes('forbidden')) {
    return 'PERMISSION_ERROR';
  }
  if (message.includes('not found') || message.includes('does not exist')) {
    return 'NOT_FOUND';
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return 'VALIDATION_ERROR';
  }
  if (message.includes('rate limit') || message.includes('too fast')) {
    return 'RATE_LIMIT';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT';
  }

  return 'UNKNOWN';
}

/**
 * Check if recovery should be attempted
 */
function shouldAttemptRecovery(errorType: string): boolean {
  // Don't attempt recovery for validation or permission errors
  return !['VALIDATION_ERROR', 'PERMISSION_ERROR', 'RATE_LIMIT'].includes(errorType);
}

/**
 * Attempt error recovery
 */
async function attemptRecovery(context: MiddlewareContext, errorType: string): Promise<void> {
  const { userId, guildId } = context;

  logger.info('Attempting error recovery', {
    errorType,
    userId,
    guildId,
  });

  switch (errorType) {
    case 'DATABASE_ERROR':
      // Log for admin attention
      logger.error('Database error requires attention', {
        userId,
        guildId,
        alert: 'CRITICAL',
      });
      break;

    case 'TIMEOUT':
      // Could retry with longer timeout
      context.metadata.recovery = 'timeout_extended';
      break;

    case 'NOT_FOUND':
      // Log for investigation
      context.metadata.recovery = 'not_found_logged';
      break;

    default:
      // Generic recovery logging
      context.metadata.recovery = 'logged_for_investigation';
  }
}
