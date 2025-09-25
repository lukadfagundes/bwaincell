import { DatabaseModels } from '../types/interactions';

let cachedModels: DatabaseModels | null = null;

export async function getModels(): Promise<DatabaseModels> {
    if (cachedModels) {
        return cachedModels;
    }

    const TaskModule = require('../../../database/models/Task');
    const ListModule = require('../../../database/models/List');
    const ReminderModule = require('../../../database/models/Reminder');

    // Handle both default and named exports
    const Task = TaskModule.default || TaskModule;
    const List = ListModule.default || ListModule;
    const Reminder = ReminderModule.default || ReminderModule;

    cachedModels = { Task, List, Reminder };
    return cachedModels;
}