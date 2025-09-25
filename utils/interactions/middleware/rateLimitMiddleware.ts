/**
 * @module RateLimitMiddleware
 * @description Middleware for rate limiting user interactions to prevent spam
 */

import { logger } from '@shared/utils/logger';
import { InteractionMiddleware, MiddlewareContext } from './types';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    message?: string;
}

/**
 * User rate limit tracking
 */
interface UserRateLimit {
    count: number;
    resetTime: number;
}

/**
 * Rate limit storage
 */
class RateLimitStore {
    private limits = new Map<string, UserRateLimit>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Check if user is rate limited
     */
    isLimited(key: string, config: RateLimitConfig): boolean {
        const now = Date.now();
        const limit = this.limits.get(key);

        if (!limit || now > limit.resetTime) {
            // Create new limit window
            this.limits.set(key, {
                count: 1,
                resetTime: now + config.windowMs
            });
            return false;
        }

        // Increment counter
        limit.count++;

        // Check if exceeded
        return limit.count > config.maxRequests;
    }

    /**
     * Get remaining requests for a user
     */
    getRemaining(key: string, config: RateLimitConfig): number {
        const limit = this.limits.get(key);
        if (!limit || Date.now() > limit.resetTime) {
            return config.maxRequests;
        }
        return Math.max(0, config.maxRequests - limit.count);
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, limit] of this.limits) {
            if (now > limit.resetTime) {
                this.limits.delete(key);
            }
        }
    }

    /**
     * Clear all limits
     */
    clear(): void {
        this.limits.clear();
    }

    /**
     * Destroy the store
     */
    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

// Default rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
    // General interaction limit
    general: {
        maxRequests: 10,
        windowMs: 60000, // 10 requests per minute
        message: 'You are sending requests too quickly. Please wait a moment.'
    },
    // Task creation limit
    task_create: {
        maxRequests: 5,
        windowMs: 60000, // 5 tasks per minute
        message: 'You can only create 5 tasks per minute. Please wait.'
    },
    // List modification limit
    list_modify: {
        maxRequests: 20,
        windowMs: 60000, // 20 list operations per minute
        message: 'Too many list operations. Please wait a moment.'
    },
    // Command execution limit
    command: {
        maxRequests: 15,
        windowMs: 60000, // 15 commands per minute
        message: 'Too many commands. Please slow down.'
    }
};

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware: InteractionMiddleware = {
    name: 'rateLimit',
    execute: async (context: MiddlewareContext, next: () => Promise<void>) => {
        const { interaction, userId, guildId } = context;

        // Determine rate limit category
        const category = getRateLimitCategory(interaction);
        const config = RATE_LIMITS[category] || RATE_LIMITS.general;

        // Create rate limit key (user + guild)
        const key = `${userId}:${guildId || 'dm'}:${category}`;

        // Check if rate limited
        if (rateLimitStore.isLimited(key, config)) {
            logger.warn('Rate limit exceeded', {
                userId,
                guildId,
                category,
                remaining: 0
            });

            // Send rate limit message
            if ('reply' in interaction && typeof interaction.reply === 'function') {
                try {
                    await interaction.reply({
                        content: `⏱️ ${config.message}`,
                        ephemeral: true
                    });
                } catch {
                    // Interaction might already be replied to
                    if ('followUp' in interaction && typeof interaction.followUp === 'function') {
                        await interaction.followUp({
                            content: `⏱️ ${config.message}`,
                            ephemeral: true
                        });
                    }
                }
            }

            return; // Don't continue the chain
        }

        // Log rate limit status
        const remaining = rateLimitStore.getRemaining(key, config);
        if (remaining < 3) {
            logger.info('User approaching rate limit', {
                userId,
                guildId,
                category,
                remaining
            });
        }

        // Store rate limit info in context
        context.metadata.rateLimit = {
            category,
            remaining,
            limit: config.maxRequests
        };

        // Continue to next middleware
        await next();
    }
};

/**
 * Determine rate limit category based on interaction type
 */
function getRateLimitCategory(interaction: any): string {
    // Check for command interactions
    if ('commandName' in interaction && interaction.commandName) {
        return 'command';
    }

    // Check for button interactions
    if ('customId' in interaction && interaction.customId) {
        const customId = interaction.customId;
        if (customId.startsWith('task_add') || customId.includes('task_create')) {
            return 'task_create';
        }
        if (customId.startsWith('list_')) {
            return 'list_modify';
        }
    }

    return 'general';
}

/**
 * Export rate limit store for testing/management
 */
export { rateLimitStore };