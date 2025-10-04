// Tests for Discord commands with proper mock setup
// Set up mocks BEFORE any imports that might use them

// Create mock functions that we'll use throughout the tests
const mockTaskCreate = jest.fn();
const mockTaskFindAll = jest.fn();
const mockTaskFindOne = jest.fn();
const mockTaskUpdate = jest.fn();
const mockTaskDestroy = jest.fn();

const mockListCreate = jest.fn();
const mockListFindAll = jest.fn();
const mockListFindOne = jest.fn();
const mockListUpdate = jest.fn();
const mockListDestroy = jest.fn();

const mockNoteCreate = jest.fn();
const mockNoteFindAll = jest.fn();
const mockNoteFindOne = jest.fn();
const mockNoteUpdate = jest.fn();
const mockNoteDestroy = jest.fn();

const mockReminderCreate = jest.fn();
const mockReminderFindAll = jest.fn();
const mockReminderFindOne = jest.fn();
const mockReminderSchedule = jest.fn();

const mockBudgetCreate = jest.fn();
const mockBudgetFindAll = jest.fn();
const mockBudgetFindOne = jest.fn();
const mockBudgetSum = jest.fn();

// Mock the database models before any command imports them
jest.mock('../../database/models/Task', () => {
  const mockTaskModel = {
    create: mockTaskCreate,
    findAll: mockTaskFindAll,
    findOne: mockTaskFindOne,
    update: mockTaskUpdate,
    destroy: mockTaskDestroy,
  };

  // Handle both default export and direct export
  return {
    __esModule: true,
    default: mockTaskModel,
    ...mockTaskModel
  };
});

jest.mock('../../database/models/List', () => {
  const mockListModel = {
    create: mockListCreate,
    findAll: mockListFindAll,
    findOne: mockListFindOne,
    update: mockListUpdate,
    destroy: mockListDestroy,
  };

  return {
    __esModule: true,
    default: mockListModel,
    ...mockListModel
  };
});

jest.mock('../../database/models/Note', () => {
  const mockNoteModel = {
    create: mockNoteCreate,
    findAll: mockNoteFindAll,
    findOne: mockNoteFindOne,
    update: mockNoteUpdate,
    destroy: mockNoteDestroy,
  };

  return {
    __esModule: true,
    default: mockNoteModel,
    ...mockNoteModel
  };
});

jest.mock('../../database/models/Reminder', () => {
  const mockReminderModel = {
    create: mockReminderCreate,
    findAll: mockReminderFindAll,
    findOne: mockReminderFindOne,
    schedule: mockReminderSchedule,
  };

  return {
    __esModule: true,
    default: mockReminderModel,
    ...mockReminderModel
  };
});

jest.mock('../../database/models/Budget', () => {
  const mockBudgetModel = {
    create: mockBudgetCreate,
    findAll: mockBudgetFindAll,
    findOne: mockBudgetFindOne,
    sum: mockBudgetSum,
  };

  return {
    __esModule: true,
    default: mockBudgetModel,
    ...mockBudgetModel
  };
});

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

// Create mock interaction object
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
    editReply: jest.fn(),
    followUp: jest.fn(),
    replied: false,
    deferred: false
});

// Now require the commands AFTER the mocks are set up
const taskCommand = require('../../commands/task').default;

describe('Discord Commands', () => {
  let mockInteraction: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create fresh interaction for each test
    mockInteraction = createMockInteraction();

    // Reset mock return values
    mockTaskCreate.mockResolvedValue({ id: 1, task: 'Test task', done: false });
    mockTaskFindAll.mockResolvedValue([
        { id: 1, task: 'Task 1', done: false },
        { id: 2, task: 'Task 2', done: true },
    ]);
    mockTaskFindOne.mockResolvedValue({ id: 1, task: 'Test', done: false });
    mockTaskUpdate.mockResolvedValue([1]);
    mockTaskDestroy.mockResolvedValue(1);
  });

  describe('Task Command', () => {
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

      expect(mockTaskCreate).toHaveBeenCalledWith(expect.objectContaining({
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

      expect(mockTaskFindAll).toHaveBeenCalledWith({
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

      await taskCommand.execute(mockInteraction);

      expect(mockTaskUpdate).toHaveBeenCalledWith(
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
      mockTaskCreate.mockRejectedValue(new Error('Database error'));

      await taskCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
        content: expect.stringContaining('error'),
        ephemeral: true,
      }));
    });
  });
});
