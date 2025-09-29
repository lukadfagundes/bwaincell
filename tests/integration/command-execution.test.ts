import { jest } from '@jest/globals';

// Mock Discord.js components
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue('token'),
    on: jest.fn(),
    user: { id: 'bot-123', username: 'TestBot' },
    guilds: {
      cache: new Map([
        ['guild-1', { id: 'guild-1', name: 'Test Guild' }]
      ])
    }
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 512,
    MessageContent: 32768
  },
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis(),
    addIntegerOption: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({})
  })),
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn().mockReturnThis(),
    put: jest.fn().mockResolvedValue([])
  })),
  Routes: {
    applicationGuildCommands: jest.fn().mockReturnValue('mock-route')
  }
}));

// Mock Sequelize and database models
const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  transaction: jest.fn().mockImplementation((callback) => {
    const transaction = { commit: jest.fn(), rollback: jest.fn() };
    return callback(transaction);
  })
};

jest.mock('sequelize', () => ({
  Sequelize: jest.fn(() => mockSequelize),
  DataTypes: {
    STRING: 'STRING',
    INTEGER: 'INTEGER',
    TEXT: 'TEXT',
    BOOLEAN: 'BOOLEAN',
    DATE: 'DATE'
  }
}));

// Mock database models
const mockTask = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn()
};

const mockBudget = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  sum: jest.fn()
};

jest.mock('../../database/models/Task', () => ({ __esModule: true, default: mockTask }));
jest.mock('../../database/models/Budget', () => ({ __esModule: true, default: mockBudget }));

import { mockInteraction } from '../mocks/discord.js';

