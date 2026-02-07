import { Octokit } from '@octokit/rest';
import { logger } from '../shared/utils/logger';

/**
 * GitHub issue creation response
 */
export interface GitHubIssueResponse {
  success: boolean;
  issueNumber?: number;
  issueUrl?: string;
  error?: string;
}

/**
 * GitHub service for creating issues via Octokit API
 */
export class GitHubService {
  private octokit: Octokit | null = null;
  private repoOwner: string | null = null;
  private repoName: string | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize GitHub service with environment variables
   */
  private initialize(): void {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;

    if (!token || !owner || !repo) {
      logger.warn('GitHub service not configured - /issues command will be unavailable', {
        hasToken: !!token,
        hasOwner: !!owner,
        hasRepo: !!repo,
      });
      return;
    }

    try {
      this.octokit = new Octokit({
        auth: token,
      });
      this.repoOwner = owner;
      this.repoName = repo;
      this.initialized = true;

      logger.info('GitHub service initialized successfully', {
        repoOwner: owner,
        repoName: repo,
      });
    } catch (error) {
      logger.error('Failed to initialize GitHub service', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if GitHub service is properly configured
   */
  public isConfigured(): boolean {
    return this.initialized && this.octokit !== null;
  }

  /**
   * Create a GitHub issue
   * @param title - Issue title
   * @param body - Issue description
   * @param labels - Optional labels to add
   * @returns Issue creation response
   */
  public async createIssue(
    title: string,
    body: string,
    labels?: string[]
  ): Promise<GitHubIssueResponse> {
    if (!this.isConfigured()) {
      logger.error('GitHub service not configured - cannot create issue');
      return {
        success: false,
        error: 'GitHub integration not configured. Contact administrator.',
      };
    }

    try {
      logger.info('Creating GitHub issue', {
        title,
        bodyLength: body.length,
        labels: labels || [],
      });

      const response = await this.octokit!.rest.issues.create({
        owner: this.repoOwner!,
        repo: this.repoName!,
        title,
        body,
        labels,
      });

      logger.info('GitHub issue created successfully', {
        issueNumber: response.data.number,
        issueUrl: response.data.html_url,
      });

      return {
        success: true,
        issueNumber: response.data.number,
        issueUrl: response.data.html_url,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as { status?: number }).status;

      logger.error('Failed to create GitHub issue', {
        error: errorMessage,
        code: errorCode,
        title,
      });

      // Handle specific error codes
      if (errorCode === 401) {
        return {
          success: false,
          error: 'GitHub authentication failed. Invalid token.',
        };
      }

      if (errorCode === 403) {
        return {
          success: false,
          error: 'GitHub permission denied. Token lacks required permissions.',
        };
      }

      if (errorCode === 404) {
        return {
          success: false,
          error: 'GitHub repository not found. Check configuration.',
        };
      }

      if (errorCode === 429) {
        return {
          success: false,
          error: 'GitHub API rate limit exceeded. Please try again later.',
        };
      }

      // Generic error for unknown issues
      return {
        success: false,
        error: 'Failed to create GitHub issue. Please try again.',
      };
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService();
