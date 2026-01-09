import { Sequelize } from 'sequelize';
import { createLogger } from '../shared/utils/logger';

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

// Validate DATABASE_URL environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for PostgreSQL connection');
}

// Create Sequelize instance with PostgreSQL
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging:
    process.env.NODE_ENV === 'development'
      ? (sql: string) => logger.debug('SQL Query', { query: sql })
      : false,
  pool: {
    max: 10, // Maximum connections in pool
    min: 2, // Minimum connections in pool
    acquire: 30000, // Maximum time (ms) to get connection
    idle: 10000, // Maximum time (ms) connection can be idle
  },
  dialectOptions: {
    // Only use SSL for cloud deployments (Fly.io, Heroku, etc.)
    // Local Pi deployment uses Docker network without SSL
    ssl:
      process.env.NODE_ENV === 'production' && process.env.DEPLOYMENT_MODE !== 'pi'
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
  define: {
    timestamps: true,
    underscored: true, // Use snake_case for columns
    freezeTableName: true,
  },
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
