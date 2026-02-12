/**
 * Unit tests for /make-it-a-quote slash command
 *
 * Tests the Discord slash command that generates quote images from message IDs.
 */

// Mock dependencies BEFORE imports
const mockGenerateQuoteImage = jest.fn();

jest.mock('../../../utils/imageService', () => ({
  ImageService: {
    generateQuoteImage: mockGenerateQuoteImage,
  },
}));

jest.mock('../../../shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { ChatInputCommandInteraction } from 'discord.js';
import quoteCommand, { parseMessageInput } from '../../../commands/quote';
import { logger } from '../../../shared/utils/logger';

describe('/make-it-a-quote Slash Command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockTargetMessage: any;
  let mockChannel: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock target message (member is null by default — matching real-world behavior
    // for other users' fetched messages where Discord API doesn't include member data)
    mockTargetMessage = {
      content: 'This is a test quote message',
      author: {
        id: 'author123',
        username: 'TestAuthor',
        displayAvatarURL: jest
          .fn()
          .mockReturnValue('https://cdn.discordapp.com/avatars/author123/avatar.png'),
      },
      member: null,
    };

    // Setup mock channel with message fetch capability
    mockChannel = {
      messages: {
        fetch: jest.fn().mockResolvedValue(mockTargetMessage),
      },
    };

    // Create mock interaction
    mockInteraction = {
      options: {
        getString: jest.fn((name: string) => {
          if (name === 'message_link') return 'test-message-id-123';
          return null;
        }),
      } as any,
      channel: mockChannel as any,
      guild: {
        id: 'guild123',
        channels: { fetch: jest.fn() },
        members: { fetch: jest.fn() },
      } as any,
      deferReply: jest.fn(),
      editReply: jest.fn(),
      reply: jest.fn(),
      deferred: true,
      commandName: 'make-it-a-quote',
    };

    // Mock guild.members.fetch to return a member with server avatar by default
    (mockInteraction.guild as any).members.fetch.mockResolvedValue({
      displayAvatarURL: jest
        .fn()
        .mockReturnValue('https://cdn.discordapp.com/guilds/guild123/users/author123/avatar.png'),
    });

    // Mock successful image generation by default
    mockGenerateQuoteImage.mockResolvedValue(Buffer.from('fake-image-data'));
  });

  describe('Command Configuration', () => {
    it('should have correct command name', () => {
      expect(quoteCommand.data.name).toBe('make-it-a-quote');
    });

    it('should have a description', () => {
      expect(quoteCommand.data.description).toBe('Generate a dramatic quote image from a message');
    });

    it('should have message_link option', () => {
      const options = (quoteCommand.data as any).options;
      expect(options).toBeDefined();
      expect(options.length).toBe(1);
      expect(options[0].name).toBe('message_link');
      expect(options[0].description).toContain('Copy Message Link');
      expect(options[0].required).toBe(true);
    });
  });

  describe('execute', () => {
    it('should fetch message by ID from channel', async () => {
      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.options.getString).toHaveBeenCalledWith('message_link', true);
      expect(mockChannel.messages.fetch).toHaveBeenCalledWith('test-message-id-123');
    });

    it('should generate and send quote image successfully', async () => {
      const mockImageBuffer = Buffer.from('test-image-data');
      mockGenerateQuoteImage.mockResolvedValue(mockImageBuffer);

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      // Verify image generation was called with correct parameters
      // Uses server avatar (from guild.members.fetch) since targetMessage.member is null
      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        'https://cdn.discordapp.com/guilds/guild123/users/author123/avatar.png',
        'This is a test quote message',
        'TestAuthor'
      );

      // Verify reply with image
      expect(mockInteraction.editReply).toHaveBeenCalled();
      const replyCall = (mockInteraction.editReply as jest.Mock).mock.calls[0][0];
      expect(replyCall.content).toContain('quote');
      expect(replyCall.files).toBeDefined();
      expect(replyCall.files.length).toBe(1);
    });

    it('should log generation start and success', async () => {
      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(logger.info).toHaveBeenCalledWith(
        'Generating quote image for message from TestAuthor',
        expect.objectContaining({
          userId: 'author123',
          guildId: 'guild123',
          messageLength: expect.any(Number),
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Quote image sent successfully for TestAuthor',
        expect.objectContaining({
          userId: 'author123',
          guildId: 'guild123',
        })
      );
    });

    it('should request avatar with correct parameters via guild member fetch', async () => {
      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      // Since targetMessage.member is null, guild.members.fetch is called
      expect((mockInteraction.guild as any).members.fetch).toHaveBeenCalledWith('author123');
      // The fetched member's displayAvatarURL is called with correct params
      const fetchedMember = await (mockInteraction.guild as any).members.fetch.mock.results[0]
        .value;
      expect(fetchedMember.displayAvatarURL).toHaveBeenCalledWith({
        extension: 'png',
        size: 512,
      });
    });

    it('should handle missing channel context', async () => {
      mockInteraction.channel = null as any;

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in a text channel.',
      });

      expect(mockChannel.messages.fetch).not.toHaveBeenCalled();
      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });

    it('should handle message fetch error (not found)', async () => {
      mockChannel.messages.fetch.mockRejectedValue(new Error('Unknown Message'));

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch message for quote:',
        expect.objectContaining({
          messageId: 'test-message-id-123',
          channelId: null,
          error: expect.any(Error),
        })
      );

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: expect.stringContaining('Could not find message with that ID'),
      });

      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });

    it('should handle invalid message ID format', async () => {
      mockChannel.messages.fetch.mockRejectedValue(new Error('Invalid Form Body'));

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: expect.stringContaining('Could not find message with that ID'),
      });

      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });

    it('should handle Discord API errors', async () => {
      mockChannel.messages.fetch.mockRejectedValue(new Error('API Error: Rate Limited'));

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: expect.stringContaining('Could not find message'),
      });

      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });

    it('should handle message with no text content', async () => {
      mockTargetMessage.content = '';

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: '❌ The selected message has no text content.',
      });

      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });

    it('should handle message with only whitespace', async () => {
      mockTargetMessage.content = '   \n  \t  ';

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: '❌ The selected message has no text content.',
      });

      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });

    it('should handle image generation failure', async () => {
      mockGenerateQuoteImage.mockRejectedValue(new Error('Canvas error'));

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to generate quote image:',
        expect.any(Error)
      );

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: '❌ Failed to generate quote image. Please try again.',
      });
    });

    it('should use reply method if interaction is not deferred on error', async () => {
      mockInteraction.deferred = false;
      mockGenerateQuoteImage.mockRejectedValue(new Error('Test error'));

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: '❌ Failed to generate quote image. Please try again.',
        ephemeral: true,
      });
    });

    it('should handle long quote text', async () => {
      const longText = 'a'.repeat(2000); // 2000 character message
      mockTargetMessage.content = longText;

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        expect.any(String),
        longText,
        'TestAuthor'
      );
    });

    it('should handle special characters in quote', async () => {
      mockTargetMessage.content = 'Quote with émojis 🎨 and spëcial çhars!';

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        expect.any(String),
        'Quote with émojis 🎨 and spëcial çhars!',
        'TestAuthor'
      );
    });

    it('should handle quotes with line breaks', async () => {
      mockTargetMessage.content = 'First line\nSecond line\nThird line';

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        expect.any(String),
        'First line\nSecond line\nThird line',
        'TestAuthor'
      );
    });

    it('should handle username with special characters', async () => {
      mockTargetMessage.author.username = 'User_123-Test';

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'User_123-Test'
      );
    });

    it('should handle missing guild context (falls back to global avatar)', async () => {
      mockInteraction.guild = null as any;

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      // Should still work, just log with undefined guildId and use global avatar
      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          guildId: undefined,
        })
      );
      // Uses global avatar since guild is null (can't fetch member)
      expect(mockTargetMessage.author.displayAvatarURL).toHaveBeenCalledWith({
        extension: 'png',
        size: 512,
      });
    });

    it('should create AttachmentBuilder with correct filename', async () => {
      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      const replyCall = (mockInteraction.editReply as jest.Mock).mock.calls[0][0];
      expect(replyCall.files).toBeDefined();
      expect(replyCall.files[0]).toBeDefined();
      // AttachmentBuilder creates an object with attachment and name properties
      expect(replyCall.files[0]).toHaveProperty('attachment');
      expect(replyCall.files[0]).toHaveProperty('name', 'quote.png');
    });

    it('should handle concurrent executions gracefully', async () => {
      const mockImageBuffer1 = Buffer.from('image-1');
      const mockImageBuffer2 = Buffer.from('image-2');

      mockGenerateQuoteImage
        .mockResolvedValueOnce(mockImageBuffer1)
        .mockResolvedValueOnce(mockImageBuffer2);

      // Create second mock channel for second interaction
      const mockChannel2 = {
        messages: {
          fetch: jest.fn().mockResolvedValue({
            ...mockTargetMessage,
            content: 'Second quote',
          }),
        },
      };

      const mockInteraction2 = {
        ...mockInteraction,
        channel: mockChannel2 as any,
        options: {
          getString: jest.fn((name: string) => {
            if (name === 'message_link') return 'test-message-id-456';
            return null;
          }),
        } as any,
        deferReply: jest.fn(),
        editReply: jest.fn(),
      };

      // Execute both in parallel
      await Promise.all([
        quoteCommand.execute(mockInteraction as ChatInputCommandInteraction),
        quoteCommand.execute(mockInteraction2 as ChatInputCommandInteraction),
      ]);

      expect(mockGenerateQuoteImage).toHaveBeenCalledTimes(2);
      expect(mockInteraction.editReply).toHaveBeenCalled();
      expect(mockInteraction2.editReply).toHaveBeenCalled();
    });
  });

  describe('parseMessageInput', () => {
    it('should extract IDs from a valid Discord message link', () => {
      const result = parseMessageInput(
        'https://discord.com/channels/111222333/444555666/777888999'
      );
      expect(result).toEqual({
        guildId: '111222333',
        channelId: '444555666',
        messageId: '777888999',
      });
    });

    it('should return plain message ID with nulls for channel/guild', () => {
      const result = parseMessageInput('777888999');
      expect(result).toEqual({
        messageId: '777888999',
        channelId: null,
        guildId: null,
      });
    });

    it('should treat malformed link as plain ID', () => {
      const result = parseMessageInput('discord.com/channels/abc/def/ghi');
      expect(result).toEqual({
        messageId: 'discord.com/channels/abc/def/ghi',
        channelId: null,
        guildId: null,
      });
    });

    it('should handle link with extra query params', () => {
      const result = parseMessageInput(
        'https://discord.com/channels/111/222/333?extra=param#fragment'
      );
      expect(result).toEqual({
        guildId: '111',
        channelId: '222',
        messageId: '333',
      });
    });
  });

  describe('cross-channel fetch', () => {
    let mockTargetChannel: any;

    beforeEach(() => {
      mockTargetChannel = {
        isTextBased: jest.fn().mockReturnValue(true),
        messages: {
          fetch: jest.fn().mockResolvedValue(mockTargetMessage),
        },
      };
      (mockInteraction.guild as any).channels.fetch.mockResolvedValue(mockTargetChannel);
    });

    it('should fetch message from extracted channel when link provided', async () => {
      (mockInteraction.options as any).getString = jest.fn(
        () => 'https://discord.com/channels/111222333/444555666/777888999'
      );
      (mockInteraction.guild as any).id = '111222333';

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect((mockInteraction.guild as any).channels.fetch).toHaveBeenCalledWith('444555666');
      expect(mockTargetChannel.messages.fetch).toHaveBeenCalledWith('777888999');
      expect(mockChannel.messages.fetch).not.toHaveBeenCalled();
    });

    it('should error when guild ID in link mismatches', async () => {
      (mockInteraction.options as any).getString = jest.fn(
        () => 'https://discord.com/channels/999999999/444555666/777888999'
      );

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: '❌ That message link points to a different server.',
      });
      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });

    it('should error when target channel not found', async () => {
      (mockInteraction.options as any).getString = jest.fn(
        () => 'https://discord.com/channels/111222333/444555666/777888999'
      );
      (mockInteraction.guild as any).id = '111222333';
      (mockInteraction.guild as any).channels.fetch.mockRejectedValue(new Error('Unknown Channel'));

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: expect.stringContaining('Could not access the channel'),
      });
      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });

    it('should error when target channel is not text-based', async () => {
      (mockInteraction.options as any).getString = jest.fn(
        () => 'https://discord.com/channels/111222333/444555666/777888999'
      );
      (mockInteraction.guild as any).id = '111222333';
      mockTargetChannel.isTextBased.mockReturnValue(false);

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: '❌ The channel from that message link is not a text channel.',
      });
      expect(mockGenerateQuoteImage).not.toHaveBeenCalled();
    });
  });

  describe('server avatar resolution', () => {
    it('should use member displayAvatarURL when targetMessage.member exists', async () => {
      const mockMember = {
        displayAvatarURL: jest
          .fn()
          .mockReturnValue(
            'https://cdn.discordapp.com/guilds/guild123/users/author123/server-avatar.png'
          ),
      };
      mockTargetMessage.member = mockMember;

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockMember.displayAvatarURL).toHaveBeenCalledWith({
        extension: 'png',
        size: 512,
      });
      // guild.members.fetch should NOT be called since member already exists
      expect((mockInteraction.guild as any).members.fetch).not.toHaveBeenCalled();
      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        'https://cdn.discordapp.com/guilds/guild123/users/author123/server-avatar.png',
        expect.any(String),
        'TestAuthor'
      );
    });

    it('should fetch guild member when targetMessage.member is null', async () => {
      mockTargetMessage.member = null;

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect((mockInteraction.guild as any).members.fetch).toHaveBeenCalledWith('author123');
      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        'https://cdn.discordapp.com/guilds/guild123/users/author123/avatar.png',
        expect.any(String),
        'TestAuthor'
      );
    });

    it('should fall back to global avatar when guild member fetch fails', async () => {
      mockTargetMessage.member = null;
      (mockInteraction.guild as any).members.fetch.mockRejectedValue(new Error('Unknown Member'));

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect((mockInteraction.guild as any).members.fetch).toHaveBeenCalledWith('author123');
      // Falls back to author's global avatar
      expect(mockTargetMessage.author.displayAvatarURL).toHaveBeenCalledWith({
        extension: 'png',
        size: 512,
      });
      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        'https://cdn.discordapp.com/avatars/author123/avatar.png',
        expect.any(String),
        'TestAuthor'
      );
    });
  });
});
