import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/utils/logger';

/**
 * User interface for authenticated requests
 */
interface User {
  password: string;
  discordId: string;
  guildId: string;
}

/**
 * Extended request interface with user context
 */
export interface AuthenticatedRequest extends Request {
  user: {
    username: string;
    discordId: string;
    guildId: string;
  };
}

/**
 * User credentials mapping
 * Environment variables required:
 * - STRAWHATLUKA_PASSWORD
 * - STRAWHATLUKA_DISCORD_ID
 * - DANDELION_PASSWORD
 * - DANDELION_DISCORD_ID
 * - GUILD_ID
 */
const USERS: Record<string, User> = {
  strawhatluka: {
    password: process.env.STRAWHATLUKA_PASSWORD || '',
    discordId: process.env.STRAWHATLUKA_DISCORD_ID || '',
    guildId: process.env.GUILD_ID || '',
  },
  dandelion: {
    password: process.env.DANDELION_PASSWORD || '',
    discordId: process.env.DANDELION_DISCORD_ID || '',
    guildId: process.env.GUILD_ID || '',
  },
};

/**
 * Basic Authentication middleware
 * Validates HTTP Basic Auth credentials against hardcoded user list
 * Attaches user context to request object for downstream route handlers
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  logger.debug('[AUTH] Authentication attempt', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Check for Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    logger.warn('[AUTH] Missing or invalid authorization header', {
      path: req.path,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized - Basic authentication required',
    });
    return;
  }

  try {
    // Parse Basic Auth credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Validate credentials
    const user = USERS[username.toLowerCase()];

    if (!user || user.password !== password) {
      logger.warn('[AUTH] Invalid credentials', {
        username: username,
        path: req.path,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Validate environment configuration
    if (!user.discordId || !user.guildId) {
      logger.error('[AUTH] Missing user configuration', {
        username: username,
        hasDiscordId: !!user.discordId,
        hasGuildId: !!user.guildId,
      });

      res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
      return;
    }

    // Attach user context to request
    (req as AuthenticatedRequest).user = {
      username: username.toLowerCase(),
      discordId: user.discordId,
      guildId: user.guildId,
    };

    logger.info('[AUTH] Authentication successful', {
      username: username.toLowerCase(),
      path: req.path,
      method: req.method,
      duration: Date.now() - startTime,
    });

    next();
  } catch (error) {
    logger.error('[AUTH] Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}
