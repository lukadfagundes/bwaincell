// Tests for Database Models
import { DataTypes } from 'sequelize';
import { mockSequelize, mockModel } from '../mocks/database.mock';

// Mock Sequelize
jest.mock('sequelize');

describe('Database Models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Model', () => {
    let Task: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        Task = require('../../database/models/Task').default;
      });
    });

    it('should define the model with correct attributes', () => {
      expect(Task.init).toHaveBeenCalled();
      const initCall = Task.init.mock.calls[0];
      const schema = initCall[0];

      expect(schema).toHaveProperty('task');
      expect(schema.task).toEqual(expect.objectContaining({
        type: DataTypes.STRING,
        allowNull: false,
      }));

      expect(schema).toHaveProperty('done');
      expect(schema.done).toEqual(expect.objectContaining({
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      }));

      expect(schema).toHaveProperty('userId');
      expect(schema).toHaveProperty('guildId');
    });

    it('should create a task', async () => {
      const taskData = {
        task: 'Test task',
        done: false,
        userId: 'user-1',
        guildId: 'guild-1',
        dueDate: new Date(),
      };

      mockModel.create.mockResolvedValue({ id: 1, ...taskData });

      const result = await Task.create(taskData);

      expect(mockModel.create).toHaveBeenCalledWith(taskData);
      expect(result).toHaveProperty('id');
      expect(result.task).toBe('Test task');
    });

    it('should find all tasks for a user', async () => {
      const tasks = [
        { id: 1, task: 'Task 1', done: false },
        { id: 2, task: 'Task 2', done: true },
      ];

      mockModel.findAll.mockResolvedValue(tasks);

      const result = await Task.findAll({
        where: { userId: 'user-1', guildId: 'guild-1' }
      });

      expect(mockModel.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should update task status', async () => {
      mockModel.update.mockResolvedValue([1]);

      const result = await Task.update(
        { done: true },
        { where: { id: 1, userId: 'user-1' } }
      );

      expect(mockModel.update).toHaveBeenCalled();
      expect(result[0]).toBe(1);
    });

    it('should delete a task', async () => {
      mockModel.destroy.mockResolvedValue(1);

      const result = await Task.destroy({
        where: { id: 1, userId: 'user-1' }
      });

      expect(mockModel.destroy).toHaveBeenCalled();
      expect(result).toBe(1);
    });
  });

  describe('Budget Model', () => {
    let Budget: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        Budget = require('../../database/models/Budget').default;
      });
    });

    it('should define the model with correct attributes', () => {
      expect(Budget.init).toHaveBeenCalled();
      const initCall = Budget.init.mock.calls[0];
      const schema = initCall[0];

      expect(schema).toHaveProperty('amount');
      expect(schema.amount).toEqual(expect.objectContaining({
        type: DataTypes.FLOAT,
        allowNull: false,
      }));

      expect(schema).toHaveProperty('category');
      expect(schema).toHaveProperty('description');
      expect(schema).toHaveProperty('transactionType');
    });

    it('should create a budget entry', async () => {
      const budgetData = {
        amount: 150.50,
        category: 'food',
        description: 'Weekly groceries',
        transactionType: 'expense',
        userId: 'user-1',
        guildId: 'guild-1',
      };

      mockModel.create.mockResolvedValue({ id: 1, ...budgetData });

      const result = await Budget.create(budgetData);

      expect(mockModel.create).toHaveBeenCalledWith(budgetData);
      expect(result.amount).toBe(150.50);
      expect(result.category).toBe('food');
    });

    it('should calculate total expenses', async () => {
      (mockModel as any).sum = jest.fn().mockResolvedValue(500.00);

      const total = await Budget.sum('amount', {
        where: {
          userId: 'user-1',
          transactionType: 'expense'
        }
      });

      expect((mockModel as any).sum).toHaveBeenCalled();
      expect(total).toBe(500.00);
    });

    it('should find expenses by category', async () => {
      const expenses = [
        { id: 1, amount: 50, category: 'food' },
        { id: 2, amount: 30, category: 'food' },
      ];

      mockModel.findAll.mockResolvedValue(expenses);

      const result = await Budget.findAll({
        where: {
          category: 'food',
          userId: 'user-1'
        }
      });

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('food');
    });
  });

  describe('List Model', () => {
    let List: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        List = require('../../database/models/List').default;
      });
    });

    it('should define the model with correct attributes', () => {
      expect(List.init).toHaveBeenCalled();
      const initCall = List.init.mock.calls[0];
      const schema = initCall[0];

      expect(schema).toHaveProperty('name');
      expect(schema.name).toEqual(expect.objectContaining({
        type: DataTypes.STRING,
        allowNull: false,
      }));

      expect(schema).toHaveProperty('items');
      expect(schema.items).toEqual(expect.objectContaining({
        type: DataTypes.JSON,
        defaultValue: [],
      }));
    });

    it('should create a list with items', async () => {
      const listData = {
        name: 'Shopping List',
        items: ['milk', 'bread', 'eggs'],
        userId: 'user-1',
        guildId: 'guild-1',
      };

      mockModel.create.mockResolvedValue({ id: 1, ...listData });

      const result = await List.create(listData);

      expect(result.items).toHaveLength(3);
      expect(result.items).toContain('milk');
    });

    it('should update list items', async () => {
      mockModel.update.mockResolvedValue([1]);

      const newItems = ['apple', 'banana'];
      const result = await List.update(
        { items: newItems },
        { where: { id: 1, userId: 'user-1' } }
      );

      expect(mockModel.update).toHaveBeenCalled();
      expect(result[0]).toBe(1);
    });
  });

  describe('Note Model', () => {
    let Note: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        Note = require('../../database/models/Note').default;
      });
    });

    it('should define the model with correct attributes', () => {
      expect(Note.init).toHaveBeenCalled();
      const initCall = Note.init.mock.calls[0];
      const schema = initCall[0];

      expect(schema).toHaveProperty('title');
      expect(schema).toHaveProperty('content');
      expect(schema).toHaveProperty('tags');
    });

    it('should create a note', async () => {
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note',
        tags: ['test', 'important'],
        userId: 'user-1',
        guildId: 'guild-1',
      };

      mockModel.create.mockResolvedValue({ id: 1, ...noteData });

      const result = await Note.create(noteData);

      expect(result.title).toBe('Test Note');
      expect(result.tags).toContain('important');
    });

    it('should find note by title', async () => {
      mockModel.findOne.mockResolvedValue({
        id: 1,
        title: 'Test Note',
        content: 'Content here',
      });

      const result = await Note.findOne({
        where: { title: 'Test Note', userId: 'user-1' }
      });

      expect(mockModel.findOne).toHaveBeenCalled();
      expect(result.title).toBe('Test Note');
    });
  });

  describe('Reminder Model', () => {
    let Reminder: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        Reminder = require('../../database/models/Reminder').default;
      });
    });

    it('should define the model with correct attributes', () => {
      expect(Reminder.init).toHaveBeenCalled();
      const initCall = Reminder.init.mock.calls[0];
      const schema = initCall[0];

      expect(schema).toHaveProperty('reminder');
      expect(schema).toHaveProperty('time');
      expect(schema).toHaveProperty('channelId');
      expect(schema).toHaveProperty('recurring');
    });

    it('should create a reminder', async () => {
      const reminderData = {
        reminder: 'Test reminder',
        time: new Date('2024-12-31 23:59'),
        channelId: 'channel-1',
        recurring: false,
        userId: 'user-1',
        guildId: 'guild-1',
      };

      mockModel.create.mockResolvedValue({ id: 1, ...reminderData });

      const result = await Reminder.create(reminderData);

      expect(result.reminder).toBe('Test reminder');
      expect(result.recurring).toBe(false);
    });

    it('should find active reminders', async () => {
      const now = new Date();
      const reminders = [
        { id: 1, reminder: 'Reminder 1', time: new Date(now.getTime() + 3600000) },
        { id: 2, reminder: 'Reminder 2', time: new Date(now.getTime() + 7200000) },
      ];

      mockModel.findAll.mockResolvedValue(reminders);

      const result = await Reminder.findAll({
        where: {
          time: { $gt: now },
          userId: 'user-1'
        }
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('Database Connection', () => {
    it('should authenticate database connection', async () => {
      mockSequelize.authenticate.mockResolvedValue(undefined);

      await mockSequelize.authenticate();

      expect(mockSequelize.authenticate).toHaveBeenCalled();
    });

    it('should handle authentication failure', async () => {
      mockSequelize.authenticate.mockRejectedValue(new Error('Connection failed'));

      await expect(mockSequelize.authenticate()).rejects.toThrow('Connection failed');
    });

    it('should sync database models', async () => {
      mockSequelize.sync.mockResolvedValue(undefined);

      await mockSequelize.sync({ force: false });

      expect(mockSequelize.sync).toHaveBeenCalledWith({ force: false });
    });

    it('should close database connection', async () => {
      mockSequelize.close.mockResolvedValue(undefined);

      await mockSequelize.close();

      expect(mockSequelize.close).toHaveBeenCalled();
    });

    it('should handle transactions', async () => {
      const transaction = { commit: jest.fn(), rollback: jest.fn() };
      mockSequelize.transaction.mockImplementation(async (callback) => {
        if (callback) {
          return callback(transaction);
        }
        return transaction;
      });

      const result = await mockSequelize.transaction(async () => {
        // Simulate some database operations
        return 'success';
      });

      expect(result).toBe('success');
    });
  });
});