import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { logger } from '@shared/utils/logger';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ALLOWED_EMAILS = (process.env.ALLOWED_GOOGLE_EMAILS || '').split(',').map((e) => e.trim());

// Validate JWT_SECRET is set - fail fast for security
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Extended request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: {
    googleId: string;
    email: string;
    name: string;
    discordId: string;
    guildId: string;
  };
}

/**
 * Verify Google ID token
 */
export async function verifyGoogleToken(token: string): Promise<{
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
} | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      logger.warn('[OAUTH] No payload in Google token');
      return null;
    }

    // Check email whitelist
    if (!ALLOWED_EMAILS.includes(payload.email || '')) {
      logger.warn('[OAUTH] Email not in whitelist', { email: payload.email });
      return null;
    }

    return {
      googleId: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture || null,
    };
  } catch (error) {
    logger.error('[OAUTH] Token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(user: {
  googleId: string;
  email: string;
  discordId: string;
  guildId: string;
}): string {
  return jwt.sign(
    {
      googleId: user.googleId,
      email: user.email,
      discordId: user.discordId,
      guildId: user.guildId,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(googleId: string): string {
  return jwt.sign({ googleId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify JWT access token middleware
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('[OAUTH] Missing or invalid Authorization header', {
      path: req.path,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      message: 'Authorization required',
    });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      googleId: string;
      email: string;
      discordId: string;
      guildId: string;
    };

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      googleId: decoded.googleId,
      email: decoded.email,
      name: '', // Will be fetched from DB if needed
      discordId: decoded.discordId,
      guildId: decoded.guildId,
    };

    logger.debug('[OAUTH] Token verified', {
      email: decoded.email,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error('[OAUTH] Token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    });

    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}
