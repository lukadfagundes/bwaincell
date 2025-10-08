import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from '@shared/utils/logger';
import { sessionMiddleware } from './middleware/session';

// Import route modules
import authRouter from './routes/auth';
import tasksRouter from './routes/tasks';
import listsRouter from './routes/lists';
import notesRouter from './routes/notes';
import remindersRouter from './routes/reminders';
import budgetRouter from './routes/budget';
import scheduleRouter from './routes/schedule';

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
  const corsOrigins = [
    process.env.PWA_URL || 'http://localhost:3001',
    'https://bwain-app.vercel.app',
    'http://localhost:3000',
  ];

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true, // Allow cookies
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  logger.info('[API-SERVER] CORS configured', {
    origins: corsOrigins,
    credentials: true,
  });

  // Session middleware - MUST be after CORS and before routes
  app.use(sessionMiddleware);

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
        auth: '/api/auth',
        tasks: '/api/tasks',
        lists: '/api/lists',
        notes: '/api/notes',
        reminders: '/api/reminders',
        budget: '/api/budget',
        schedule: '/api/schedule',
      },
      authentication:
        'Session-based authentication required for all /api/* endpoints (except /api/auth)',
      documentation: 'See README.md for API documentation',
    });
  });

  // Register authentication routes (no session required)
  app.use('/api/auth', authRouter);

  // Register API routes (all require session authentication)
  app.use('/api/tasks', tasksRouter);
  app.use('/api/lists', listsRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/reminders', remindersRouter);
  app.use('/api/budget', budgetRouter);
  app.use('/api/schedule', scheduleRouter);

  logger.info('[API-SERVER] API routes registered', {
    routes: [
      '/api/auth',
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
