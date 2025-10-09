import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from '@shared/utils/logger';

// Import route modules
import healthRouter from './routes/health';
import tasksRouter from './routes/tasks';
import listsRouter from './routes/lists';
import notesRouter from './routes/notes';
import remindersRouter from './routes/reminders';
import budgetRouter from './routes/budget';
import scheduleRouter from './routes/schedule';
import oauthRouter from './routes/oauth';

// Import OAuth middleware
import { authenticateToken } from './middleware/oauth';

/**
 * Create and configure Express application for API server
 *
 * @returns Configured Express application
 */
export function createApiServer(): Application {
  const startTime = Date.now();

  logger.info('[API-SERVER] Initializing Express application');

  const app = express();

  // CORS configuration - MUST be before session middleware
  // Safari-specific: Include both with and without trailing slash
  const corsOrigins = [
    process.env.PWA_URL || 'http://localhost:3001',
    'https://bwain-app.vercel.app',
    'https://bwain-app.vercel.app/', // Safari sends trailing slash
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true, // Required for Authorization headers
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Type', 'Authorization'], // Safari requirement
      maxAge: 86400, // Cache preflight for 24 hours
    })
  );

  logger.info('[API-SERVER] CORS configured', {
    origins: corsOrigins,
    credentials: true,
  });

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestStartTime = Date.now();

    // Log request
    logger.debug('[API-REQUEST]', {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    // Log response when finished
    res.on('finish', () => {
      logger.info('[API-RESPONSE]', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: Date.now() - requestStartTime,
        timestamp: new Date().toISOString(),
      });
    });

    next();
  });

  // Health check endpoint (no authentication required)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  });

  // API info endpoint (no authentication required)
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      name: 'Bwaincell API',
      version: '1.0.0',
      description: 'REST API for Bwaincell Discord bot features',
      endpoints: {
        tasks: '/api/tasks',
        lists: '/api/lists',
        notes: '/api/notes',
        reminders: '/api/reminders',
        budget: '/api/budget',
        schedule: '/api/schedule',
      },
      authentication:
        'Bearer token authentication (Google OAuth) required for all /api/* endpoints',
      documentation: 'See README.md for API documentation',
    });
  });

  // Register OAuth routes (public, no authentication required)
  app.use('/api/auth', oauthRouter);

  logger.info('[API-SERVER] OAuth routes registered', {
    routes: ['/api/auth/google/verify', '/api/auth/refresh', '/api/auth/logout'],
  });

  // Register API routes (all require Bearer token authentication)
  app.use('/api/health', healthRouter);
  app.use('/api/tasks', authenticateToken, tasksRouter);
  app.use('/api/lists', authenticateToken, listsRouter);
  app.use('/api/notes', authenticateToken, notesRouter);
  app.use('/api/reminders', authenticateToken, remindersRouter);
  app.use('/api/budget', authenticateToken, budgetRouter);
  app.use('/api/schedule', authenticateToken, scheduleRouter);

  logger.info('[API-SERVER] API routes registered', {
    routes: [
      '/api/tasks',
      '/api/lists',
      '/api/notes',
      '/api/reminders',
      '/api/budget',
      '/api/schedule',
    ],
  });

  // 404 handler for undefined routes
  app.use((req: Request, res: Response) => {
    logger.warn('[API-SERVER] 404 Not Found', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.path,
      message: 'The requested endpoint does not exist',
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error('[API-SERVER] Unhandled error', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      ...(isDevelopment && {
        message: err.message,
        stack: err.stack,
      }),
    });
  });

  logger.info('[API-SERVER] Express application initialized', {
    duration: Date.now() - startTime,
  });

  return app;
}
