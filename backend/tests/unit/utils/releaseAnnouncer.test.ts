/**
 * Unit Tests: Release Announcer
 *
 * Tests the announceRelease() utility that posts release notes
 * to Discord when a new version is deployed.
 */

// Mock logger BEFORE imports
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../../shared/utils/logger', () => ({
  logger: mockLogger,
  createLogger: jest.fn(() => mockLogger),
}));

// Mock fs module
const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();

jest.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
}));

// Mock config
jest.mock('../../../config/config', () => ({
  __esModule: true,
  default: {
    settings: {
      defaultReminderChannel: 'channel-123',
    },
  },
}));

import { announceRelease } from '../../../utils/releaseAnnouncer';

// Helper to build a mock Discord client
function createMockClient(channelOverrides: Record<string, unknown> = {}) {
  const mockSend = jest.fn().mockResolvedValue({});
  const mockChannel = {
    id: 'channel-123',
    send: mockSend,
    ...channelOverrides,
  };
  const mockClient = {
    channels: {
      fetch: jest.fn().mockResolvedValue(mockChannel),
    },
  };
  return { mockClient, mockChannel, mockSend };
}

// Default CHANGELOG content
const MOCK_CHANGELOG = `# Changelog

## [2.2.0] - 2026-02-17

### Added

- Feature X
- Feature Y

### Fixed

- Bug Z

## [2.1.0] - 2026-02-11

### Added

- Old feature
`;

describe('announceRelease()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  /**
   * Helper: set up fs mocks for a standard announcement scenario
   */
  function setupFsMocks(
    opts: {
      version?: string;
      lastAnnounced?: string | null;
      changelog?: string;
    } = {}
  ) {
    const version = opts.version ?? '2.2.0';
    const changelog = opts.changelog ?? MOCK_CHANGELOG;

    mockReadFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('package.json')) {
        return JSON.stringify({ version });
      }
      if (filePath.includes('.last-announced-version')) {
        if (opts.lastAnnounced === null || opts.lastAnnounced === undefined) {
          throw new Error('ENOENT: no such file');
        }
        return opts.lastAnnounced;
      }
      if (filePath.includes('CHANGELOG.md')) {
        return changelog;
      }
      throw new Error(`Unexpected file read: ${filePath}`);
    });
  }

  test('announces when version is newer than last announced', async () => {
    setupFsMocks({ lastAnnounced: '2.1.0' });
    const { mockClient, mockSend } = createMockClient();

    await announceRelease(mockClient as any);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const embedCall = mockSend.mock.calls[0][0];
    expect(embedCall.embeds).toHaveLength(1);

    const embed = embedCall.embeds[0].data;
    expect(embed.title).toBe('Bwaincell v2.2.0 Released');
    expect(embed.color).toBe(0x00b894);
    expect(embed.description).toContain('Feature X');
    expect(embed.description).toContain('Bug Z');

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Release announcement sent',
      expect.objectContaining({ version: '2.2.0' })
    );
  });

  test('skips when version matches last announced', async () => {
    setupFsMocks({ lastAnnounced: '2.2.0' });
    const { mockClient, mockSend } = createMockClient();

    await announceRelease(mockClient as any);

    expect(mockSend).not.toHaveBeenCalled();
  });

  test('skips when DEFAULT_REMINDER_CHANNEL is not set', async () => {
    // Temporarily override config
    const configModule = require('../../../config/config');
    const originalChannel = configModule.default.settings.defaultReminderChannel;
    configModule.default.settings.defaultReminderChannel = undefined;

    setupFsMocks({ lastAnnounced: '2.1.0' });
    const { mockClient, mockSend } = createMockClient();

    await announceRelease(mockClient as any);

    expect(mockSend).not.toHaveBeenCalled();

    // Restore
    configModule.default.settings.defaultReminderChannel = originalChannel;
  });

  test('announces on first deploy (no version file)', async () => {
    setupFsMocks({ lastAnnounced: null });
    const { mockClient, mockSend } = createMockClient();

    await announceRelease(mockClient as any);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test('announces version without notes when CHANGELOG section is missing', async () => {
    setupFsMocks({
      version: '9.9.9',
      lastAnnounced: '2.1.0',
      changelog: MOCK_CHANGELOG, // No 9.9.9 section
    });
    const { mockClient, mockSend } = createMockClient();

    await announceRelease(mockClient as any);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const embed = mockSend.mock.calls[0][0].embeds[0].data;
    expect(embed.title).toBe('Bwaincell v9.9.9 Released');
    expect(embed.description).toBeUndefined();
  });

  test('warns and skips when channel is not found', async () => {
    setupFsMocks({ lastAnnounced: '2.1.0' });
    const mockClient = {
      channels: {
        fetch: jest.fn().mockResolvedValue(null),
      },
    };

    await announceRelease(mockClient as any);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Release announcement channel not found or not a text channel',
      expect.objectContaining({ channelId: 'channel-123' })
    );
  });

  test('warns and does not throw when channel.send() fails', async () => {
    setupFsMocks({ lastAnnounced: '2.1.0' });
    const { mockClient, mockSend } = createMockClient();
    mockSend.mockRejectedValueOnce(new Error('Discord API error'));

    await announceRelease(mockClient as any);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Failed to send release announcement (non-fatal)',
      expect.objectContaining({ error: 'Discord API error' })
    );
  });

  test('updates version file after successful announcement', async () => {
    setupFsMocks({ lastAnnounced: '2.1.0' });
    const { mockClient } = createMockClient();

    await announceRelease(mockClient as any);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.last-announced-version'),
      '2.2.0',
      'utf-8'
    );
  });

  test('does not update version file when send fails', async () => {
    setupFsMocks({ lastAnnounced: '2.1.0' });
    const { mockClient, mockSend } = createMockClient();
    mockSend.mockRejectedValueOnce(new Error('send failed'));

    await announceRelease(mockClient as any);

    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  test('truncates release notes exceeding 4096 char embed limit', async () => {
    const longNotes = '### Added\n\n' + '- Feature line\n'.repeat(500);
    const longChangelog = `# Changelog\n\n## [2.2.0] - 2026-02-17\n\n${longNotes}\n\n## [2.1.0] - 2026-02-11\n\n### Added\n\n- Old\n`;

    setupFsMocks({ lastAnnounced: '2.1.0', changelog: longChangelog });
    const { mockClient, mockSend } = createMockClient();

    await announceRelease(mockClient as any);

    const embed = mockSend.mock.calls[0][0].embeds[0].data;
    expect(embed.description.length).toBeLessThanOrEqual(4096);
    expect(embed.description).toMatch(/\.\.\.$/);
  });

  test('creates data directory if it does not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    setupFsMocks({ lastAnnounced: '2.1.0' });
    const { mockClient } = createMockClient();

    await announceRelease(mockClient as any);

    expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });
});
