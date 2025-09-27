/**
 * @module MiddlewareConfiguration
 * @description Configuration management for the middleware system
 */

/**
 * Logging middleware configuration
 */
export interface LoggingConfig {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    slowInteractionThreshold: number;
    logUserIds: boolean;
    logRequestBodies: boolean;
}

/**
 * Rate limiting middleware configuration
 */
export interface RateLimitConfig {
    perUser: number;
    perGuild: number;
    windowMs: number;
    skipSuccessful: boolean;
    customLimits: {
        [key: string]: {
            maxRequests: number;
            windowMs: number;
        };
    };
}

/**
 * Validation middleware configuration
 */
export interface ValidationConfig {
    maxLength: number;
    allowEmptyStrings: boolean;
    sanitizeHtml: boolean;
    customPatterns: {
        [key: string]: RegExp;
    };
}

/**
 * Error middleware configuration
 */
export interface ErrorConfig {
    reportCriticalErrors: boolean;
    enableRecovery: boolean;
    userFriendlyMessages: boolean;
    retryAttempts: number;
}

/**
 * Complete middleware configuration interface
 */
export interface MiddlewareConfig {
    logging: LoggingConfig;
    rateLimit: RateLimitConfig;
    validation: ValidationConfig;
    error: ErrorConfig;
}

/**
 * Default middleware configuration
 */
export const defaultMiddlewareConfig: MiddlewareConfig = {
    logging: {
        enabled: process.env.NODE_ENV !== 'test',
        logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
        slowInteractionThreshold: parseInt(process.env.SLOW_INTERACTION_THRESHOLD || '2000'),
        logUserIds: process.env.NODE_ENV !== 'production',
        logRequestBodies: process.env.NODE_ENV === 'development'
    },
    rateLimit: {
        perUser: parseInt(process.env.RATE_LIMIT_PER_USER || '10'),
        perGuild: parseInt(process.env.RATE_LIMIT_PER_GUILD || '50'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        skipSuccessful: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
        customLimits: {
            task_create: {
                maxRequests: 5,
                windowMs: 60000
            },
            list_modify: {
                maxRequests: 20,
                windowMs: 60000
            },
            command: {
                maxRequests: 15,
                windowMs: 60000
            }
        }
    },
    validation: {
        maxLength: parseInt(process.env.VALIDATION_MAX_LENGTH || '2000'),
        allowEmptyStrings: process.env.VALIDATION_ALLOW_EMPTY === 'true',
        sanitizeHtml: process.env.VALIDATION_SANITIZE_HTML !== 'false',
        customPatterns: {
            // Custom validation patterns can be added here
        }
    },
    error: {
        reportCriticalErrors: process.env.NODE_ENV === 'production',
        enableRecovery: process.env.ERROR_RECOVERY_ENABLED !== 'false',
        userFriendlyMessages: true,
        retryAttempts: parseInt(process.env.ERROR_RETRY_ATTEMPTS || '3')
    }
};

/**
 * Environment-specific configuration overrides
 */
export const getEnvironmentConfig = (): Partial<MiddlewareConfig> => {
    const env = process.env.NODE_ENV || 'development';

    switch (env) {
        case 'production':
            return {
                logging: {
                    ...defaultMiddlewareConfig.logging,
                    logLevel: 'warn',
                    logUserIds: false,
                    logRequestBodies: false
                },
                rateLimit: {
                    ...defaultMiddlewareConfig.rateLimit,
                    perUser: 20,
                    perGuild: 100
                },
                error: {
                    ...defaultMiddlewareConfig.error,
                    reportCriticalErrors: true
                }
            };

        case 'staging':
            return {
                logging: {
                    ...defaultMiddlewareConfig.logging,
                    logLevel: 'info'
                },
                rateLimit: {
                    ...defaultMiddlewareConfig.rateLimit,
                    perUser: 15,
                    perGuild: 75
                }
            };

        case 'test':
            return {
                logging: {
                    ...defaultMiddlewareConfig.logging,
                    enabled: false
                },
                rateLimit: {
                    ...defaultMiddlewareConfig.rateLimit,
                    perUser: 1000, // High limits for testing
                    perGuild: 1000
                }
            };

        default: // development
            return {
                logging: {
                    ...defaultMiddlewareConfig.logging,
                    logLevel: 'debug',
                    logUserIds: true,
                    logRequestBodies: true
                }
            };
    }
};

/**
 * Get the final middleware configuration with environment overrides
 */
export const getMiddlewareConfig = (): MiddlewareConfig => {
    const envConfig = getEnvironmentConfig();

    return {
        logging: { ...defaultMiddlewareConfig.logging, ...envConfig.logging },
        rateLimit: { ...defaultMiddlewareConfig.rateLimit, ...envConfig.rateLimit },
        validation: { ...defaultMiddlewareConfig.validation, ...envConfig.validation },
        error: { ...defaultMiddlewareConfig.error, ...envConfig.error }
    };
};

/**
 * Validate middleware configuration
 */
export const validateMiddlewareConfig = (config: MiddlewareConfig): boolean => {
    // Validate logging config
    if (config.logging.slowInteractionThreshold <= 0) {
        throw new Error('slowInteractionThreshold must be greater than 0');
    }

    // Validate rate limit config
    if (config.rateLimit.perUser <= 0 || config.rateLimit.perGuild <= 0) {
        throw new Error('Rate limits must be greater than 0');
    }

    if (config.rateLimit.windowMs <= 0) {
        throw new Error('Rate limit window must be greater than 0');
    }

    // Validate validation config
    if (config.validation.maxLength <= 0) {
        throw new Error('maxLength must be greater than 0');
    }

    // Validate error config
    if (config.error.retryAttempts < 0) {
        throw new Error('retryAttempts cannot be negative');
    }

    return true;
};

/**
 * Export the active configuration
 */
export const middlewareConfig = getMiddlewareConfig();

// Validate the configuration on module load
validateMiddlewareConfig(middlewareConfig);
