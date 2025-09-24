import '@testing-library/jest-dom';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Discord.js client
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    commands: new Map(),
    login: jest.fn(),
    on: jest.fn(),
    once: jest.fn()
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    DirectMessages: 3
  },
  Collection: Map,
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis(),
    addNumberOption: jest.fn().mockReturnThis(),
    addBooleanOption: jest.fn().mockReturnThis(),
    toJSON: jest.fn()
  }))
}));

// Mock Sequelize
jest.mock('sequelize', () => {
  const actual = jest.requireActual('sequelize');
  return {
    ...actual,
    Sequelize: jest.fn().mockImplementation(() => ({
      sync: jest.fn(),
      authenticate: jest.fn()
    }))
  };
});

// Suppress console output during tests unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Set test timeout
jest.setTimeout(10000);

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});