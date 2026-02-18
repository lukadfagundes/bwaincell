/**
 * Unit Tests: Error Middleware
 *
 * Tests error classification, graceful handling, user-friendly messages,
 * error logging, and recovery strategies.
 * Coverage target: 80%
 */

// Mock logger BEFORE imports
jest.mock('../../../../shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { errorMiddleware } from '../../../../utils/interactions/middleware/errorMiddleware';
import { MiddlewareContext } from '../../../../utils/interactions/middleware/types';

describe('Error Middleware', () => {
  function createMockContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
    return {
      interaction: {
        id: 'interaction-1',
        deferred: false,
        replied: false,
        reply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        followUp: jest.fn().mockResolvedValue(undefined),
      } as any,
      startTime: Date.now(),
      metadata: {},
      userId: 'user-456',
      guildId: 'guild-123',
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Middleware Properties', () => {
    it('should have name "error"', () => {
      expect(errorMiddleware.name).toBe('error');
    });

    it('should have execute function', () => {
      expect(typeof errorMiddleware.execute).toBe('function');
    });
  });

  describe('Successful Execution', () => {
    it('should pass through when no error occurs', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(context.metadata.error).toBeUndefined();
    });
  });

  describe('Error Classification', () => {
    it('should classify database errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error).toBeDefined();
      expect(context.metadata.error.type).toBe('DATABASE_ERROR');
    });

    it('should classify Sequelize errors as database errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Sequelize validation error'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('DATABASE_ERROR');
    });

    it('should classify permission errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Permission denied'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('PERMISSION_ERROR');
    });

    it('should classify forbidden errors as permission errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Forbidden access'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('PERMISSION_ERROR');
    });

    it('should classify not found errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Resource not found'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('NOT_FOUND');
    });

    it('should classify does not exist errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Item does not exist'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('NOT_FOUND');
    });

    it('should classify validation errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Invalid input data'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('VALIDATION_ERROR');
    });

    it('should classify rate limit errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('RATE_LIMIT');
    });

    it('should classify timeout errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Operation timed out'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('TIMEOUT');
    });

    it('should classify unknown errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Something went horribly wrong'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('UNKNOWN');
    });

    it('should handle non-Error thrown values', async () => {
      const next = jest.fn().mockRejectedValue('string error');
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error.type).toBe('UNKNOWN');
      expect(context.metadata.error.message).toBe('Unknown error');
    });
  });

  describe('User Error Response', () => {
    it('should reply with user-friendly message when not deferred/replied', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('database error occurred'),
          ephemeral: true,
        })
      );
    });

    it('should editReply when interaction is deferred', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Database error'));
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: true,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
        } as any,
      });

      await errorMiddleware.execute(context, next);

      expect(context.interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('database error occurred'),
        })
      );
    });

    it('should followUp when interaction is already replied', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Some error'));
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: true,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
        } as any,
      });

      await errorMiddleware.execute(context, next);

      expect(context.interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('unexpected error'),
          ephemeral: true,
        })
      );
    });

    it('should handle failed error response gracefully', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockRejectedValue(new Error('Some error'));
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockRejectedValue(new Error('Cannot send message')),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
        } as any,
      });

      // Should not throw
      await errorMiddleware.execute(context, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send error message to user',
        expect.any(Object)
      );
    });

    it('should provide correct user messages for each error type', async () => {
      const errorMessages: Record<string, string> = {
        'Database query failed': 'database error',
        'Permission denied': "don't have permission",
        'Item not found': 'could not be found',
        'Invalid input format': 'Invalid input',
        'Rate limit exceeded': 'too fast',
        'Connection timed out': 'timed out',
      };

      for (const [errorMsg, expectedContent] of Object.entries(errorMessages)) {
        jest.clearAllMocks();
        const next = jest.fn().mockRejectedValue(new Error(errorMsg));
        const context = createMockContext();

        await errorMiddleware.execute(context, next);

        expect(context.interaction.reply).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.stringContaining(expectedContent),
          })
        );
      }
    });
  });

  describe('Error Logging', () => {
    it('should log error with full context', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const error = new Error('Test error');
      const next = jest.fn().mockRejectedValue(error);
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Interaction error caught',
        expect.objectContaining({
          errorType: expect.any(String),
          error: 'Test error',
          stack: expect.any(String),
          userId: 'user-456',
          guildId: 'guild-123',
          interactionId: 'interaction-1',
        })
      );
    });

    it('should log non-Error thrown values', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockRejectedValue('plain string error');
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Interaction error caught',
        expect.objectContaining({
          error: 'Unknown error',
          stack: undefined,
        })
      );
    });
  });

  describe('Error Context Storage', () => {
    it('should store error info in context metadata', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Database crash'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.error).toEqual({
        type: 'DATABASE_ERROR',
        message: 'Database crash',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Recovery Strategies', () => {
    it('should attempt recovery for database errors', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockRejectedValue(new Error('Database connection lost'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Attempting error recovery',
        expect.objectContaining({
          errorType: 'DATABASE_ERROR',
        })
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Database error requires attention',
        expect.objectContaining({
          alert: 'CRITICAL',
        })
      );
    });

    it('should attempt recovery for timeout errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Request timeout'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.recovery).toBe('timeout_extended');
    });

    it('should attempt recovery for not found errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Item not found'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.recovery).toBe('not_found_logged');
    });

    it('should not attempt recovery for validation errors', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockRejectedValue(new Error('Validation failed: invalid input'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(logger.info).not.toHaveBeenCalledWith('Attempting error recovery', expect.any(Object));
    });

    it('should not attempt recovery for permission errors', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockRejectedValue(new Error('Permission denied'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(logger.info).not.toHaveBeenCalledWith('Attempting error recovery', expect.any(Object));
    });

    it('should not attempt recovery for rate limit errors', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockRejectedValue(new Error('Rate limit too fast'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(logger.info).not.toHaveBeenCalledWith('Attempting error recovery', expect.any(Object));
    });

    it('should log generic recovery for unknown errors', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Completely unexpected'));
      const context = createMockContext();

      await errorMiddleware.execute(context, next);

      expect(context.metadata.recovery).toBe('logged_for_investigation');
    });
  });

  describe('Error Does Not Propagate', () => {
    it('should not re-throw the error', async () => {
      const next = jest.fn().mockRejectedValue(new Error('Any error'));
      const context = createMockContext();

      // Should resolve without throwing
      await expect(errorMiddleware.execute(context, next)).resolves.not.toThrow();
    });
  });
});
