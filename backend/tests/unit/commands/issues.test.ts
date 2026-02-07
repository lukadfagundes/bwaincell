/**
 * Unit tests for /issues Discord command
 *
 * Tests the Discord slash command that creates GitHub issues.
 */

// Mock dependencies BEFORE imports
const mockGithubService = {
  isConfigured: jest.fn(),
  createIssue: jest.fn(),
};

jest.mock('../../../utils/githubService', () => ({
  githubService: mockGithubService,
}));

jest.mock('../../../shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { ChatInputCommandInteraction } from 'discord.js';
import issuesCommand from '../../../commands/issues';
import { logger } from '../../../shared/utils/logger';

describe('/issues Discord Command', () => {
  let mockInteraction: Partial<ChatInputCommandInteraction>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockGithubService.isConfigured.mockReturnValue(true);
    mockGithubService.createIssue.mockResolvedValue({
      success: true,
      issueNumber: 42,
      issueUrl: 'https://github.com/test-owner/test-repo/issues/42',
    });

    // Create mock interaction
    mockInteraction = {
      user: {
        id: 'user123',
        username: 'testuser',
      } as any,
      guild: {
        id: 'guild123',
      } as any,
      options: {
        getString: jest.fn((name: string, _required?: boolean) => {
          if (name === 'title') return 'Test Issue Title';
          if (name === 'description') return 'This is a test description';
          if (name === 'type') return 'bug';
          return null;
        }),
      } as any,
      editReply: jest.fn(),
      followUp: jest.fn(),
      replied: false,
      deferred: true,
      commandName: 'issues',
    };
  });

  describe('Command Configuration', () => {
    it('should have correct command name', () => {
      expect(issuesCommand.data.name).toBe('issues');
    });

    it('should have correct description', () => {
      expect(issuesCommand.data.description).toBe(
        'Submit an issue or suggestion to the GitHub repository'
      );
    });

    it('should have required title option', () => {
      const options = (issuesCommand.data as any).options;
      const titleOption = options.find((opt: any) => opt.name === 'title');
      expect(titleOption).toBeDefined();
      expect(titleOption.required).toBe(true);
      expect(titleOption.max_length).toBe(100);
    });

    it('should have required description option', () => {
      const options = (issuesCommand.data as any).options;
      const descOption = options.find((opt: any) => opt.name === 'description');
      expect(descOption).toBeDefined();
      expect(descOption.required).toBe(true);
      expect(descOption.max_length).toBe(2000);
    });

    it('should have optional type option with correct choices', () => {
      const options = (issuesCommand.data as any).options;
      const typeOption = options.find((opt: any) => opt.name === 'type');
      expect(typeOption).toBeDefined();
      expect(typeOption.required).toBeFalsy();
      expect(typeOption.choices).toHaveLength(4);
      expect(typeOption.choices.map((c: any) => c.value)).toEqual([
        'bug',
        'feature',
        'question',
        'documentation',
      ]);
    });
  });

  describe('Guild Validation', () => {
    it('should reject DM usage (no guild)', async () => {
      mockInteraction.guild = null;

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in a server.',
      });
      expect(mockGithubService.createIssue).not.toHaveBeenCalled();
    });
  });

  describe('GitHub Service Configuration', () => {
    it('should check if GitHub service is configured', async () => {
      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGithubService.isConfigured).toHaveBeenCalled();
    });

    it('should reject if GitHub service is not configured', async () => {
      mockGithubService.isConfigured.mockReturnValue(false);

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: expect.stringContaining('GitHub integration is not configured'),
      });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('not configured'),
        expect.any(Object)
      );
      expect(mockGithubService.createIssue).not.toHaveBeenCalled();
    });
  });

  describe('Issue Creation - Success Cases', () => {
    it('should create issue with bug label', async () => {
      mockInteraction.options!.getString = jest.fn((name: string) => {
        if (name === 'title') return 'Bug: App crashes';
        if (name === 'description') return 'The app crashes when clicking submit';
        if (name === 'type') return 'bug';
        return null;
      });

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGithubService.createIssue).toHaveBeenCalledWith(
        'Bug: App crashes',
        expect.stringContaining('The app crashes when clicking submit'),
        ['bug']
      );
    });

    it('should create issue with enhancement label for feature type', async () => {
      mockInteraction.options!.getString = jest.fn((name: string) => {
        if (name === 'title') return 'Feature: Dark mode';
        if (name === 'description') return 'Add dark mode support';
        if (name === 'type') return 'feature';
        return null;
      });

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGithubService.createIssue).toHaveBeenCalledWith(
        'Feature: Dark mode',
        expect.stringContaining('Add dark mode support'),
        ['enhancement']
      );
    });

    it('should create issue with question label', async () => {
      mockInteraction.options!.getString = jest.fn((name: string) => {
        if (name === 'title') return 'How to deploy?';
        if (name === 'description') return 'Need deployment instructions';
        if (name === 'type') return 'question';
        return null;
      });

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGithubService.createIssue).toHaveBeenCalledWith(
        'How to deploy?',
        expect.stringContaining('Need deployment instructions'),
        ['question']
      );
    });

    it('should create issue with documentation label', async () => {
      mockInteraction.options!.getString = jest.fn((name: string) => {
        if (name === 'title') return 'API docs missing';
        if (name === 'description') return 'Need API documentation';
        if (name === 'type') return 'documentation';
        return null;
      });

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGithubService.createIssue).toHaveBeenCalledWith(
        'API docs missing',
        expect.stringContaining('Need API documentation'),
        ['documentation']
      );
    });

    it('should create issue with no labels when type is not provided', async () => {
      mockInteraction.options!.getString = jest.fn((name: string) => {
        if (name === 'title') return 'General issue';
        if (name === 'description') return 'Some general feedback';
        if (name === 'type') return null;
        return null;
      });

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockGithubService.createIssue).toHaveBeenCalledWith(
        'General issue',
        expect.stringContaining('Some general feedback'),
        []
      );
    });

    it('should include user metadata in issue body', async () => {
      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      const issueBody = mockGithubService.createIssue.mock.calls[0][1];
      expect(issueBody).toContain('testuser');
      expect(issueBody).toContain('user123');
      expect(issueBody).toContain('guild123');
      expect(issueBody).toContain('bug');
    });

    it('should send success embed with issue details', async () => {
      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: '✅ Issue Created Successfully',
              }),
            }),
          ]),
          components: expect.any(Array),
        })
      );
    });

    it('should include View on GitHub button in success response', async () => {
      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      const replyCall = mockInteraction.editReply as jest.Mock;
      const replyData = replyCall.mock.calls[0][0];
      expect(replyData.components).toHaveLength(1);
      expect(replyData.components[0].components).toHaveLength(2);
    });

    it('should log successful issue creation', async () => {
      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('created'),
        expect.objectContaining({
          issueNumber: 42,
          issueUrl: 'https://github.com/test-owner/test-repo/issues/42',
        })
      );
    });
  });

  describe('Issue Creation - Error Cases', () => {
    it('should handle GitHub service error', async () => {
      mockGithubService.createIssue.mockResolvedValue({
        success: false,
        error: 'GitHub API rate limit exceeded',
      });

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        embeds: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              title: '❌ Failed to Create Issue',
              description: 'GitHub API rate limit exceeded',
            }),
          }),
        ]),
      });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('creation failed'),
        expect.any(Object)
      );
    });

    it('should handle unexpected exception', async () => {
      mockGithubService.createIssue.mockRejectedValue(new Error('Network timeout'));

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in issues command'),
        expect.objectContaining({
          error: 'Network timeout',
        })
      );
    });

    it('should send error message via followUp if already replied', async () => {
      mockInteraction.replied = true;
      mockGithubService.createIssue.mockRejectedValue(new Error('Test error'));

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.followUp).toHaveBeenCalledWith({
        content: expect.stringContaining('error occurred'),
      });
    });

    it('should send error message via followUp if deferred', async () => {
      mockInteraction.replied = false;
      mockInteraction.deferred = true;
      mockGithubService.createIssue.mockRejectedValue(new Error('Test error'));

      await issuesCommand.execute(mockInteraction as ChatInputCommandInteraction);

      expect(mockInteraction.followUp).toHaveBeenCalledWith({
        content: expect.stringContaining('error occurred'),
      });
    });
  });
});
