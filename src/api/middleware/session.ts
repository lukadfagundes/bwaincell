import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';
import { logger } from '@shared/utils/logger';

const SQLiteStoreSession = SQLiteStore(session);

/**
 * Session middleware configuration
 * Provides server-side session management with SQLite persistence
 *
 * This replaces localStorage-based authentication to support Safari iOS PWA,
 * which has storage limitations due to Intelligent Tracking Prevention (ITP)
 */
export const sessionMiddleware = session({
  store: new SQLiteStoreSession({
    db: 'sessions.db',
    dir: './data', // Store in persistent volume
  }),
  secret: process.env.SESSION_SECRET || 'bwaincell-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'bwaincell.sid', // Custom name for security
  cookie: {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'none', // Required for cross-origin PWA
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    domain: process.env.COOKIE_DOMAIN || undefined, // .fly.dev for production
  },
});

logger.info('[SESSION] Session middleware configured', {
  sessionStore: 'SQLite',
  cookieName: 'bwaincell.sid',
  maxAge: '30 days',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none',
});
