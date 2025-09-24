import { ChatInputCommandInteraction } from 'discord.js';

// Command Types
export interface CommandData {
  data: any;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Database Types (prepare for model conversion)
export interface UserAttributes {
  id: string;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskAttributes {
  id: number;
  userId: string;
  description: string;
  completed: boolean;
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NoteAttributes {
  id: number;
  userId: string;
  guildId: string;
  title: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReminderAttributes {
  id: number;
  userId: string;
  guildId: string;
  channelId: string;
  message: string;
  time: Date;
  frequency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Add more model attributes as needed