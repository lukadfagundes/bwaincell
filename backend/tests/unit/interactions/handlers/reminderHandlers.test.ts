/**
 * Unit Tests: Reminder Button Handlers
 *
 * Tests all reminder-related button interactions including delete,
 * add new, list, refresh, and create (daily/weekly/once) operations.
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

// Mock database helper
const mockReminder = {
  deleteReminder: jest.fn(),
  getUserReminders: jest.fn(),
  createReminder: jest.fn(),
};

jest.mock('../../../../utils/interactions/helpers/databaseHelper', () => ({
  __esModule: true,
  getModels: jest.fn().mockResolvedValue({ Reminder: mockReminder }),
}));

// Mock error responses
jest.mock('../../../../utils/interactions/responses/errorResponses', () => ({
  __esModule: true,
  handleInteractionError: jest.fn(),
}));

import { handleReminderButton } from '../../../../utils/interactions/handlers/reminderHandlers';
import { handleInteractionError } from '../../../../utils/interactions/responses/errorResponses';

describe('Reminder Button Handlers', () => {
  function createMockInteraction(overrides: Record<string, unknown> = {}) {
    return {
      customId: 'reminder_add_new',
      user: { id: 'user-456' },
      guild: { id: 'guild-123' },
      replied: false,
      deferred: false,
      update: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      deferUpdate: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
      showModal: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as any;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Guild Validation', () => {
    it('should reply with error when guild is not present', async () => {
      const interaction = createMockInteraction({ guild: null });

      await handleReminderButton(interaction);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('This command can only be used in a server'),
          ephemeral: true,
        })
      );
    });

    it('should use followUp when already deferred and no guild', async () => {
      const interaction = createMockInteraction({ guild: null, deferred: true });

      await handleReminderButton(interaction);

      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('This command can only be used in a server'),
          ephemeral: true,
        })
      );
    });
  });

  describe('reminder_delete_{id}', () => {
    it('should delete reminder successfully', async () => {
      mockReminder.deleteReminder.mockResolvedValue(true);

      const interaction = createMockInteraction({ customId: 'reminder_delete_42' });

      await handleReminderButton(interaction);

      expect(mockReminder.deleteReminder).toHaveBeenCalledWith(42, 'guild-123');
      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Reminder #42 has been cancelled'),
          ephemeral: true,
        })
      );
    });

    it('should reply with not found when reminder does not exist', async () => {
      mockReminder.deleteReminder.mockResolvedValue(false);

      const interaction = createMockInteraction({ customId: 'reminder_delete_999' });

      await handleReminderButton(interaction);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Reminder #999 not found'),
          ephemeral: true,
        })
      );
    });

    it('should use followUp when already deferred (success)', async () => {
      mockReminder.deleteReminder.mockResolvedValue(true);

      const interaction = createMockInteraction({
        customId: 'reminder_delete_42',
        deferred: true,
      });

      await handleReminderButton(interaction);

      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Reminder #42 has been cancelled'),
          ephemeral: true,
        })
      );
    });

    it('should use followUp when already deferred (not found)', async () => {
      mockReminder.deleteReminder.mockResolvedValue(false);

      const interaction = createMockInteraction({
        customId: 'reminder_delete_999',
        replied: true,
      });

      await handleReminderButton(interaction);

      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Reminder #999 not found'),
          ephemeral: true,
        })
      );
    });
  });

  describe('reminder_add_new / reminder_add_another', () => {
    it('should display create reminder menu for reminder_add_new', async () => {
      const interaction = createMockInteraction({ customId: 'reminder_add_new' });

      await handleReminderButton(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining('Create New Reminder'),
              }),
            }),
          ]),
          components: expect.any(Array),
        })
      );
    });

    it('should display create reminder menu for reminder_add_another', async () => {
      const interaction = createMockInteraction({ customId: 'reminder_add_another' });

      await handleReminderButton(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          components: expect.any(Array),
        })
      );
    });
  });

  describe('reminder_list / reminder_refresh', () => {
    it('should display list of reminders', async () => {
      const reminders = [
        {
          id: 1,
          message: 'Drink water',
          time: '14:30',
          frequency: 'daily',
          day_of_week: null,
          next_trigger: new Date('2026-03-01T14:30:00'),
        },
        {
          id: 2,
          message: 'Weekly review',
          time: '10:00',
          frequency: 'weekly',
          day_of_week: 1,
          next_trigger: new Date('2026-03-03T10:00:00'),
        },
        {
          id: 3,
          message: 'One time',
          time: '09:00',
          frequency: 'once',
          day_of_week: null,
          next_trigger: null,
        },
      ];
      mockReminder.getUserReminders.mockResolvedValue(reminders);

      const interaction = createMockInteraction({ customId: 'reminder_list' });

      await handleReminderButton(interaction);

      expect(mockReminder.getUserReminders).toHaveBeenCalledWith('guild-123');
      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          components: expect.any(Array),
        })
      );
    });

    it('should show empty state when no reminders exist', async () => {
      mockReminder.getUserReminders.mockResolvedValue([]);

      const interaction = createMockInteraction({ customId: 'reminder_list' });

      await handleReminderButton(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining('No Reminders'),
              }),
            }),
          ]),
          components: expect.any(Array),
        })
      );
    });

    it('should work with reminder_refresh', async () => {
      mockReminder.getUserReminders.mockResolvedValue([]);

      const interaction = createMockInteraction({ customId: 'reminder_refresh' });

      await handleReminderButton(interaction);

      expect(mockReminder.getUserReminders).toHaveBeenCalledWith('guild-123');
    });

    it('should handle reminders with unknown frequency', async () => {
      mockReminder.getUserReminders.mockResolvedValue([
        {
          id: 1,
          message: 'Custom',
          time: '08:00',
          frequency: 'custom',
          day_of_week: null,
          next_trigger: null,
        },
      ]);

      const interaction = createMockInteraction({ customId: 'reminder_list' });

      await handleReminderButton(interaction);

      expect(interaction.editReply).toHaveBeenCalledTimes(1);
    });

    it('should show note when more than 25 reminders', async () => {
      const reminders = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        message: `Reminder ${i + 1}`,
        time: '10:00',
        frequency: 'daily',
        day_of_week: null,
        next_trigger: new Date(),
      }));
      mockReminder.getUserReminders.mockResolvedValue(reminders);

      const interaction = createMockInteraction({ customId: 'reminder_list' });

      await handleReminderButton(interaction);

      expect(interaction.editReply).toHaveBeenCalledTimes(1);
    });
  });

  describe('reminder_create_daily', () => {
    it('should show daily reminder modal', async () => {
      const interaction = createMockInteraction({ customId: 'reminder_create_daily' });

      await handleReminderButton(interaction);

      expect(interaction.showModal).toHaveBeenCalledTimes(1);
      const modal = interaction.showModal.mock.calls[0][0];
      expect(modal.data.custom_id).toBe('modal_reminder_daily');
      expect(modal.data.title).toContain('Daily');
    });
  });

  describe('reminder_create_weekly', () => {
    it('should show weekly reminder modal', async () => {
      const interaction = createMockInteraction({ customId: 'reminder_create_weekly' });

      await handleReminderButton(interaction);

      expect(interaction.showModal).toHaveBeenCalledTimes(1);
      const modal = interaction.showModal.mock.calls[0][0];
      expect(modal.data.custom_id).toBe('modal_reminder_weekly');
      expect(modal.data.title).toContain('Weekly');
    });
  });

  describe('reminder_create_once', () => {
    it('should show one-time reminder modal', async () => {
      const interaction = createMockInteraction({ customId: 'reminder_create_once' });

      await handleReminderButton(interaction);

      expect(interaction.showModal).toHaveBeenCalledTimes(1);
      const modal = interaction.showModal.mock.calls[0][0];
      expect(modal.data.custom_id).toBe('modal_reminder_once');
      expect(modal.data.title).toContain('One-Time');
    });
  });

  describe('Error Handling', () => {
    it('should call handleInteractionError on error', async () => {
      const error = new Error('Database error');
      mockReminder.deleteReminder.mockRejectedValue(error);

      const interaction = createMockInteraction({ customId: 'reminder_delete_1' });

      await handleReminderButton(interaction);

      expect(handleInteractionError).toHaveBeenCalledWith(
        interaction,
        error,
        'reminder button handler'
      );
    });
  });
});
