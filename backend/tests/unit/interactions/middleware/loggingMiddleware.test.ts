/**
 * Unit Tests: Logging Middleware
 *
 * Tests interaction logging, metadata capture, timing information,
 * slow interaction warnings, and error logging.
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

import { loggingMiddleware } from '../../../../utils/interactions/middleware/loggingMiddleware';
import { MiddlewareContext } from '../../../../utils/interactions/middleware/types';

describe('Logging Middleware', () => {
  function createMockContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
    return {
      interaction: {
        id: 'interaction-1',
        isButton: jest.fn().mockReturnValue(true),
        isStringSelectMenu: jest.fn().mockReturnValue(false),
        isModalSubmit: jest.fn().mockReturnValue(false),
        isCommand: jest.fn().mockReturnValue(false),
        isAutocomplete: jest.fn().mockReturnValue(false),
        customId: 'task_done_1',
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
    it('should have name "logging"', () => {
      expect(loggingMiddleware.name).toBe('logging');
    });

    it('should have execute function', () => {
      expect(typeof loggingMiddleware.execute).toBe('function');
    });
  });

  describe('Interaction Logging', () => {
    it('should log interaction start with metadata', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext();

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({
          type: 'button',
          userId: 'user-456',
          guildId: 'guild-123',
          customId: 'task_done_1',
        })
      );
    });

    it('should log interaction completion with duration', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext();

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction completed',
        expect.objectContaining({
          type: 'button',
          userId: 'user-456',
          guildId: 'guild-123',
          duration: expect.stringMatching(/^\d+ms$/),
          success: true,
        })
      );
    });

    it('should store duration in context metadata', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext();

      await loggingMiddleware.execute(context, next);

      expect(context.metadata.duration).toBeDefined();
      expect(typeof context.metadata.duration).toBe('number');
      expect(context.metadata.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Interaction Type Detection', () => {
    it('should identify button interactions', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          isButton: jest.fn().mockReturnValue(true),
          isStringSelectMenu: jest.fn().mockReturnValue(false),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isCommand: jest.fn().mockReturnValue(false),
          isAutocomplete: jest.fn().mockReturnValue(false),
          customId: 'task_done_1',
        } as any,
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({ type: 'button' })
      );
    });

    it('should identify select menu interactions', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          isButton: jest.fn().mockReturnValue(false),
          isStringSelectMenu: jest.fn().mockReturnValue(true),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isCommand: jest.fn().mockReturnValue(false),
          isAutocomplete: jest.fn().mockReturnValue(false),
          customId: 'task_quick_action',
        } as any,
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({ type: 'selectMenu' })
      );
    });

    it('should identify modal interactions', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          isButton: jest.fn().mockReturnValue(false),
          isStringSelectMenu: jest.fn().mockReturnValue(false),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isCommand: jest.fn().mockReturnValue(false),
          isAutocomplete: jest.fn().mockReturnValue(false),
          customId: 'task_add_modal',
        } as any,
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({ type: 'modal' })
      );
    });

    it('should identify command interactions', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          isButton: jest.fn().mockReturnValue(false),
          isStringSelectMenu: jest.fn().mockReturnValue(false),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          commandName: 'task',
        } as any,
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({
          type: 'command',
          commandName: 'task',
        })
      );
    });

    it('should identify autocomplete interactions', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          isButton: jest.fn().mockReturnValue(false),
          isStringSelectMenu: jest.fn().mockReturnValue(false),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isCommand: jest.fn().mockReturnValue(false),
          isAutocomplete: jest.fn().mockReturnValue(true),
        } as any,
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({ type: 'autocomplete' })
      );
    });

    it('should identify unknown interaction types', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          isButton: jest.fn().mockReturnValue(false),
          isStringSelectMenu: jest.fn().mockReturnValue(false),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isCommand: jest.fn().mockReturnValue(false),
          isAutocomplete: jest.fn().mockReturnValue(false),
        } as any,
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({ type: 'unknown' })
      );
    });
  });

  describe('User/Guild Context Capture', () => {
    it('should log userId and guildId', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        userId: 'special-user-789',
        guildId: 'special-guild-321',
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({
          userId: 'special-user-789',
          guildId: 'special-guild-321',
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction completed',
        expect.objectContaining({
          userId: 'special-user-789',
          guildId: 'special-guild-321',
        })
      );
    });

    it('should log customId for button interactions', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          isButton: jest.fn().mockReturnValue(true),
          isStringSelectMenu: jest.fn().mockReturnValue(false),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isCommand: jest.fn().mockReturnValue(false),
          isAutocomplete: jest.fn().mockReturnValue(false),
          customId: 'task_delete_42',
        } as any,
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({
          customId: 'task_delete_42',
        })
      );
    });

    it('should log commandName for command interactions', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          isButton: jest.fn().mockReturnValue(false),
          isStringSelectMenu: jest.fn().mockReturnValue(false),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isCommand: jest.fn().mockReturnValue(true),
          isAutocomplete: jest.fn().mockReturnValue(false),
          commandName: 'remind',
        } as any,
      });

      await loggingMiddleware.execute(context, next);

      expect(logger.info).toHaveBeenCalledWith(
        'Interaction started',
        expect.objectContaining({
          commandName: 'remind',
        })
      );
    });
  });

  describe('Slow Interaction Warnings', () => {
    it('should warn for slow interactions (>2000ms)', async () => {
      const { logger } = require('../../../../shared/utils/logger');

      // Simulate a slow handler
      const next = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2100));
      });

      const context = createMockContext();

      await loggingMiddleware.execute(context, next);

      expect(logger.warn).toHaveBeenCalledWith(
        'Slow interaction detected',
        expect.objectContaining({
          type: 'button',
          userId: 'user-456',
          guildId: 'guild-123',
        })
      );
    }, 10000);

    it('should not warn for fast interactions', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext();

      await loggingMiddleware.execute(context, next);

      expect(logger.warn).not.toHaveBeenCalledWith('Slow interaction detected', expect.any(Object));
    });
  });

  describe('Error Logging', () => {
    it('should log errors with duration and stack trace', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const error = new Error('Handler failed');
      const next = jest.fn().mockRejectedValue(error);
      const context = createMockContext();

      await expect(loggingMiddleware.execute(context, next)).rejects.toThrow('Handler failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Interaction failed',
        expect.objectContaining({
          type: 'button',
          userId: 'user-456',
          guildId: 'guild-123',
          duration: expect.stringMatching(/^\d+ms$/),
          error: 'Handler failed',
          stack: expect.any(String),
        })
      );
    });

    it('should re-throw errors for error middleware to handle', async () => {
      const error = new Error('Critical failure');
      const next = jest.fn().mockRejectedValue(error);
      const context = createMockContext();

      await expect(loggingMiddleware.execute(context, next)).rejects.toThrow('Critical failure');
    });

    it('should handle non-Error thrown values in error logging', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockRejectedValue('string error');
      const context = createMockContext();

      await expect(loggingMiddleware.execute(context, next)).rejects.toBe('string error');

      expect(logger.error).toHaveBeenCalledWith(
        'Interaction failed',
        expect.objectContaining({
          error: 'Unknown error',
          stack: undefined,
        })
      );
    });
  });

  describe('Next Handler Execution', () => {
    it('should call next exactly once', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext();

      await loggingMiddleware.execute(context, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
