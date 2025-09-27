import winston from 'winston';
import path from 'path';

/**
 * Winston logger configuration for Bwaincell bot
 * Replaces all console.log/error/warn/debug statements
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey'
};

winston.addColors(colors);

// Create custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: customFormat,
  defaultMeta: { service: 'bwaincell-bot' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport for non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'debug'
  }));
}

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Export main logger
export { logger };

// Utility functions for common logging patterns
export const logCommandExecution = (commandName: string, userId: string, guildId: string) => {
  logger.info('Command executed', {
    command: commandName,
    userId,
    guildId,
    timestamp: new Date().toISOString()
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

export const logDatabaseOperation = (operation: string, table: string, duration: number) => {
  logger.debug('Database operation', {
    operation,
    table,
    duration,
    timestamp: new Date().toISOString()
  });
};

export const logBotEvent = (event: string, details?: any) => {
  logger.info('Bot event', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

// Export log levels for external use
export { levels as LogLevels };
