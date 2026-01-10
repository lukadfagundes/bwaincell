// Database Entity Type Definitions for Bwaincell Discord Bot

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: number;
  user_id: string;
  guild_id: string;
  created_at?: Date;
}

/**
 * Task entity for task management
 */
export interface Task extends BaseEntity {
  description: string;
  due_date?: Date | null;
  completed: boolean;
  completed_at?: Date | null;
}

/**
 * List entity for user lists
 */
export interface List extends BaseEntity {
  name: string;
  items: string[];
}

/**
 * Reminder frequency types
 */
export type ReminderFrequency = 'once' | 'daily' | 'weekly';

/**
 * Reminder entity for scheduled reminders
 */
export interface Reminder extends BaseEntity {
  message: string;
  time: string; // TIME format
  frequency: ReminderFrequency;
  day_of_week?: number | null; // 0-6 for weekly
  channel_id: string;
  active: boolean;
  next_trigger?: Date | null;
}

/**
 * Schedule entity for event scheduling
 */
export interface Schedule extends BaseEntity {
  event: string;
  date: string; // DATEONLY format
  time: string; // TIME format
  description?: string | null;
}

/**
 * Budget transaction types
 */
export type BudgetType = 'expense' | 'income';

/**
 * Budget entity for financial tracking
 */
export interface Budget extends Omit<BaseEntity, 'created_at'> {
  type: BudgetType;
  category?: string | null;
  amount: number;
  description?: string | null;
  date: Date;
}

/**
 * Note entity for note-taking
 */
export interface Note extends BaseEntity {
  title: string;
  content: string;
  tags: string[];
  updated_at: Date;
}

/**
 * Query filter options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * User-Guild scope for queries
 */
export interface UserGuildScope {
  user_id: string;
  guild_id: string;
}
