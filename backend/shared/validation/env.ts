import Joi from 'joi';
import { EnvironmentError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Environment variable validation for Bwaincell bot
 *
 * Environment variables are loaded by:
 * - Development: dotenv-cli wrapper in package.json scripts
 * - Production: docker-compose env_file directive
 */

/**
 * Environment variable schema
 */
const envSchema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  // Discord configuration
  BOT_TOKEN: Joi.string().required().description('Discord bot token'),

  CLIENT_ID: Joi.string().required().description('Discord application client ID'),

  GUILD_ID: Joi.string().optional().description('Discord guild ID for development'),

  // Database configuration
  DATABASE_PATH: Joi.string()
    .default('./data/bwaincell.sqlite')
    .description('Path to SQLite database file'),

  // Logging configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info')
    .description('Winston logging level'),

  // Optional: Google API credentials
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string()
    .optional()
    .description('Path to Google service account credentials'),

  // Optional: Port for health check endpoint
  HEALTH_CHECK_PORT: Joi.number()
    .port()
    .optional()
    .default(3000)
    .description('Port for health check endpoint'),

  // GitHub API configuration (for /issues command)
  GITHUB_TOKEN: Joi.string().optional().description('GitHub personal access token with repo scope'),

  GITHUB_REPO_OWNER: Joi.string().optional().description('GitHub repository owner username'),

  GITHUB_REPO_NAME: Joi.string().optional().description('GitHub repository name'),
}).unknown(); // Allow other env vars

/**
 * Validated environment variables
 */
export interface ValidatedEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  BOT_TOKEN: string;
  CLIENT_ID: string;
  GUILD_ID?: string;
  DATABASE_PATH: string;
  LOG_LEVEL: string;
  GOOGLE_APPLICATION_CREDENTIALS?: string;
  HEALTH_CHECK_PORT: number;
  GITHUB_TOKEN?: string;
  GITHUB_REPO_OWNER?: string;
  GITHUB_REPO_NAME?: string;
}

/**
 * Validate environment variables
 * @throws {EnvironmentError} If validation fails
 */
export function validateEnv(): ValidatedEnvironment {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false, // Get all errors at once
  });

  if (error) {
    const missingVars = error.details
      .filter((detail) => detail.type === 'any.required')
      .map((detail) => detail.path.join('.'));

    const errorMessage = `Environment validation failed: ${error.message}`;

    logger.error('Environment validation error', {
      errors: error.details.map((detail) => ({
        path: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      })),
      missingVariables: missingVars,
    });

    throw new EnvironmentError(errorMessage, missingVars);
  }

  logger.info('Environment validation successful', {
    nodeEnv: value.NODE_ENV,
    logLevel: value.LOG_LEVEL,
    hasGuildId: !!value.GUILD_ID,
    hasGoogleCreds: !!value.GOOGLE_APPLICATION_CREDENTIALS,
  });

  return value as ValidatedEnvironment;
}

/**
 * Get validated environment variable
 * @param key - Environment variable key
 * @returns The validated value or undefined
 */
export function getEnv<K extends keyof ValidatedEnvironment>(key: K): ValidatedEnvironment[K] {
  const env = validateEnv();
  return env[key];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv('NODE_ENV') === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv('NODE_ENV') === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnv('NODE_ENV') === 'test';
}
