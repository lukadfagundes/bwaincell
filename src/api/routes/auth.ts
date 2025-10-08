import { Router, Request, Response } from 'express';
import { logger } from '@shared/utils/logger';

const router = Router();

/**
 * User credentials mapping
 * Uses same credentials as existing Basic Auth system
 */
interface User {
  password: string;
  discordId: string;
  guildId: string;
}

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
 * POST /api/auth/login
 * Login endpoint - creates server-side session
 *
 * @body username - Username (strawhatluka or dandelion)
 * @body password - User password
 * @returns Success response with user info
 */
router.post('/login', (req: Request, res: Response) => {
  const startTime = Date.now();
  const { username, password } = req.body;

  logger.debug('[AUTH] Login attempt', {
    username: username,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Validate input
  if (!username || !password) {
    logger.warn('[AUTH] Missing credentials', {
      hasUsername: !!username,
      hasPassword: !!password,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      message: 'Username and password required',
    });
  }

  // Validate credentials
  const user = USERS[username.toLowerCase()];

  if (!user || user.password !== password) {
    logger.warn('[AUTH] Invalid credentials', {
      username: username,
      ip: req.ip,
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Validate environment configuration
  if (!user.discordId || !user.guildId) {
    logger.error('[AUTH] Missing user configuration', {
      username: username,
      hasDiscordId: !!user.discordId,
      hasGuildId: !!user.guildId,
    });

    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
  }

  // Create session
  req.session.userId = user.discordId;
  req.session.username = username.toLowerCase();
  req.session.guildId = user.guildId;

  logger.info('[AUTH] Session created', {
    sessionId: req.sessionID,
    username: username.toLowerCase(),
    duration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      username: username.toLowerCase(),
      guildId: user.guildId,
    },
  });
});

/**
 * POST /api/auth/logout
 * Logout endpoint - destroys server-side session
 *
 * @returns Success response
 */
router.post('/logout', (req: Request, res: Response) => {
  const username = req.session?.username;
  const sessionId = req.sessionID;

  logger.debug('[AUTH] Logout attempt', {
    username: username,
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
  });

  req.session.destroy((err) => {
    if (err) {
      logger.error('[AUTH] Session destroy error', {
        error: err.message,
        stack: err.stack,
        username: username,
        sessionId: sessionId,
      });

      return res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }

    res.clearCookie('bwaincell.sid');

    logger.info('[AUTH] Session destroyed', {
      username: username,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  });
});

/**
 * GET /api/auth/session
 * Session validation endpoint
 * Checks if user has valid session
 *
 * @returns Session status and user info if authenticated
 */
router.get('/session', (req: Request, res: Response) => {
  logger.debug('[AUTH] Session check', {
    sessionId: req.sessionID,
    hasSession: !!req.session,
    hasUserId: !!(req.session && req.session.userId),
    timestamp: new Date().toISOString(),
  });

  if (req.session && req.session.userId) {
    logger.info('[AUTH] Valid session found', {
      username: req.session.username,
      sessionId: req.sessionID,
    });

    res.json({
      authenticated: true,
      user: {
        username: req.session.username,
        guildId: req.session.guildId,
      },
    });
  } else {
    logger.debug('[AUTH] No active session', {
      sessionId: req.sessionID,
    });

    res.status(401).json({
      authenticated: false,
      message: 'No active session',
    });
  }
});

export default router;
