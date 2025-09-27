/**
 * Custom error classes for Bwaincell bot
 */

/**
 * Base error class for all custom errors
 */
export class BwaincellError extends Error {
  public readonly timestamp: Date;
  public readonly context?: any;

  constructor(message: string, context?: any) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a database operation fails
 */
export class DatabaseError extends BwaincellError {
  public readonly operation: string;
  public readonly table?: string;

  constructor(message: string, operation: string, table?: string, context?: any) {
    super(message, context);
    this.operation = operation;
    this.table = table;
  }
}

/**
 * Error thrown when a Discord API operation fails
 */
export class DiscordAPIError extends BwaincellError {
  public readonly code?: number;
  public readonly method?: string;

  constructor(message: string, code?: number, method?: string, context?: any) {
    super(message, context);
    this.code = code;
    this.method = method;
  }
}

/**
 * Error thrown when command validation fails
 */
export class CommandValidationError extends BwaincellError {
  public readonly commandName: string;
  public readonly field?: string;

  constructor(message: string, commandName: string, field?: string, context?: any) {
    super(message, context);
    this.commandName = commandName;
    this.field = field;
  }
}

/**
 * Error thrown when permission check fails
 */
export class PermissionError extends BwaincellError {
  public readonly requiredPermission: string;
  public readonly userId: string;

  constructor(message: string, requiredPermission: string, userId: string, context?: any) {
    super(message, context);
    this.requiredPermission = requiredPermission;
    this.userId = userId;
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends BwaincellError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number, context?: any) {
    super(message, context);
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when environment validation fails
 */
export class EnvironmentError extends BwaincellError {
  public readonly missingVariables?: string[];

  constructor(message: string, missingVariables?: string[], context?: any) {
    super(message, context);
    this.missingVariables = missingVariables;
  }
}

/**
 * Type guard to check if error is a BwaincellError
 */
export const isBwaincellError = (error: any): error is BwaincellError => {
  return error instanceof BwaincellError;
};

/**
 * Type guard to check if error is a specific BwaincellError type
 */
export const isErrorType = <T extends BwaincellError>(
  error: any,
  errorClass: new (...args: any[]) => T
): error is T => {
  return error instanceof errorClass;
};
