// Database mocks for testing

export const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  define: jest.fn(),
  transaction: jest.fn((callback) => callback()),
};

export const mockModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
  findOrCreate: jest.fn(),
  bulkCreate: jest.fn(),
  init: jest.fn(),
};

export const mockBudget = {
  ...mockModel,
  create: jest.fn().mockResolvedValue({ id: 1, amount: 100 }),
  findAll: jest.fn().mockResolvedValue([
    { id: 1, amount: 100, category: 'food' },
    { id: 2, amount: 50, category: 'transport' },
  ]),
  sum: jest.fn().mockResolvedValue(150),
};

export const mockTask = {
  ...mockModel,
  create: jest.fn().mockResolvedValue({ id: 1, task: 'Test task', done: false }),
  findAll: jest.fn().mockResolvedValue([
    { id: 1, task: 'Task 1', done: false },
    { id: 2, task: 'Task 2', done: true },
  ]),
  update: jest.fn().mockResolvedValue([1]),
};

export const mockList = {
  ...mockModel,
  create: jest.fn().mockResolvedValue({ id: 1, name: 'Test list', items: [] }),
  findAll: jest.fn().mockResolvedValue([
    { id: 1, name: 'Shopping', items: ['milk', 'bread'] },
  ]),
};

export const mockNote = {
  ...mockModel,
  create: jest.fn().mockResolvedValue({ id: 1, title: 'Test note', content: 'Content' }),
  findAll: jest.fn().mockResolvedValue([
    { id: 1, title: 'Note 1', content: 'Content 1' },
  ]),
};

export const mockReminder = {
  ...mockModel,
  create: jest.fn().mockResolvedValue({
    id: 1,
    reminder: 'Test reminder',
    time: new Date().toISOString()
  }),
  findAll: jest.fn().mockResolvedValue([]),
};

export const mockSchedule = {
  ...mockModel,
  create: jest.fn().mockResolvedValue({
    id: 1,
    event: 'Test event',
    time: new Date().toISOString()
  }),
  findAll: jest.fn().mockResolvedValue([]),
};

export const mockTracker = {
  ...mockModel,
  create: jest.fn().mockResolvedValue({ id: 1, metric: 'Test metric', value: 10 }),
  findAll: jest.fn().mockResolvedValue([]),
};

export const mockModels = {
  Budget: mockBudget,
  Task: mockTask,
  List: mockList,
  Note: mockNote,
  Reminder: mockReminder,
  Schedule: mockSchedule,
  Tracker: mockTracker,
};

// Mock Sequelize module
jest.mock('sequelize', () => ({
  Sequelize: jest.fn(() => mockSequelize),
  DataTypes: {
    STRING: 'STRING',
    INTEGER: 'INTEGER',
    FLOAT: 'FLOAT',
    BOOLEAN: 'BOOLEAN',
    DATE: 'DATE',
    TEXT: 'TEXT',
    JSON: 'JSON',
  },
  Model: class Model {
    static init = jest.fn();
    static create = mockModel.create;
    static findOne = mockModel.findOne;
    static findAll = mockModel.findAll;
    static findByPk = mockModel.findByPk;
    static update = mockModel.update;
    static destroy = mockModel.destroy;
  },
}));

// Mock database helper
jest.mock('@utils/interactions/helpers/databaseHelper', () => ({
  getModels: jest.fn().mockResolvedValue(mockModels),
}));

export default {
  mockSequelize,
  mockModel,
  mockModels,
  mockBudget,
  mockTask,
  mockList,
  mockNote,
  mockReminder,
  mockSchedule,
  mockTracker,
};
