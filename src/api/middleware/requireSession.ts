import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/utils/logger';

/**
 * Session data interface - extends express-session
 */
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    guildId?: string;
  }
}

/**
 * Session validation middleware
 * Ensures user has valid session before accessing protected routes
 * Replaces Basic Auth middleware
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requireSession(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  logger.debug('[SESSION] Session validation attempt', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    sessionID: req.sessionID,
    hasSession: !!req.session,
    timestamp: new Date().toISOString(),
  });

  // Check if session exists and has userId
  if (req.session && req.session.userId) {
    logger.info('[SESSION] Session validation successful', {
      username: req.session.username,
      path: req.path,
      method: req.method,
      duration: Date.now() - startTime,
    });

    // Session is valid, continue
    return next();
  }

  // No valid session - return 401
  logger.warn('[SESSION] No valid session found', {
    path: req.path,
    ip: req.ip,
    sessionID: req.sessionID,
  });

  res.status(401).json({
    success: false,
    message: 'Authentication required',
  });
}
