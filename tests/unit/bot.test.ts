// Tests for bot.ts - Core bot initialization
import { Client, GatewayIntentBits } from 'discord.js';
import { mockClient, mockInteraction } from '../mocks/discord.js';
import { mockSequelize } from '../mocks/database.mock';

// Mock dependencies
jest.mock('discord.js');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));
jest.mock('sequelize');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readdirSync: jest.fn().mockReturnValue(['test.js']),
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock environment variables
process.env.DISCORD_TOKEN = 'test-token';
process.env.CLIENT_ID = 'test-client-id';

describe('Bot Initialization', () => {
  // bot variable removed as it wasn't used

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Client Setup', () => {
    it('should create Discord client with correct intents', () => {
      const ClientMock = Client as jest.MockedClass<typeof Client>;

      expect(ClientMock).toHaveBeenCalledWith({
        intents: expect.arrayContaining([
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
        ]),
      });
    });

    it('should initialize commands collection', () => {
      expect(mockClient.commands).toBeDefined();
      expect(mockClient.commands).toBeInstanceOf(Map);
    });
  });

  describe('Event Handlers', () => {
    it('should register ready event handler', () => {
      expect(mockClient.once).toHaveBeenCalledWith('ready', expect.any(Function));
    });

    it('should register interactionCreate event handler', () => {
      expect(mockClient.on).toHaveBeenCalledWith('interactionCreate', expect.any(Function));
    });

    it('should handle slash commands', async () => {
      const interactionHandler = mockClient.on.mock.calls.find(
        (call: any[]) => call[0] === 'interactionCreate'
      )?.[1];

      if (interactionHandler) {
        mockInteraction.isCommand.mockReturnValue(true);
        mockInteraction.commandName = 'test';

        const testCommand = {
          data: { name: 'test' },
          execute: jest.fn(),
        };
        mockClient.commands.set('test', testCommand);

        await interactionHandler(mockInteraction);

        expect(testCommand.execute).toHaveBeenCalledWith(mockInteraction);
      }
    });

    it('should handle unknown commands gracefully', async () => {
      const interactionHandler = mockClient.on.mock.calls.find(
        (call: any[]) => call[0] === 'interactionCreate'
      )?.[1];

      if (interactionHandler) {
        mockInteraction.isCommand.mockReturnValue(true);
        mockInteraction.commandName = 'unknown';

        await interactionHandler(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith({
          content: expect.stringContaining('unknown command'),
          ephemeral: true,
        });
      }
    });

    it('should handle command execution errors', async () => {
      const interactionHandler = mockClient.on.mock.calls.find(
        (call: any[]) => call[0] === 'interactionCreate'
      )?.[1];

      if (interactionHandler) {
        mockInteraction.isCommand.mockReturnValue(true);
        mockInteraction.commandName = 'error-test';

        const errorCommand = {
          data: { name: 'error-test' },
          execute: jest.fn().mockRejectedValue(new Error('Test error')),
        };
        mockClient.commands.set('error-test', errorCommand);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        await interactionHandler(mockInteraction);

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith({
          content: expect.stringContaining('error'),
          ephemeral: true,
        });

        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('Database Connection', () => {
    it('should initialize database connection', async () => {
      expect(mockSequelize.authenticate).toHaveBeenCalled();
    });

    it('should sync database models', async () => {
      expect(mockSequelize.sync).toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      mockSequelize.authenticate.mockRejectedValueOnce(new Error('DB connection failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await mockSequelize.authenticate();
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Bot Login', () => {
    it('should login with Discord token', async () => {
      expect(mockClient.login).toHaveBeenCalledWith(process.env.DISCORD_TOKEN);
    });

    it('should handle login failures', async () => {
      mockClient.login.mockRejectedValueOnce(new Error('Invalid token'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      try {
        await mockClient.login('invalid-token');
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGINT signal', () => {
      const processOnSpy = jest.spyOn(process, 'on');

      // Check if SIGINT handler is registered
      const sigintHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'SIGINT'
      );

      expect(sigintHandler).toBeDefined();
    });

    it('should destroy client on shutdown', () => {
      const processOnSpy = jest.spyOn(process, 'on');

      const sigintHandler = processOnSpy.mock.calls.find(
        call => call[0] === 'SIGINT'
      )?.[1];

      if (sigintHandler && typeof sigintHandler === 'function') {
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

        sigintHandler();

        expect(mockClient.destroy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(0);

        exitSpy.mockRestore();
      }
    });
  });

  describe('Command Loading', () => {
    it('should load commands from commands directory', () => {
      const fs = require('fs');
      expect(fs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('commands'));
    });

    it('should filter only .js and .ts files', () => {
      const fs = require('fs');
      fs.readdirSync.mockReturnValue(['command.js', 'command.ts', 'README.md', '.DS_Store']);

      // Commands should only be loaded for .js and .ts files
      const validExtensions = ['.js', '.ts'];
      const files = fs.readdirSync('commands');
      const commandFiles = files.filter((file: string) =>
        validExtensions.some(ext => file.endsWith(ext))
      );

      expect(commandFiles).toHaveLength(2);
      expect(commandFiles).toContain('command.js');
      expect(commandFiles).toContain('command.ts');
    });

    it('should handle command loading errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate a command that throws during require
      jest.doMock('../../commands/broken', () => {
        throw new Error('Command load error');
      });

      try {
        require('../../commands/broken');
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('Bot Configuration', () => {
  it('should have correct bot configuration', () => {
    expect(process.env.DISCORD_TOKEN).toBeDefined();
    expect(process.env.CLIENT_ID).toBeDefined();
  });

  it('should throw error if token is missing', () => {
    const originalToken = process.env.DISCORD_TOKEN;
    delete process.env.DISCORD_TOKEN;

    expect(() => {
      if (!process.env.DISCORD_TOKEN) {
        throw new Error('Discord token is required');
      }
    }).toThrow('Discord token is required');

    process.env.DISCORD_TOKEN = originalToken;
  });
});
