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
import quoteCommand from '../../../commands/quote';
import { logger } from '../../../shared/utils/logger';

describe('/make-it-a-quote Slash Command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;
  let mockTargetMessage: any;
  let mockChannel: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock target message
    mockTargetMessage = {
      content: 'This is a test quote message',
      author: {
        id: 'author123',
        username: 'TestAuthor',
        displayAvatarURL: jest
          .fn()
          .mockReturnValue('https://cdn.discordapp.com/avatars/author123/avatar.png'),
      },
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
          if (name === 'message_id') return 'test-message-id-123';
          return null;
        }),
      } as any,
      channel: mockChannel as any,
      guild: {
        id: 'guild123',
      } as any,
      deferReply: jest.fn(),
      editReply: jest.fn(),
      reply: jest.fn(),
      deferred: true,
      commandName: 'make-it-a-quote',
    };

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

    it('should have message_id option', () => {
      const options = (quoteCommand.data as any).options;
      expect(options).toBeDefined();
      expect(options.length).toBe(1);
      expect(options[0].name).toBe('message_id');
      expect(options[0].description).toContain('Copy Message ID');
      expect(options[0].required).toBe(true);
    });
  });

  describe('execute', () => {
    it('should fetch message by ID from channel', async () => {
      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.options.getString).toHaveBeenCalledWith('message_id', true);
      expect(mockChannel.messages.fetch).toHaveBeenCalledWith('test-message-id-123');
    });

    it('should generate and send quote image successfully', async () => {
      const mockImageBuffer = Buffer.from('test-image-data');
      mockGenerateQuoteImage.mockResolvedValue(mockImageBuffer);

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      // Verify image generation was called with correct parameters
      expect(mockGenerateQuoteImage).toHaveBeenCalledWith(
        'https://cdn.discordapp.com/avatars/author123/avatar.png',
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

    it('should request avatar with correct parameters', async () => {
      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockTargetMessage.author.displayAvatarURL).toHaveBeenCalledWith({
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

    it('should handle missing guild context', async () => {
      mockInteraction.guild = null as any;

      await quoteCommand.execute(mockInteraction as ChatInputCommandInteraction);

      // Should still work, just log with undefined guildId
      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          guildId: undefined,
        })
      );
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
            if (name === 'message_id') return 'test-message-id-456';
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
});
