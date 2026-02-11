import { SlashCommandBuilder } from 'discord.js';
import remindCommand from '../../../commands/remind';

// Mock dependencies
jest.mock('../../../shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../../config/config', () => ({
  __esModule: true,
  default: {
    settings: {
      timezone: 'America/Los_Angeles',
      defaultReminderChannel: 'test-channel-id',
    },
  },
}));

describe('Remind Command', () => {
  describe('Command Structure', () => {
    it('should have correct command name and description', () => {
      expect(remindCommand.data).toBeInstanceOf(SlashCommandBuilder);
      expect(remindCommand.data.name).toBe('remind');
      expect(remindCommand.data.description).toBe('Manage reminders');
    });

    it('should have all required subcommands', () => {
      const commandData = remindCommand.data.toJSON();
      const subcommandNames = commandData.options?.map((opt: any) => opt.name) || [];

      expect(subcommandNames).toContain('me');
      expect(subcommandNames).toContain('daily');
      expect(subcommandNames).toContain('weekly');
      expect(subcommandNames).toContain('monthly');
      expect(subcommandNames).toContain('yearly');
      expect(subcommandNames).toContain('list');
      expect(subcommandNames).toContain('delete');
    });

    it('should have monthly subcommand with correct options', () => {
      const commandData = remindCommand.data.toJSON();
      const monthlySubcommand = commandData.options?.find((opt: any) => opt.name === 'monthly');

      expect(monthlySubcommand).toBeDefined();
      expect(monthlySubcommand?.description).toBe('Set a monthly recurring reminder');

      const optionNames = monthlySubcommand?.options?.map((opt: any) => opt.name) || [];
      expect(optionNames).toContain('message');
      expect(optionNames).toContain('day');
      expect(optionNames).toContain('time');

      const dayOption = monthlySubcommand?.options?.find((opt: any) => opt.name === 'day');
      expect(dayOption?.min_value).toBe(1);
      expect(dayOption?.max_value).toBe(31);
    });

    it('should have yearly subcommand with correct options', () => {
      const commandData = remindCommand.data.toJSON();
      const yearlySubcommand = commandData.options?.find((opt: any) => opt.name === 'yearly');

      expect(yearlySubcommand).toBeDefined();
      expect(yearlySubcommand?.description).toBe('Set a yearly recurring reminder');

      const optionNames = yearlySubcommand?.options?.map((opt: any) => opt.name) || [];
      expect(optionNames).toContain('message');
      expect(optionNames).toContain('month');
      expect(optionNames).toContain('day');
      expect(optionNames).toContain('time');

      const monthOption = yearlySubcommand?.options?.find((opt: any) => opt.name === 'month');
      expect(monthOption?.choices).toHaveLength(12);
      expect(monthOption?.choices[0].name).toBe('January');
      expect(monthOption?.choices[0].value).toBe(1);
    });

    it('should have exactly 7 subcommands', () => {
      const commandData = remindCommand.data.toJSON();
      expect(commandData.options).toHaveLength(7);
    });
  });

  describe('Command Options Validation', () => {
    it('monthly subcommand should require all options', () => {
      const commandData = remindCommand.data.toJSON();
      const monthlySubcommand = commandData.options?.find((opt: any) => opt.name === 'monthly');

      const allRequired = monthlySubcommand?.options?.every((opt: any) => opt.required);
      expect(allRequired).toBe(true);
    });

    it('yearly subcommand should require all options', () => {
      const commandData = remindCommand.data.toJSON();
      const yearlySubcommand = commandData.options?.find((opt: any) => opt.name === 'yearly');

      const allRequired = yearlySubcommand?.options?.every((opt: any) => opt.required);
      expect(allRequired).toBe(true);
    });

    it('monthly day option should accept 1-31', () => {
      const commandData = remindCommand.data.toJSON();
      const monthlySubcommand = commandData.options?.find((opt: any) => opt.name === 'monthly');
      const dayOption = monthlySubcommand?.options?.find((opt: any) => opt.name === 'day');

      expect(dayOption?.min_value).toBe(1);
      expect(dayOption?.max_value).toBe(31);
      expect(dayOption?.type).toBe(4); // INTEGER type
    });

    it('yearly month option should have all 12 months', () => {
      const commandData = remindCommand.data.toJSON();
      const yearlySubcommand = commandData.options?.find((opt: any) => opt.name === 'yearly');
      const monthOption = yearlySubcommand?.options?.find((opt: any) => opt.name === 'month');

      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      monthNames.forEach((monthName, index) => {
        const choice = monthOption?.choices?.find((c: any) => c.name === monthName);
        expect(choice).toBeDefined();
        expect(choice?.value).toBe(index + 1);
      });
    });
  });

  describe('Autocomplete Function', () => {
    it('should have autocomplete function defined', () => {
      expect(remindCommand.autocomplete).toBeDefined();
      expect(typeof remindCommand.autocomplete).toBe('function');
    });
  });

  describe('Execute Function', () => {
    it('should have execute function defined', () => {
      expect(remindCommand.execute).toBeDefined();
      expect(typeof remindCommand.execute).toBe('function');
    });
  });
});
