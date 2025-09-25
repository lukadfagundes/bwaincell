/**
 * @module ValidationMiddleware
 * @description Middleware for validating and sanitizing interaction inputs
 */

import { logger } from '@shared/utils/logger';
import { InteractionMiddleware, MiddlewareContext } from './types';

/**
 * Input validation patterns
 */
const VALIDATION_PATTERNS = {
    // Prevent SQL injection patterns
    SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE)\b)/gi,
    // Prevent script injection
    SCRIPT_INJECTION: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    // Valid date format
    DATE_FORMAT: /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2})?$/,
    // Maximum lengths
    MAX_TASK_LENGTH: 200,
    MAX_LIST_NAME_LENGTH: 50,
    MAX_LIST_ITEM_LENGTH: 100,
    MAX_REMINDER_LENGTH: 200
};

/**
 * Validation middleware that sanitizes and validates all inputs
 */
export const validationMiddleware: InteractionMiddleware = {
    name: 'validation',
    execute: async (context: MiddlewareContext, next: () => Promise<void>) => {
        const { interaction, userId, guildId } = context;

        try {
            // Validate guild context for guild-only commands
            if (!guildId && requiresGuild(interaction)) {
                logger.warn('Guild validation failed', { userId, interactionId: interaction.id });
                if ('reply' in interaction && typeof interaction.reply === 'function') {
                    await interaction.reply({
                        content: '❌ This command can only be used in a server.',
                        ephemeral: true
                    });
                }
                return; // Don't continue the chain
            }

            // Validate modal inputs
            if ('isModalSubmit' in interaction && interaction.isModalSubmit()) {
                validateModalInputs(interaction, context);
            }

            // Validate command options
            if ('options' in interaction && interaction.options) {
                validateCommandOptions(interaction, context);
            }

            // Proceed to next middleware
            await next();

        } catch (validationError) {
            logger.error('Validation error', {
                error: validationError instanceof Error ? validationError.message : 'Unknown error',
                userId,
                guildId
            });

            // Send user-friendly error message
            if ('followUp' in interaction && typeof interaction.followUp === 'function') {
                await interaction.followUp({
                    content: '❌ Invalid input detected. Please check your input and try again.',
                    ephemeral: true
                });
            }
        }
    }
};

/**
 * Check if interaction requires guild context
 */
function requiresGuild(_interaction: any): boolean {
    // All our bot commands require guild context
    return true;
}

/**
 * Validate modal input fields
 */
function validateModalInputs(interaction: any, _context: MiddlewareContext): void {
    const fields = interaction.fields;

    // Check task description
    if (fields.getTextInputValue('task_description')) {
        const description = fields.getTextInputValue('task_description');
        validateTextInput(description, 'task_description', VALIDATION_PATTERNS.MAX_TASK_LENGTH);
    }

    // Check due date format
    if (fields.getTextInputValue('task_due_date')) {
        const dueDate = fields.getTextInputValue('task_due_date');
        if (dueDate.trim() && !VALIDATION_PATTERNS.DATE_FORMAT.test(dueDate)) {
            throw new Error('Invalid date format. Use YYYY-MM-DD HH:MM');
        }
    }

    // Check list item
    if (fields.getTextInputValue('list_item')) {
        const item = fields.getTextInputValue('list_item');
        validateTextInput(item, 'list_item', VALIDATION_PATTERNS.MAX_LIST_ITEM_LENGTH);
    }
}

/**
 * Validate command options
 */
function validateCommandOptions(interaction: any, _context: MiddlewareContext): void {
    if (!interaction.options) return;

    // Validate string options
    const stringOptions = ['description', 'list_name', 'item', 'message'];
    stringOptions.forEach(optionName => {
        const value = interaction.options.getString?.(optionName);
        if (value) {
            validateTextInput(value, optionName, 200);
        }
    });
}

/**
 * Validate text input for security and length
 */
function validateTextInput(input: string, fieldName: string, maxLength: number): void {
    // Check for SQL injection
    if (VALIDATION_PATTERNS.SQL_INJECTION.test(input)) {
        logger.warn('SQL injection attempt detected', { fieldName, input });
        throw new Error('Invalid characters detected in input');
    }

    // Check for script injection
    if (VALIDATION_PATTERNS.SCRIPT_INJECTION.test(input)) {
        logger.warn('Script injection attempt detected', { fieldName, input });
        throw new Error('Invalid HTML/Script tags detected');
    }

    // Check length
    if (input.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
    }

    // Check for empty input
    if (input.trim().length === 0) {
        throw new Error(`${fieldName} cannot be empty`);
    }
}