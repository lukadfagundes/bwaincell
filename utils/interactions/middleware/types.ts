/**
 * @module MiddlewareTypes
 * @description Type definitions for the interaction middleware system
 */

import { Interaction } from 'discord.js';

/**
 * Context object passed through middleware chain
 */
export interface MiddlewareContext {
    interaction: Interaction;
    startTime: number;
    metadata: Record<string, any>;
    userId: string;
    guildId?: string;
}

/**
 * Middleware function signature
 */
export type MiddlewareFunction = (
    context: MiddlewareContext,
    next: () => Promise<void>
) => Promise<void>;

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
    name: string;
    enabled: boolean;
    priority?: number;
    options?: Record<string, any>;
}

/**
 * Interaction middleware interface
 */
export interface InteractionMiddleware {
    name: string;
    execute: MiddlewareFunction;
    config?: MiddlewareConfig;
}
