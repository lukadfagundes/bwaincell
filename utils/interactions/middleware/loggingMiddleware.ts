/**
 * @module LoggingMiddleware
 * @description Middleware for logging all Discord interactions with performance metrics
 */

import { logger } from '@shared/utils/logger';
import { InteractionMiddleware, MiddlewareContext } from './types';

/**
 * Logging middleware that tracks all interactions and their performance
 */
export const loggingMiddleware: InteractionMiddleware = {
    name: 'logging',
    execute: async (context: MiddlewareContext, next: () => Promise<void>) => {
        const { interaction, userId, guildId } = context;
        const interactionType = getInteractionType(interaction);
        const startTime = Date.now();

        // Log interaction start
        logger.info('Interaction started', {
            type: interactionType,
            userId,
            guildId,
            customId: 'customId' in interaction ? interaction.customId : undefined,
            commandName: 'commandName' in interaction ? interaction.commandName : undefined
        });

        try {
            // Execute next middleware/handler
            await next();

            // Log successful completion
            const duration = Date.now() - startTime;
            logger.info('Interaction completed', {
                type: interactionType,
                userId,
                guildId,
                duration: `${duration}ms`,
                success: true
            });

            // Store performance metric in context
            context.metadata.duration = duration;

            // Warn if interaction took too long
            if (duration > 2000) {
                logger.warn('Slow interaction detected', {
                    type: interactionType,
                    duration: `${duration}ms`,
                    userId,
                    guildId
                });
            }
        } catch (error) {
            // Log error
            const duration = Date.now() - startTime;
            logger.error('Interaction failed', {
                type: interactionType,
                userId,
                guildId,
                duration: `${duration}ms`,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });

            // Re-throw to let error handling middleware deal with it
            throw error;
        }
    }
};

/**
 * Helper function to determine interaction type
 */
function getInteractionType(interaction: any): string {
    if (interaction.isButton()) return 'button';
    if (interaction.isStringSelectMenu()) return 'selectMenu';
    if (interaction.isModalSubmit()) return 'modal';
    if (interaction.isCommand()) return 'command';
    if (interaction.isAutocomplete()) return 'autocomplete';
    return 'unknown';
}