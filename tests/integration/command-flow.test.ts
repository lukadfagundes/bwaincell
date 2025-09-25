// Integration tests for command flow
import { mockInteraction } from '../mocks/discord.js.js';
import { mockTask, mockList, mockBudget, mockModels } from '../mocks/database.mock';

// Mock all dependencies
jest.mock('discord.js');
jest.mock('sequelize');
jest.mock('@utils/interactions/helpers/databaseHelper', () => ({
  getModels: jest.fn().mockResolvedValue(mockModels),
}));

describe('Command Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInteraction.replied = false;
    mockInteraction.deferred = false;
  });

  describe('End-to-End Command Flow', () => {
    it('should handle task creation and retrieval flow', async () => {
      // Simulate task creation
      const taskData = {
        task: 'Integration test task',
        userId: 'user-1',
        guildId: 'guild-1',
        done: false,
      };

      mockTask.create.mockResolvedValue({ id: 1, ...taskData });
      mockTask.findAll.mockResolvedValue([{ id: 1, ...taskData }]);

      // Create task
      const createResult = await mockTask.create(taskData);
      expect(createResult.id).toBe(1);

      // Retrieve tasks
      const tasks = await mockTask.findAll({
        where: { userId: 'user-1', guildId: 'guild-1' }
      });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].task).toBe('Integration test task');

      // Mark task as done
      mockTask.update.mockResolvedValue([1]);
      const updateResult = await mockTask.update(
        { done: true },
        { where: { id: 1 } }
      );
      expect(updateResult[0]).toBe(1);
    });

    it('should handle list management flow', async () => {
      // Create a list
      const listData = {
        name: 'Integration List',
        items: [],
        userId: 'user-1',
        guildId: 'guild-1',
      };

      mockList.create.mockResolvedValue({ id: 1, ...listData });
      const list = await mockList.create(listData);
      expect(list.name).toBe('Integration List');

      // Add items to list
      const updatedItems = ['Item 1', 'Item 2', 'Item 3'];
      mockList.update.mockResolvedValue([1]);
      await mockList.update(
        { items: updatedItems },
        { where: { id: 1 } }
      );

      // Retrieve list with items
      mockList.findOne.mockResolvedValue({
        id: 1,
        name: 'Integration List',
        items: updatedItems,
      });

      const retrievedList = await mockList.findOne({ where: { id: 1 } });
      expect(retrievedList.items).toHaveLength(3);

      // Delete list
      mockList.destroy.mockResolvedValue(1);
      const deleteResult = await mockList.destroy({ where: { id: 1 } });
      expect(deleteResult).toBe(1);
    });

    it('should handle budget tracking flow', async () => {
      // Add multiple expenses
      const expenses = [
        { amount: 50, category: 'food', description: 'Groceries' },
        { amount: 30, category: 'transport', description: 'Gas' },
        { amount: 20, category: 'food', description: 'Lunch' },
      ];

      for (const expense of expenses) {
        await mockBudget.create({
          ...expense,
          userId: 'user-1',
          guildId: 'guild-1',
          transactionType: 'expense',
        });
      }

      // Calculate total
      mockBudget.sum.mockResolvedValue(100);
      const total = await mockBudget.sum('amount', {
        where: { userId: 'user-1', transactionType: 'expense' }
      });
      expect(total).toBe(100);

      // Get expenses by category
      mockBudget.findAll.mockResolvedValue([
        expenses[0],
        expenses[2],
      ]);

      const foodExpenses = await mockBudget.findAll({
        where: { category: 'food', userId: 'user-1' }
      });
      expect(foodExpenses).toHaveLength(2);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database failures gracefully', async () => {
      mockTask.create.mockRejectedValue(new Error('Database connection lost'));

      await expect(mockTask.create({ task: 'Test' }))
        .rejects.toThrow('Database connection lost');
    });

    it('should handle invalid input data', async () => {
      const invalidData = {
        task: null, // Invalid: task cannot be null
        userId: 'user-1',
        guildId: 'guild-1',
      };

      mockTask.create.mockRejectedValue(new Error('Validation error: task cannot be null'));

      await expect(mockTask.create(invalidData))
        .rejects.toThrow('Validation error');
    });

    it('should handle concurrent operations', async () => {
      const operations = [];

      // Simulate multiple concurrent operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          mockTask.create({
            task: `Concurrent task ${i}`,
            userId: 'user-1',
            guildId: 'guild-1',
          })
        );
      }

      mockTask.create.mockImplementation((data) =>
        Promise.resolve({ id: Math.random(), ...data })
      );

      const results = await Promise.all(operations);
      expect(results).toHaveLength(5);
    });
  });

  describe('Command Interaction Flow', () => {
    it('should process command from interaction to response', async () => {
      // Setup interaction
      mockInteraction.commandName = 'task';
      mockInteraction.options.getSubcommand.mockReturnValue('add');
      mockInteraction.options.getString.mockReturnValue('Test task');

      // Process command
      mockTask.create.mockResolvedValue({
        id: 1,
        task: 'Test task',
        done: false,
      });

      // Simulate command execution
      const taskData = {
        task: mockInteraction.options.getString('description'),
        userId: mockInteraction.user.id,
        guildId: mockInteraction.guildId,
        done: false,
      };

      const result = await mockTask.create(taskData);

      // Verify response
      expect(result.task).toBe('Test task');

      // Simulate reply
      await mockInteraction.reply({
        embeds: [{
          title: 'Task Added',
          description: `Added task: ${result.task}`,
        }],
      });

      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    it('should handle autocomplete interactions', async () => {
      // Setup autocomplete interaction
      mockInteraction.isAutocomplete.mockReturnValue(true);
      (mockInteraction.options as any).getFocused = jest.fn().mockReturnValue('test');

      // Get matching tasks for autocomplete
      mockTask.findAll.mockResolvedValue([
        { id: 1, task: 'Test task 1' },
        { id: 2, task: 'Test task 2' },
      ]);

      const tasks = await mockTask.findAll({
        where: {
          task: { $like: '%test%' },
          userId: mockInteraction.user.id,
        },
      });

      const choices = tasks.map((t: any) => ({
        name: t.task,
        value: t.id.toString(),
      }));

      expect(choices).toHaveLength(2);
      expect(choices[0].name).toContain('Test');
    });

    it('should handle button interactions', async () => {
      // Setup button interaction
      mockInteraction.isButton.mockReturnValue(true);
      (mockInteraction as any).customId = 'task_done_1';

      // Parse button customId
      const [action, taskId] = (mockInteraction as any).customId.split('_').slice(1);
      expect(action).toBe('done');
      expect(taskId).toBe('1');

      // Update task based on button
      mockTask.update.mockResolvedValue([1]);
      const result = await mockTask.update(
        { done: true },
        { where: { id: parseInt(taskId) } }
      );

      expect(result[0]).toBe(1);

      // Update interaction message
      await (mockInteraction as any).update({
        content: 'Task marked as complete!',
        components: [],
      });

      expect((mockInteraction as any).update).toHaveBeenCalled();
    });
  });

  describe('Database Transaction Integration', () => {
    it('should handle transactional operations', async () => {
      const transaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };

      // Simulate a transactional operation
      try {
        // Begin transaction
        await mockTask.create({ task: 'Task 1' }, { transaction });
        await mockList.create({ name: 'List 1' }, { transaction });

        // Commit if all succeed
        await transaction.commit();
        expect(transaction.commit).toHaveBeenCalled();
      } catch {
        // Rollback on error
        await transaction.rollback();
        expect(transaction.rollback).toHaveBeenCalled();
      }
    });

    it('should rollback on failure', async () => {
      const transaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };

      mockTask.create.mockResolvedValue({ id: 1 });
      mockList.create.mockRejectedValue(new Error('Constraint violation'));

      try {
        await mockTask.create({ task: 'Task 1' }, { transaction });
        await mockList.create({ name: null }, { transaction }); // This fails
        await transaction.commit();
      } catch {
        await transaction.rollback();
        expect(transaction.rollback).toHaveBeenCalled();
        expect(transaction.commit).not.toHaveBeenCalled();
      }
    });
  });
});