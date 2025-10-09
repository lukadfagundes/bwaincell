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
import List from './models/List';
import { User } from './models/User';

// Create Sequelize instance with sqlite3
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_PATH || './data/bwaincell.sqlite',
  logging:
    process.env.NODE_ENV === 'development'
      ? (sql: string) => logger.debug('SQL Query', { query: sql })
      : false,
});

// Initialize all models
Task.init(sequelize);
Note.init(sequelize);
Reminder.init(sequelize);
Budget.init(sequelize);
Schedule.init(sequelize);
List.init(sequelize);
User.init(sequelize);

// Export sequelize instance and models
export { sequelize, Task, Note, Reminder, Budget, Schedule, List, User };

export default sequelize;
