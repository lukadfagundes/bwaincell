/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module MiddlewareRunner
 * @description Core middleware execution system for interaction handlers
 */

import { Interaction } from 'discord.js';
import { logger } from '@shared/utils/logger';
import { InteractionMiddleware, MiddlewareContext } from './types';

/**
 * Middleware runner that manages and executes middleware chain
 */
export class MiddlewareRunner {
  private middlewares: InteractionMiddleware[] = [];

  /**
   * Register a middleware
   * @param {InteractionMiddleware} middleware - Middleware to register
   */
  use(middleware: InteractionMiddleware): void {
    this.middlewares.push(middleware);
    logger.info(`Middleware registered: ${middleware.name}`);
  }

  /**
   * Remove a middleware by name
   * @param {string} name - Name of middleware to remove
   */
  remove(name: string): void {
    this.middlewares = this.middlewares.filter((m) => m.name !== name);
    logger.info(`Middleware removed: ${name}`);
  }

  /**
   * Execute middleware chain
   * @param {Interaction} interaction - Discord interaction
   * @param {Function} handler - Final handler function
   */
  async run(interaction: Interaction, handler: () => Promise<void>): Promise<void> {
    const context: MiddlewareContext = {
      interaction,
      startTime: Date.now(),
      metadata: {},
      userId: interaction.user.id,
      guildId: interaction.guild?.id,
    };

    // Build middleware chain
    const chain = this.buildChain(this.middlewares, handler, context);

    try {
      await chain();
    } catch (error) {
      logger.error('Middleware chain error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: context.userId,
        guildId: context.guildId,
      });
      throw error;
    }
  }

  /**
   * Build the middleware execution chain
   * @private
   */
  private buildChain(
    middlewares: InteractionMiddleware[],
    finalHandler: () => Promise<void>,
    context: MiddlewareContext
  ): () => Promise<void> {
    // Start with the final handler
    let chain = finalHandler;

    // Wrap each middleware in reverse order
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i];
      const next = chain;

      chain = async () => {
        try {
          await middleware.execute(context, next);
        } catch (error) {
          logger.error(`Middleware error in ${middleware.name}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            middleware: middleware.name,
          });
          throw error;
        }
      };
    }

    return chain;
  }

  /**
   * Get list of registered middlewares
   */
  getMiddlewares(): string[] {
    return this.middlewares.map((m) => m.name);
  }

  /**
   * Clear all middlewares
   */
  clear(): void {
    this.middlewares = [];
    logger.info('All middlewares cleared');
  }
}
