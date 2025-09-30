import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';
import { createLogger } from '../shared/utils/logger';

// Load environment variables
dotenv.config();

// Create logger for database module
const logger = createLogger('Database');

// Import all models
import Task from './models/Task';
import Note from './models/Note';
import Reminder from './models/Reminder';
import Budget from './models/Budget';
import Schedule from './models/Schedule';
import Tracker from './models/Tracker';
import List from './models/List';

// Create Sequelize instance with sqlite3
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DATABASE_PATH || './data/bwaincell.sqlite',
    dialectModule: require('sqlite3'),
    logging: process.env.NODE_ENV === 'development'
        ? (sql: string) => logger.debug('SQL Query', { query: sql })
        : false
});

// Initialize all models
Task.init(sequelize);
Note.init(sequelize);
Reminder.init(sequelize);
Budget.init(sequelize);
Schedule.init(sequelize);
Tracker.init(sequelize);
List.init(sequelize);

// Export sequelize instance and models
export {
    sequelize,
    Task,
    Note,
    Reminder,
    Budget,
    Schedule,
    Tracker,
    List
};

export default sequelize;
