import {
    ButtonInteraction,
    StringSelectMenuInteraction,
    ModalSubmitInteraction,
    CacheType,
    Collection,
    ChatInputCommandInteraction,
    AutocompleteInteraction
} from 'discord.js';

// Database Model Interfaces
export interface TaskModel {
    id: number;
    description: string;
    due_date?: Date;
    completed: boolean;
    user_id: string;
    guild_id: string;
}

export interface ListModel {
    id: number;
    name: string;
    items: Array<{ text: string; completed: boolean }>;
    user_id: string;
    guild_id: string;
    save(): Promise<void>;
}

// Database Operations Interfaces
export interface TaskOperations {
    getUserTasks(userId: string, guildId: string, status?: string): Promise<TaskModel[]>;
    completeTask(taskId: number, userId: string, guildId: string): Promise<TaskModel | null>;
    findOne(options: any): Promise<TaskModel | null>;
    createTask(userId: string, guildId: string, description: string, dueDate?: Date): Promise<TaskModel>;
    editTask(taskId: number, userId: string, guildId: string, description: string): Promise<TaskModel | null>;
    deleteTask(taskId: number, userId: string, guildId: string): Promise<boolean>;
}

export interface ListOperations {
    findOne(options: any): Promise<ListModel | null>;
    createList(userId: string, guildId: string, name: string): Promise<ListModel>;
    addItem(userId: string, guildId: string, listName: string, item: string): Promise<boolean>;
}

export interface ReminderOperations {
    deleteReminder(reminderId: number, userId: string, guildId: string): Promise<boolean>;
}

export interface DatabaseModels {
    Task: TaskOperations;
    List: ListOperations;
    Reminder: ReminderOperations;
}

// Command Interface
export interface CommandWithExecute {
    data: any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

// Handler Types
export type ButtonHandler = (interaction: ButtonInteraction<CacheType>) => Promise<void>;
export type SelectMenuHandler = (interaction: StringSelectMenuInteraction<CacheType>) => Promise<void>;
export type ModalHandler = (interaction: ModalSubmitInteraction<CacheType>) => Promise<void>;

// Extend Discord.js Client
declare module 'discord.js' {
    interface Client {
        commands: Collection<string, CommandWithExecute>;
    }
}