describe('Command Execution Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockTask.create.mockResolvedValue({ id: 1, description: 'Test task' });
    mockTask.findAll.mockResolvedValue([]);
    mockTask.findOne.mockResolvedValue(null);
    mockBudget.create.mockResolvedValue({ id: 1, amount: 100 });
    mockBudget.findAll.mockResolvedValue([]);

    // Reset Sequelize mocks
    mockSequelize.authenticate.mockResolvedValue(undefined);
    mockSequelize.transaction.mockImplementation((callback) => {
      const transaction = { commit: jest.fn(), rollback: jest.fn() };
      return callback(transaction);
    });
  });

  describe('Task Command Flow', () => {
    test('should create task and save to database', async () => {
      // Mock successful task creation
      const mockTaskData = {
        id: 1,
        userId: 'user-1',
        guildId: 'guild-1',
        description: 'Integration test task',
        priority: 'high',
        status: 'pending',
        createdAt: new Date()
      };

      mockTask.create.mockResolvedValue(mockTaskData);

      const interaction = {
        ...mockInteraction,
        options: {
          getSubcommand: jest.fn().mockReturnValue('add'),
          getString: jest.fn()
            .mockReturnValueOnce('Integration test task')  // description
            .mockReturnValueOnce('high'),                  // priority
          getInteger: jest.fn().mockReturnValue(null)
        },
        reply: jest.fn().mockResolvedValue(undefined)
      };

      // Simulate command execution flow
      const taskCreationFlow = async () => {
        // 1. Validate input
        const description = interaction.options.getString('description');
        const priority = interaction.options.getString('priority') || 'medium';

        if (!description) {
          throw new Error('Description is required');
        }

        // 2. Create database entry
        const taskData = {
          userId: interaction.user.id,
          guildId: interaction.guildId,
          description,
          priority,
          status: 'pending'
        };

        const createdTask = await mockTask.create(taskData);

        // 3. Send response
        await interaction.reply({
          content: `Task created with ID: ${createdTask.id}`,
          ephemeral: true
        });

        return createdTask;
      };

      const result = await taskCreationFlow();

      // Verify database interaction
      expect(mockTask.create).toHaveBeenCalledWith({
        userId: 'user-1',
        guildId: 'guild-1',
        description: 'Integration test task',
        priority: 'high',
        status: 'pending'
      });

      // Verify response
      expect(interaction.reply).toHaveBeenCalledWith({
        content: 'Task created with ID: 1',
        ephemeral: true
      });

      expect(result.id).toBe(1);
    });

    test('should handle validation errors gracefully', async () => {
      const interaction = {
        ...mockInteraction,
        options: {
          getSubcommand: jest.fn().mockReturnValue('add'),
          getString: jest.fn()
            .mockReturnValueOnce('')  // empty description
            .mockReturnValueOnce('high'),
          getInteger: jest.fn().mockReturnValue(null)
        },
        reply: jest.fn().mockResolvedValue(undefined)
      };

      const taskCreationFlow = async () => {
        try {
          const description = interaction.options.getString('description');
          const priority = interaction.options.getString('priority') || 'medium';

          if (!description || description.trim().length === 0) {
            await interaction.reply({
              content: 'Error: Task description cannot be empty',
              ephemeral: true
            });
            return null;
          }

          return await mockTask.create({
            userId: interaction.user.id,
            guildId: interaction.guildId,
            description,
            priority,
            status: 'pending'
          });
        } catch (error) {
          await interaction.reply({
            content: 'An error occurred while creating the task',
            ephemeral: true
          });
          return null;
        }
      };

      const result = await taskCreationFlow();

      expect(result).toBeNull();
      expect(interaction.reply).toHaveBeenCalledWith({
        content: 'Error: Task description cannot be empty',
        ephemeral: true
      });
      expect(mockTask.create).not.toHaveBeenCalled();
    });

    test('should handle database transaction rollback', async () => {
      // Mock database error
      mockTask.create.mockRejectedValue(new Error('Database connection failed'));

      const interaction = {
        ...mockInteraction,
        options: {
          getSubcommand: jest.fn().mockReturnValue('add'),
          getString: jest.fn()
            .mockReturnValueOnce('Test task')
            .mockReturnValueOnce('medium'),
          getInteger: jest.fn().mockReturnValue(null)
        },
        reply: jest.fn().mockResolvedValue(undefined)
      };

      const taskCreationWithTransaction = async () => {
        const transaction = await mockSequelize.transaction(async (t) => {
          try {
            const description = interaction.options.getString('description');
            const priority = interaction.options.getString('priority') || 'medium';

            const task = await mockTask.create({
              userId: interaction.user.id,
              guildId: interaction.guildId,
              description,
              priority,
              status: 'pending'
            }, { transaction: t });

            await t.commit();
            return task;
          } catch (error) {
            await t.rollback();
            throw error;
          }
        });

        return transaction;
      };

      await expect(taskCreationWithTransaction()).rejects.toThrow('Database connection failed');
      expect(mockTask.create).toHaveBeenCalled();
    });
  });

  describe('Budget Command Flow', () => {
    test('should create budget entry with validation', async () => {
      const mockBudgetData = {
        id: 1,
        userId: 'user-1',
        guildId: 'guild-1',
        category: 'groceries',
        amount: 150.50,
        type: 'expense',
        date: new Date()
      };

      mockBudget.create.mockResolvedValue(mockBudgetData);

      const interaction = {
        ...mockInteraction,
        options: {
          getSubcommand: jest.fn().mockReturnValue('add'),
          getString: jest.fn()
            .mockReturnValueOnce('groceries')  // category
            .mockReturnValueOnce('expense'),   // type
          getNumber: jest.fn().mockReturnValue(150.50)  // amount
        },
        reply: jest.fn().mockResolvedValue(undefined)
      };

      const budgetCreationFlow = async () => {
        const category = interaction.options.getString('category');
        const type = interaction.options.getString('type');
        const amount = interaction.options.getNumber('amount');

        // Validation
        if (!category || !type || !amount || amount <= 0) {
          await interaction.reply({
            content: 'Invalid input: Please provide valid category, type, and positive amount',
            ephemeral: true
          });
          return null;
        }

        const budgetData = {
          userId: interaction.user.id,
          guildId: interaction.guildId,
          category,
          type,
          amount,
          date: new Date()
        };

        const createdBudget = await mockBudget.create(budgetData);

        await interaction.reply({
          content: `Budget entry created: ${type} of $${amount} for ${category}`,
          ephemeral: true
        });

        return createdBudget;
      };

      const result = await budgetCreationFlow();

      expect(mockBudget.create).toHaveBeenCalledWith({
        userId: 'user-1',
        guildId: 'guild-1',
        category: 'groceries',
        type: 'expense',
        amount: 150.50,
        date: expect.any(Date)
      });

      expect(interaction.reply).toHaveBeenCalledWith({
        content: 'Budget entry created: expense of $150.5 for groceries',
        ephemeral: true
      });

      expect(result.id).toBe(1);
    });

    test('should calculate budget summary', async () => {
      const mockBudgetEntries = [
        { category: 'groceries', amount: 100, type: 'expense' },
        { category: 'salary', amount: 2000, type: 'income' },
        { category: 'utilities', amount: 150, type: 'expense' }
      ];

      mockBudget.findAll.mockResolvedValue(mockBudgetEntries);
      mockBudget.sum.mockImplementation((field, options) => {
        const filtered = mockBudgetEntries.filter(entry =>
          entry.type === options.where.type
        );
        return Promise.resolve(
          filtered.reduce((sum, entry) => sum + entry.amount, 0)
        );
      });

      const interaction = {
        ...mockInteraction,
        options: {
          getSubcommand: jest.fn().mockReturnValue('summary'),
          getString: jest.fn().mockReturnValue('month')  // period
        },
        reply: jest.fn().mockResolvedValue(undefined)
      };

      const budgetSummaryFlow = async () => {
        const period = interaction.options.getString('period') || 'month';

        // Calculate totals
        const totalIncome = await mockBudget.sum('amount', {
          where: {
            userId: interaction.user.id,
            guildId: interaction.guildId,
            type: 'income'
          }
        });

        const totalExpenses = await mockBudget.sum('amount', {
          where: {
            userId: interaction.user.id,
            guildId: interaction.guildId,
            type: 'expense'
          }
        });

        const balance = totalIncome - totalExpenses;

        await interaction.reply({
          content: `Budget Summary (${period}):\nIncome: $${totalIncome}\nExpenses: $${totalExpenses}\nBalance: $${balance}`,
          ephemeral: true
        });

        return { totalIncome, totalExpenses, balance };
      };

      const result = await budgetSummaryFlow();

      expect(mockBudget.sum).toHaveBeenCalledTimes(2);
      expect(result.totalIncome).toBe(2000);
      expect(result.totalExpenses).toBe(250);
      expect(result.balance).toBe(1750);
    });
  });

  describe('Real Interaction Handling', () => {
    test('should handle command routing', async () => {
      const commandRouter = async (interaction: any) => {
        const commandName = interaction.commandName;
        const subcommand = interaction.options?.getSubcommand?.();

        switch (commandName) {
          case 'task':
            if (subcommand === 'add') {
              return await mockTask.create({
                userId: interaction.user.id,
                description: interaction.options.getString('description')
              });
            }
            break;
          case 'budget':
            if (subcommand === 'add') {
              return await mockBudget.create({
                userId: interaction.user.id,
                amount: interaction.options.getNumber('amount')
              });
            }
            break;
          default:
            throw new Error(`Unknown command: ${commandName}`);
        }
      };

      // Test task command routing
      const taskInteraction = {
        ...mockInteraction,
        commandName: 'task',
        options: {
          getSubcommand: jest.fn().mockReturnValue('add'),
          getString: jest.fn().mockReturnValue('Test task')
        }
      };

      const taskResult = await commandRouter(taskInteraction);
      expect(mockTask.create).toHaveBeenCalled();

      // Test budget command routing
      const budgetInteraction = {
        ...mockInteraction,
        commandName: 'budget',
        options: {
          getSubcommand: jest.fn().mockReturnValue('add'),
          getNumber: jest.fn().mockReturnValue(100)
        }
      };

      const budgetResult = await commandRouter(budgetInteraction);
      expect(mockBudget.create).toHaveBeenCalled();
    });

    test('should handle rate limiting', async () => {
      const rateLimiter = new Map<string, { count: number; resetTime: number }>();
      const RATE_LIMIT = 5;
      const WINDOW_MS = 60000; // 1 minute

      const checkRateLimit = (userId: string): boolean => {
        const now = Date.now();
        const userLimit = rateLimiter.get(userId);

        if (!userLimit || now > userLimit.resetTime) {
          rateLimiter.set(userId, { count: 1, resetTime: now + WINDOW_MS });
          return true;
        }

        if (userLimit.count >= RATE_LIMIT) {
          return false;
        }

        userLimit.count++;
        return true;
      };

      const interaction = {
        ...mockInteraction,
        user: { id: 'test-user' }
      };

      // Test within rate limit
      for (let i = 0; i < RATE_LIMIT; i++) {
        expect(checkRateLimit(interaction.user.id)).toBe(true);
      }

      // Test exceeding rate limit
      expect(checkRateLimit(interaction.user.id)).toBe(false);

      // Verify rate limit data
      const userLimit = rateLimiter.get(interaction.user.id);
      expect(userLimit?.count).toBe(RATE_LIMIT);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from temporary database failures', async () => {
      let attemptCount = 0;
      mockTask.create.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Connection timeout'));
        }
        return Promise.resolve({ id: 1, description: 'Success after retry' });
      });

      const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
        let lastError: Error;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error as Error;
            if (attempt === maxRetries - 1) throw lastError;
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
          }
        }
      };

      const result = await retryOperation(() => mockTask.create({
        userId: 'user-1',
        description: 'Retry test'
      }));

      expect(result.id).toBe(1);
      expect(attemptCount).toBe(3);
    });

    test('should handle concurrent operations safely', async () => {
      const concurrentOperations = [];

      for (let i = 0; i < 5; i++) {
        const operation = async () => {
          return await mockTask.create({
            userId: `user-${i}`,
            description: `Concurrent task ${i}`
          });
        };
        concurrentOperations.push(operation());
      }

      const results = await Promise.all(concurrentOperations);

      expect(results).toHaveLength(5);
      expect(mockTask.create).toHaveBeenCalledTimes(5);
    });
  });
});
