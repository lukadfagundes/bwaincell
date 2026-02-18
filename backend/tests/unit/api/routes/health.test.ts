/**
 * Unit tests for /api/health Express route handlers
 *
 * Tests the authenticated health check endpoint that validates
 * whether a user's access token is working correctly.
 */

// Mock dependencies BEFORE imports
jest.mock('../../../../shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import express from 'express';
import healthRouter from '../../../../src/api/routes/health';
import request from 'supertest';

function createApp() {
  const app = express();
  app.use(express.json());
  // Inject a mock authenticated user on every request
  app.use((req: any, _res: any, next: any) => {
    req.user = {
      discordId: 'discord-123',
      guildId: 'guild-123',
      email: 'test@test.com',
      googleId: 'google-123',
      name: 'Test User',
    };
    next();
  });
  app.use('/health', healthRouter);
  return app;
}

function createAppWithoutAuth() {
  const app = express();
  app.use(express.json());
  // Simulate no authenticated user (middleware not attaching user)
  app.use('/health', healthRouter);
  return app;
}

describe('Health API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  // ─── GET /health/auth ─────────────────────────────────────────────

  describe('GET /health/auth', () => {
    it('should return 200 with authenticated user info', async () => {
      const res = await request(app).get('/health/auth');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        authenticated: true,
        email: 'test@test.com',
      });
    });

    it('should include the correct email from the authenticated user', async () => {
      // Override with a different user email
      const customApp = express();
      customApp.use(express.json());
      customApp.use((req: any, _res: any, next: any) => {
        req.user = {
          discordId: 'discord-456',
          guildId: 'guild-456',
          email: 'custom@example.com',
          googleId: 'google-456',
          name: 'Custom User',
        };
        next();
      });
      customApp.use('/health', healthRouter);

      const res = await request(customApp).get('/health/auth');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('custom@example.com');
      expect(res.body.success).toBe(true);
      expect(res.body.authenticated).toBe(true);
    });

    it('should respond with correct JSON structure', async () => {
      const res = await request(app).get('/health/auth');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('authenticated');
      expect(res.body).toHaveProperty('email');
    });

    it('should fail gracefully when no user is attached to request', async () => {
      const noAuthApp = createAppWithoutAuth();

      // This will throw because req.user is undefined
      // The Express error handler should catch it
      // Since we do not have a global error handler in this mini app,
      // this demonstrates the route expects req.user to be set
      const res = await request(noAuthApp).get('/health/auth');

      // Without auth middleware, accessing req.user.email throws
      expect(res.status).toBe(500);
    });
  });
});
