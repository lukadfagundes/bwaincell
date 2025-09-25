// Tests for Discord commands
// Removed unused import
import { mockInteraction } from '../mocks/discord.js.js';
import { mockTask, mockList, mockNote, mockReminder, mockBudget } from '../mocks/database.mock';

// Mock database models
jest.mock('@database/models/Task', () => mockTask);
jest.mock('@database/models/List', () => mockList);
jest.mock('@database/models/Note', () => mockNote);
jest.mock('@database/models/Reminder', () => mockReminder);
jest.mock('@database/models/Budget', () => mockBudget);

// Mock logger
jest.mock('@shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('Discord Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInteraction.replied = false;
    mockInteraction.deferred = false;
  });

  describe('Task Command', () => {
    let taskCommand: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        taskCommand = require('../../commands/task').default;
      });
    });

    it('should have correct command structure', () => {
      expect(taskCommand.data).toBeDefined();
      expect(taskCommand.data.name).toBe('task');
      expect(taskCommand.data.description).toBeDefined();
      expect(taskCommand.execute).toBeDefined();
    });

    it('should add a new task', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('add');
      mockInteraction.options.getString.mockReturnValue('Test task description');

      await taskCommand.execute(mockInteraction);

      expect(mockTask.create).toHaveBeenCalledWith(expect.objectContaining({
        task: 'Test task description',
        userId: 'user-1',
        guildId: 'guild-1',
        done: false,
      }));

      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
        embeds: expect.any(Array),
      }));
    });

    it('should list all tasks', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('list');
      mockInteraction.options.getString.mockReturnValue('all');

      await taskCommand.execute(mockInteraction);

      expect(mockTask.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          guildId: 'guild-1',
        },
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should mark task as done', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('done');
      mockInteraction.options.getInteger.mockReturnValue(1);

      mockTask.findOne.mockResolvedValue({ id: 1, task: 'Test', done: false });

      await taskCommand.execute(mockInteraction);

      expect(mockTask.update).toHaveBeenCalledWith(
        { done: true },
        {
          where: {
            id: 1,
            userId: 'user-1',
            guildId: 'guild-1',
          },
        }
      );

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('add');
      mockTask.create.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await taskCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('error'),
        ephemeral: true,
      }));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('List Command', () => {
    let listCommand: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        listCommand = require('../../commands/list').default;
      });
    });

    it('should have correct command structure', () => {
      expect(listCommand.data).toBeDefined();
      expect(listCommand.data.name).toBe('list');
      expect(listCommand.execute).toBeDefined();
    });

    it('should create a new list', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('create');
      mockInteraction.options.getString.mockReturnValue('Shopping List');

      await listCommand.execute(mockInteraction);

      expect(mockList.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Shopping List',
        userId: 'user-1',
        guildId: 'guild-1',
      }));

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should show all lists', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('show');

      await listCommand.execute(mockInteraction);

      expect(mockList.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          guildId: 'guild-1',
        },
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should delete a list', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('delete');
      mockInteraction.options.getString.mockReturnValue('Shopping List');

      mockList.destroy.mockResolvedValue(1);

      await listCommand.execute(mockInteraction);

      expect(mockList.destroy).toHaveBeenCalledWith({
        where: {
          name: 'Shopping List',
          userId: 'user-1',
          guildId: 'guild-1',
        },
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });
  });

  describe('Note Command', () => {
    let noteCommand: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        noteCommand = require('../../commands/note').default;
      });
    });

    it('should have correct command structure', () => {
      expect(noteCommand.data).toBeDefined();
      expect(noteCommand.data.name).toBe('note');
      expect(noteCommand.execute).toBeDefined();
    });

    it('should add a new note', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('add');
      mockInteraction.options.getString.mockImplementation((name) => {
        if (name === 'title') return 'Test Note';
        if (name === 'content') return 'Note content';
        return null;
      });

      await noteCommand.execute(mockInteraction);

      expect(mockNote.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Note',
        content: 'Note content',
        userId: 'user-1',
        guildId: 'guild-1',
      }));

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should list all notes', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('list');

      await noteCommand.execute(mockInteraction);

      expect(mockNote.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          guildId: 'guild-1',
        },
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should get a specific note', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('get');
      mockInteraction.options.getString.mockReturnValue('Test Note');

      mockNote.findOne.mockResolvedValue({
        title: 'Test Note',
        content: 'Note content',
      });

      await noteCommand.execute(mockInteraction);

      expect(mockNote.findOne).toHaveBeenCalledWith({
        where: {
          title: 'Test Note',
          userId: 'user-1',
          guildId: 'guild-1',
        },
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });
  });

  describe('Reminder Command', () => {
    let reminderCommand: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        reminderCommand = require('../../commands/remind').default;
      });
    });

    it('should have correct command structure', () => {
      expect(reminderCommand.data).toBeDefined();
      expect(reminderCommand.data.name).toBe('remind');
      expect(reminderCommand.execute).toBeDefined();
    });

    it('should set a reminder', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('set');
      mockInteraction.options.getString.mockImplementation((name) => {
        if (name === 'message') return 'Test reminder';
        if (name === 'time') return '2024-12-31 23:59';
        return null;
      });

      await reminderCommand.execute(mockInteraction);

      expect(mockReminder.create).toHaveBeenCalledWith(expect.objectContaining({
        reminder: 'Test reminder',
        userId: 'user-1',
        guildId: 'guild-1',
      }));

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should list reminders', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('list');

      await reminderCommand.execute(mockInteraction);

      expect(mockReminder.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          guildId: 'guild-1',
        },
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });
  });

  describe('Budget Command', () => {
    let budgetCommand: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        budgetCommand = require('../../commands/budget').default;
      });
    });

    it('should have correct command structure', () => {
      expect(budgetCommand.data).toBeDefined();
      expect(budgetCommand.data.name).toBe('budget');
      expect(budgetCommand.execute).toBeDefined();
    });

    it('should add an expense', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('add');
      (mockInteraction.options as any).getNumber = jest.fn().mockReturnValue(50.00);
      mockInteraction.options.getString.mockImplementation((name) => {
        if (name === 'category') return 'food';
        if (name === 'description') return 'Groceries';
        return null;
      });

      await budgetCommand.execute(mockInteraction);

      expect(mockBudget.create).toHaveBeenCalledWith(expect.objectContaining({
        amount: 50.00,
        category: 'food',
        description: 'Groceries',
        userId: 'user-1',
        guildId: 'guild-1',
      }));

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should show budget summary', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('summary');

      await budgetCommand.execute(mockInteraction);

      expect(mockBudget.findAll).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          guildId: 'guild-1',
        },
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should calculate total expenses', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('total');

      await budgetCommand.execute(mockInteraction);

      expect(mockBudget.sum).toHaveBeenCalledWith('amount', {
        where: {
          userId: 'user-1',
          guildId: 'guild-1',
        },
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });
  });

  describe('Command Error Handling', () => {
    it('should handle missing subcommands gracefully', async () => {
      const taskCommand = require('../../commands/task').default;
      mockInteraction.options.getSubcommand.mockReturnValue(undefined);

      await taskCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('error'),
        ephemeral: true,
      }));
    });

    it('should handle database connection errors', async () => {
      const listCommand = require('../../commands/list').default;
      mockInteraction.options.getSubcommand.mockReturnValue('show');
      mockList.findAll.mockRejectedValue(new Error('Database connection failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await listCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('error'),
        ephemeral: true,
      }));

      consoleErrorSpy.mockRestore();
    });
  });
});