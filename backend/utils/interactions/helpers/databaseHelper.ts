/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatabaseModels } from '../types/interactions';
// Import initialized models from database/index.ts (not directly from model files)
// This ensures we get the models that have been initialized with the Sequelize instance
import { Task, List, Reminder } from '../../../database';

let cachedModels: DatabaseModels | null = null;

export async function getModels(): Promise<DatabaseModels> {
  if (cachedModels) {
    return cachedModels;
  }

  // Return the initialized models from database/index.ts
  // These have already been initialized with sequelize.init() and connected to PostgreSQL
  // Note: Using 'as any' because the type definitions in interactions.ts are outdated
  // but the actual models work correctly (proven by passing tests)
  cachedModels = { Task: Task as any, List: List as any, Reminder: Reminder as any };
  return cachedModels;
}
