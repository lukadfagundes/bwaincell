/**
 * Unit Tests: Validation Middleware
 *
 * Tests input validation, sanitization, guild-only enforcement,
 * SQL injection detection, script injection detection, and length limits.
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

import { validationMiddleware } from '../../../../utils/interactions/middleware/validationMiddleware';
import { MiddlewareContext } from '../../../../utils/interactions/middleware/types';

describe('Validation Middleware', () => {
  function createMockContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
    return {
      interaction: {
        id: 'interaction-1',
        deferred: false,
        replied: false,
        reply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
        followUp: jest.fn().mockResolvedValue(undefined),
        isModalSubmit: jest.fn().mockReturnValue(false),
        isChatInputCommand: jest.fn().mockReturnValue(false),
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
    it('should have name "validation"', () => {
      expect(validationMiddleware.name).toBe('validation');
    });

    it('should have execute function', () => {
      expect(typeof validationMiddleware.execute).toBe('function');
    });
  });

  describe('Valid Interaction Passes Through', () => {
    it('should call next for valid interaction with guild', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext();

      await validationMiddleware.execute(context, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Guild-Only Validation', () => {
    it('should reject non-guild interactions (not command)', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        guildId: undefined,
      });

      await validationMiddleware.execute(context, next);

      expect(next).not.toHaveBeenCalled();
      expect(context.interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('can only be used in a server'),
          ephemeral: true,
        })
      );
    });

    it('should pass through commands for their own guild validation', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        guildId: undefined,
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isChatInputCommand: jest.fn().mockReturnValue(true),
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should not reply when already deferred/replied', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        guildId: undefined,
        interaction: {
          id: 'int-1',
          deferred: true,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isChatInputCommand: jest.fn().mockReturnValue(false),
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(next).not.toHaveBeenCalled();
      expect(context.interaction.reply).not.toHaveBeenCalled();
    });
  });

  describe('Modal Input Validation', () => {
    it('should validate modal inputs and pass through for valid input', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          fields: {
            getTextInputValue: jest.fn((id: string) => {
              if (id === 'task_description') return 'Valid task description';
              if (id === 'task_due_date') return '';
              if (id === 'list_item') return '';
              return '';
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should reject SQL injection in task description', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          fields: {
            getTextInputValue: jest.fn((id: string) => {
              if (id === 'task_description') return 'SELECT * FROM users; DROP TABLE tasks;';
              return '';
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      // The validation should throw an error, which triggers the catch block
      expect(context.interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Invalid input detected'),
          ephemeral: true,
        })
      );
    });

    it('should reject script injection in task description', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          fields: {
            getTextInputValue: jest.fn((id: string) => {
              if (id === 'task_description') return '<script>alert("xss")</script>';
              return '';
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(context.interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Invalid input detected'),
          ephemeral: true,
        })
      );
    });

    it('should reject SQL injection in list item', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          fields: {
            getTextInputValue: jest.fn((id: string) => {
              if (id === 'task_description') return '';
              if (id === 'task_due_date') return '';
              if (id === 'list_item') return 'DELETE FROM lists WHERE 1=1';
              return '';
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(context.interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Invalid input detected'),
        })
      );
    });

    it('should allow valid date format', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          fields: {
            getTextInputValue: jest.fn((id: string) => {
              if (id === 'task_description') return '';
              if (id === 'task_due_date') return '2026-03-15 14:30';
              if (id === 'list_item') return '';
              return '';
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid date format', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          fields: {
            getTextInputValue: jest.fn((id: string) => {
              if (id === 'task_description') return '';
              if (id === 'task_due_date') return 'tomorrow at noon';
              if (id === 'list_item') return '';
              return '';
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(context.interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Invalid input detected'),
        })
      );
    });
  });

  describe('Command Options Validation', () => {
    it('should validate command string options', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          options: {
            getString: jest.fn().mockReturnValue('Valid description'),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should reject SQL injection in command options', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          options: {
            getString: jest.fn((optionName: string) => {
              if (optionName === 'description') return 'DROP TABLE tasks';
              return null;
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(context.interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Invalid input detected'),
        })
      );
    });

    it('should handle null command options gracefully', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(false),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          options: {
            getString: jest.fn().mockReturnValue(null),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling in Validation', () => {
    it('should use followUp when already acknowledged', async () => {
      const next = jest.fn().mockResolvedValue(undefined);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: true,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          fields: {
            getTextInputValue: jest.fn((id: string) => {
              if (id === 'task_description') return 'SELECT * FROM users';
              return '';
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(context.interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Invalid input detected'),
          ephemeral: true,
        })
      );
    });

    it('should log validation errors', async () => {
      const { logger } = require('../../../../shared/utils/logger');
      const next = jest.fn().mockResolvedValue(undefined);
      // Use a string that exceeds MAX_TASK_LENGTH (200 chars) to reliably trigger error
      const longDescription = 'A'.repeat(201);
      const context = createMockContext({
        interaction: {
          id: 'int-1',
          deferred: false,
          replied: false,
          reply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          followUp: jest.fn().mockResolvedValue(undefined),
          isModalSubmit: jest.fn().mockReturnValue(true),
          isChatInputCommand: jest.fn().mockReturnValue(false),
          fields: {
            getTextInputValue: jest.fn((id: string) => {
              if (id === 'task_description') return longDescription;
              return '';
            }),
          },
        } as any,
      });

      await validationMiddleware.execute(context, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Validation error',
        expect.objectContaining({
          userId: 'user-456',
          guildId: 'guild-123',
        })
      );
    });
  });
});
