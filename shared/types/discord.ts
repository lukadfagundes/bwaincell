// Discord-specific Type Definitions

import { CommandInteraction, ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  ephemeral?: boolean;
}

/**
 * Interaction types for the bot
 */
export type BotInteraction =
  | CommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction
  | StringSelectMenuInteraction;

/**
 * Command metadata
 */
export interface CommandMetadata {
  name: string;
  description: string;
  category: string;
  cooldown?: number;
  guildOnly?: boolean;
  permissions?: string[];
}

/**
 * Interaction handler response
 */
export interface InteractionResponse {
  handled: boolean;
  error?: Error;
}

/**
 * Bot configuration
 */
export interface BotConfig {
  token: string;
  clientId: string;
  guildId?: string;
  databaseUrl: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Pagination options for embeds
 */
export interface PaginationOptions {
  page: number;
  perPage: number;
  total: number;
}
