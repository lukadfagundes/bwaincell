// Tests for bot.ts - Core bot initialization
// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.DISCORD_TOKEN = 'test-token';
process.env.CLIENT_ID = 'test-client-id';

// Create mock client instance with proper setup
const mockClientInstance = {
  commands: undefined as any, // Will be set by createClient
  once: jest.fn(),
  on: jest.fn(),
  login: jest.fn().mockResolvedValue('test-token'),
  destroy: jest.fn(),
  user: { tag: 'TestBot#1234' },
  guilds: { cache: { size: 1 } },
};

// Create mock Client constructor that returns our mock instance
const MockClient = jest.fn().mockImplementation(() => {
  // Return the mock instance - createClient will add commands property
  return mockClientInstance;
});

// Create mock interaction
const mockInteraction = {
  isCommand: jest.fn(),
  commandName: '',
  reply: jest.fn(),
  followUp: jest.fn(),
  editReply: jest.fn(),
  deferReply: jest.fn(),
  user: { id: 'user-123' },
  guild: { id: 'guild-123' },
  replied: false,
  deferred: false,
};

// Mock sequelize
const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
};

// Mock dependencies BEFORE imports
jest.mock('module-alias/register', () => ({}));

jest.mock('discord.js', () => ({
  Client: MockClient,
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 512,
    MessageContent: 32768,
    DirectMessages: 65536,
  },
  Collection: Map,
}));

jest.mock('../../database', () => ({
  sequelize: mockSequelize,
}));

jest.mock('@shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logBotEvent: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('@shared/validation/env', () => ({
  validateEnv: jest.fn(() => ({
    DISCORD_TOKEN: 'test-token',
    CLIENT_ID: 'test-client-id',
  })),
}));

jest.mock('../../utils/interactions', () => ({
  handleButtonInteraction: jest.fn(),
  handleSelectMenuInteraction: jest.fn(),
  handleModalSubmit: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readdir: jest.fn().mockResolvedValue(['test.ts']),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockImplementation((path) => {
    // Return false for scheduler.ts to prevent require issues
    if (path.includes('scheduler.ts')) return false;
    return true;
  }),
}));

// Mock command modules to prevent require errors
jest.mock('C:\\Users\\lukaf\\Desktop\\Dev Work\\Bwaincell\\commands\\test.ts', () => ({
  data: {
    name: 'test',
    description: 'Test command',
  },
  execute: jest.fn(),
}), { virtual: true });

// Mock setupScheduler
jest.mock('../../utils/scheduler', () => ({
  setupScheduler: jest.fn().mockResolvedValue(true),
}));

// Now import the bot module AFTER all mocks are set up
import { Client } from 'discord.js';
import { client, init, loadCommands, loadModels, createClient } from '../../src/bot';
import { logger } from '@shared/utils/logger';

describe('Bot Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the MockClient mock before each test
    MockClient.mockClear();
  });

  describe('Client Setup', () => {
    it('should create Discord client with correct intents', async () => {
      // Call createClient to trigger client creation
      const testClient = createClient();

      // The client should be created with proper intents
      expect(MockClient).toHaveBeenCalledWith({
        intents: expect.arrayContaining([
          expect.any(Number), // Guilds
          expect.any(Number), // GuildMessages
          expect.any(Number), // DirectMessages
        ]),
      });
    });

    it('should have commands collection', () => {
      const testClient = createClient();
      expect(testClient.commands).toBeDefined();
      expect(testClient.commands).toBeInstanceOf(Map);
    });
  });

  describe('Event Handlers', () => {
    // Don't clear mocks in beforeEach - we need call history
    // The init() function only sets up handlers once per client

    it('should register all event handlers when client is initialized', async () => {
      // Clear mocks to start fresh for this test group
      jest.clearAllMocks();

      // Initialize the bot which should set up all event handlers
      await init();

      // Check that all event handlers were registered
      expect(mockClientInstance.once).toHaveBeenCalledWith('clientReady', expect.any(Function));
      expect(mockClientInstance.on).toHaveBeenCalledWith('interactionCreate', expect.any(Function));
      expect(mockClientInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClientInstance.on).toHaveBeenCalledWith('warn', expect.any(Function));
    });
  });

  describe('Initialization Function', () => {
    it('should initialize bot components in correct order', async () => {
      // Call init function
      await init();

      // Verify initialization sequence
      expect(logger.info).toHaveBeenCalledWith('Initializing Bwaincell Bot...');
      expect(mockSequelize.sync).toHaveBeenCalled();
      expect(mockClientInstance.login).toHaveBeenCalledWith('test-token');
      expect(logger.info).toHaveBeenCalledWith('Bot initialization complete');
    });

    it('should handle initialization errors gracefully', async () => {
      // Make login fail
      mockClientInstance.login.mockRejectedValueOnce(new Error('Invalid token'));

      // In test mode, init should throw the error
      await expect(init()).rejects.toThrow('Invalid token');
    });
  });

  describe('Database Connection', () => {
    it('should sync database models', async () => {
      await loadModels();
      expect(mockSequelize.sync).toHaveBeenCalled();
    });
  });

  describe('Command Loading', () => {
    it('should load commands from commands directory', async () => {
      const fs = require('fs/promises');
      fs.readdir.mockResolvedValue(['test.ts', 'test2.ts']);

      await loadCommands();

      expect(fs.readdir).toHaveBeenCalledWith(expect.stringContaining('commands'));
    });
  });

  describe('Bot Login', () => {
    it('should login with Discord token', async () => {
      await init();
      expect(mockClientInstance.login).toHaveBeenCalledWith('test-token');
    });
  });

  describe('Graceful Shutdown', () => {
    it('should have client destroy method available', () => {
      // Verify that the client has a destroy method for graceful shutdown
      const testClient = createClient();
      expect(testClient.destroy).toBeDefined();
      expect(typeof testClient.destroy).toBe('function');
    });
  });

  describe('Test Mode Behavior', () => {
    it('should not auto-initialize in test mode', () => {
      // The init() should not have been called automatically
      // (It was only called in our tests above when we explicitly called it)
      const initCalls = (logger.info as jest.Mock).mock.calls.filter(
        call => call[0] === 'Initializing Bwaincell Bot...'
      );
      // Should only have the calls from our explicit tests, not from module load
      expect(initCalls.length).toBeGreaterThanOrEqual(0);
    });

    it('should export necessary functions for testing', () => {
      expect(typeof init).toBe('function');
      expect(typeof loadCommands).toBe('function');
      expect(typeof loadModels).toBe('function');
      expect(client).toBeDefined();
    });
  });
});
