// Tests for Discord commands with static method mocking
import {
  createTaskMock,
  createListMock,
  createNoteMock,
  createReminderMock,
  createBudgetMock
} from '../mocks/model-mocks';

// Create mock models
const taskMock = createTaskMock();
const listMock = createListMock();
const noteMock = createNoteMock();
const reminderMock = createReminderMock();
const budgetMock = createBudgetMock();

// Mock database models with static methods
jest.mock('../../database/models/Task', () => ({
  __esModule: true,
  default: taskMock
}));

jest.mock('../../database/models/List', () => ({
  __esModule: true,
  default: listMock
}));

jest.mock('../../database/models/Note', () => ({
  __esModule: true,
  default: noteMock
}));

jest.mock('../../database/models/Reminder', () => ({
  __esModule: true,
  default: reminderMock
}));

jest.mock('../../database/models/Budget', () => ({
  __esModule: true,
  default: budgetMock
}));

// Mock logger
jest.mock('../../shared/utils/logger', () => ({
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
  logError: jest.fn(),
  logBotEvent: jest.fn(),
}));

// Create a mock interaction object for testing
const createMockInteraction = () => ({
    user: { id: 'user-1', username: 'TestUser' },
    guild: { id: 'guild-1' },
    guildId: 'guild-1',
    options: {
        getSubcommand: jest.fn(),
        getString: jest.fn(),
        getInteger: jest.fn(),
        getBoolean: jest.fn(),
        getNumber: jest.fn()
    },
    reply: jest.fn(),
    deferReply: jest.fn(),
    editReply: jest.fn().mockResolvedValue(undefined),
    followUp: jest.fn(),
    replied: false,
    deferred: false
});

describe('Discord Commands', () => {
  let mockInteraction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInteraction = createMockInteraction();

    // Reset mock return values to defaults
    taskMock.createTask.mockResolvedValue({
      id: 1,
      description: 'Test task',
      completed: false,
      user_id: 'user-1',
      guild_id: 'guild-1'
    });

    taskMock.getUserTasks.mockResolvedValue([
      { id: 1, description: 'Task 1', completed: false },
      { id: 2, description: 'Task 2', completed: true }
    ]);
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
      mockInteraction.options.getString.mockImplementation((name: string) => {
        if (name === 'description') return 'Test task description';
        if (name === 'due_date') return null;
        return null;
      });

      await taskCommand.execute(mockInteraction);

      expect(taskMock.createTask).toHaveBeenCalledWith(
        'user-1',
        'guild-1',
        'Test task description',
        null
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should list all tasks', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('list');
      mockInteraction.options.getString.mockReturnValue('all');

      await taskCommand.execute(mockInteraction);

      expect(taskMock.getUserTasks).toHaveBeenCalledWith(
        'user-1',
        'guild-1',
        'all'
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should mark task as done', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('done');
      mockInteraction.options.getInteger.mockReturnValue(1);

      taskMock.completeTask.mockResolvedValue({
        id: 1,
        description: 'Test task',
        completed: true
      });

      await taskCommand.execute(mockInteraction);

      expect(taskMock.completeTask).toHaveBeenCalledWith(
        1,
        'user-1',
        'guild-1'
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('add');
      mockInteraction.options.getString.mockImplementation((name: string) => {
        if (name === 'description') return 'Test task';
        return null;
      });

      taskMock.createTask.mockRejectedValue(new Error('Database error'));

      await taskCommand.execute(mockInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('error')
      );
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
      expect(listCommand.data.description).toBeDefined();
      expect(listCommand.execute).toBeDefined();
    });

    it('should create a new list', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('create');
      mockInteraction.options.getString.mockReturnValue('Shopping List');

      await listCommand.execute(mockInteraction);

      expect(listMock.createList).toHaveBeenCalledWith(
        'user-1',
        'guild-1',
        'Shopping List'
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should view all lists', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('view');
      mockInteraction.options.getString.mockReturnValue(null);

      await listCommand.execute(mockInteraction);

      expect(listMock.getUserLists).toHaveBeenCalledWith(
        'user-1',
        'guild-1'
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should delete a list', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('delete');
      mockInteraction.options.getString.mockReturnValue('Shopping List');

      await listCommand.execute(mockInteraction);

      expect(listMock.deleteList).toHaveBeenCalledWith(
        'user-1',
        'guild-1',
        'Shopping List'
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
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
      expect(noteCommand.data.description).toBeDefined();
      expect(noteCommand.execute).toBeDefined();
    });

    it('should create a new note', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('create');
      mockInteraction.options.getString.mockImplementation((name: string) => {
        if (name === 'title') return 'Test Note';
        if (name === 'content') return 'Note content';
        if (name === 'tags') return 'test,sample';
        return null;
      });

      await noteCommand.execute(mockInteraction);

      expect(noteMock.createNote).toHaveBeenCalledWith(
        'user-1',
        'guild-1',
        'Test Note',
        'Note content',
        ['test', 'sample']
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should list all notes', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('list');

      await noteCommand.execute(mockInteraction);

      expect(noteMock.getNotes).toHaveBeenCalledWith(
        'user-1',
        'guild-1'
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should search notes', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('search');
      mockInteraction.options.getString.mockReturnValue('keyword');

      await noteCommand.execute(mockInteraction);

      expect(noteMock.searchNotes).toHaveBeenCalledWith(
        'user-1',
        'guild-1',
        'keyword'
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
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
      expect(reminderCommand.data.description).toBeDefined();
      expect(reminderCommand.execute).toBeDefined();
    });

    it('should set a reminder', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('set');
      mockInteraction.options.getString.mockImplementation((name: string) => {
        if (name === 'time') return '10:00';
        if (name === 'message') return 'Test reminder';
        if (name === 'frequency') return 'once';
        return null;
      });
      mockInteraction.options.getInteger.mockReturnValue(null);
      mockInteraction.channel = { id: 'channel-1' };

      await reminderCommand.execute(mockInteraction);

      expect(reminderMock.createReminder).toHaveBeenCalledWith(
        'user-1',
        'guild-1',
        'channel-1',
        'Test reminder',
        '10:00',
        'once',
        null
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should list reminders', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('list');

      await reminderCommand.execute(mockInteraction);

      expect(reminderMock.getUserReminders).toHaveBeenCalledWith(
        'user-1',
        'guild-1'
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
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
      expect(budgetCommand.data.description).toBeDefined();
      expect(budgetCommand.execute).toBeDefined();
    });

    it('should handle budget interactions', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('summary');
      mockInteraction.options.getInteger.mockReturnValue(null);

      await budgetCommand.execute(mockInteraction);

      expect(budgetMock.getSummary).toHaveBeenCalledWith(
        'user-1',
        'guild-1',
        null
      );

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    it('should handle unknown subcommands gracefully', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('unknown');

      await budgetCommand.execute(mockInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });
  });
});
