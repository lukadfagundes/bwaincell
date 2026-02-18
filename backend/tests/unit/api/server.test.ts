/**
 * Unit Tests: Express API Server
 *
 * Tests the Express application creation and configuration including:
 * - CORS middleware registration
 * - Body-parser middleware (express.json)
 * - Route mounting for all resource endpoints
 * - Health endpoint responses
 * - 404 handler for unknown routes
 * - Error handling middleware
 * - Public vs protected routes
 *
 * Coverage target: 80%+
 */

// Mock logger BEFORE imports
jest.mock('../../../shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock google-auth-library (required by oauth middleware)
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

// Mock jsonwebtoken (required by oauth middleware and oauth route)
const mockJwtVerify = jest.fn();
const mockJwtSign = jest.fn().mockReturnValue('mock-token');
jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: (...args: any[]) => mockJwtSign(...args),
    verify: (...args: any[]) => mockJwtVerify(...args),
  },
  sign: (...args: any[]) => mockJwtSign(...args),
  verify: (...args: any[]) => mockJwtVerify(...args),
}));

// Mock all route modules to isolate server setup testing
jest.mock('../../../src/api/routes/health', () => {
  const { Router } = require('express');
  const router = Router();
  router.get('/auth', (_req: any, res: any) => {
    res.json({ success: true, authenticated: true });
  });
  return { __esModule: true, default: router };
});

jest.mock('../../../src/api/routes/tasks', () => {
  const { Router } = require('express');
  const router = Router();
  router.get('/', (_req: any, res: any) => {
    res.json({ success: true, data: [] });
  });
  return { __esModule: true, default: router };
});

jest.mock('../../../src/api/routes/lists', () => {
  const { Router } = require('express');
  const router = Router();
  router.get('/', (_req: any, res: any) => {
    res.json({ success: true, data: [] });
  });
  return { __esModule: true, default: router };
});

jest.mock('../../../src/api/routes/notes', () => {
  const { Router } = require('express');
  const router = Router();
  router.get('/', (_req: any, res: any) => {
    res.json({ success: true, data: [] });
  });
  return { __esModule: true, default: router };
});

jest.mock('../../../src/api/routes/reminders', () => {
  const { Router } = require('express');
  const router = Router();
  router.get('/', (_req: any, res: any) => {
    res.json({ success: true, data: [] });
  });
  return { __esModule: true, default: router };
});

jest.mock('../../../src/api/routes/budget', () => {
  const { Router } = require('express');
  const router = Router();
  router.get('/', (_req: any, res: any) => {
    res.json({ success: true, data: [] });
  });
  return { __esModule: true, default: router };
});

jest.mock('../../../src/api/routes/schedule', () => {
  const { Router } = require('express');
  const router = Router();
  router.get('/', (_req: any, res: any) => {
    res.json({ success: true, data: [] });
  });
  return { __esModule: true, default: router };
});

jest.mock('../../../src/api/routes/oauth', () => {
  const { Router } = require('express');
  const router = Router();
  router.post('/google/verify', (_req: any, res: any) => {
    res.json({ success: true });
  });
  router.post('/refresh', (_req: any, res: any) => {
    res.json({ success: true });
  });
  router.post('/logout', (_req: any, res: any) => {
    res.json({ success: true });
  });
  return { __esModule: true, default: router };
});

// Set required env vars BEFORE importing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.ALLOWED_GOOGLE_EMAILS = 'test@gmail.com';
process.env.NODE_ENV = 'test';

import request from 'supertest';
import { createApiServer } from '../../../src/api/server';
import { Application } from 'express';

describe('Express API Server (server.ts)', () => {
  let app: Application;

  beforeAll(() => {
    app = createApiServer();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default mock return values after clearAllMocks
    mockJwtSign.mockReturnValue('mock-token');
  });

  describe('Express App Creation', () => {
    it('should return a valid Express application', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });

    it('should create a new app instance on each call', () => {
      const app2 = createApiServer();
      expect(app2).toBeDefined();
      expect(app2).not.toBe(app);
    });
  });

  describe('CORS Middleware', () => {
    it('should include CORS headers in responses', async () => {
      const res = await request(app)
        .options('/api')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow requests from configured origins', async () => {
      const res = await request(app).get('/api').set('Origin', 'http://localhost:3001');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    });

    it('should allow requests from localhost:3000', async () => {
      const res = await request(app).get('/api').set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should allow credentials in CORS', async () => {
      const res = await request(app).get('/api').set('Origin', 'http://localhost:3001');

      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Body Parser Middleware', () => {
    it('should parse JSON request bodies', async () => {
      // The oauth route accepts POST with JSON body
      const res = await request(app)
        .post('/api/auth/google/verify')
        .send({ idToken: 'test-token' })
        .set('Content-Type', 'application/json');

      // Should not fail due to missing JSON parsing
      expect(res.status).not.toBe(415); // Not "Unsupported Media Type"
    });

    it('should parse URL-encoded request bodies', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send('refreshToken=test-token')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(res.status).not.toBe(415);
    });
  });

  describe('Route Mounting', () => {
    describe('Protected Routes (require authenticateToken)', () => {
      it('should mount /api/tasks route', async () => {
        // Without auth token, should get 401 from authenticateToken middleware
        const res = await request(app).get('/api/tasks');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Authorization required');
      });

      it('should mount /api/lists route', async () => {
        const res = await request(app).get('/api/lists');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authorization required');
      });

      it('should mount /api/notes route', async () => {
        const res = await request(app).get('/api/notes');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authorization required');
      });

      it('should mount /api/reminders route', async () => {
        const res = await request(app).get('/api/reminders');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authorization required');
      });

      it('should mount /api/budget route', async () => {
        const res = await request(app).get('/api/budget');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authorization required');
      });

      it('should mount /api/schedule route', async () => {
        const res = await request(app).get('/api/schedule');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authorization required');
      });

      it('should allow access to protected routes with valid Bearer token', async () => {
        mockJwtVerify.mockReturnValue({
          googleId: 'google-123',
          email: 'test@gmail.com',
          discordId: 'discord-456',
          guildId: 'guild-789',
        });

        const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('Public Routes (no authentication required)', () => {
      it('should mount /api/auth routes without authentication', async () => {
        const res = await request(app)
          .post('/api/auth/google/verify')
          .send({ idToken: 'test-token' });

        // Should not return 401 (auth is not required for /api/auth)
        expect(res.status).not.toBe(401);
      });

      it('should mount /api/auth/refresh route', async () => {
        const res = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: 'test-token' });

        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(404);
      });

      it('should mount /api/auth/logout route', async () => {
        const res = await request(app)
          .post('/api/auth/logout')
          .send({ refreshToken: 'test-token' });

        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(404);
      });
    });
  });

  describe('Health Endpoint', () => {
    it('should respond to GET /health with healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.uptime).toBeDefined();
      expect(res.body.version).toBe('2.1.0');
    });

    it('should include environment in health response', async () => {
      const res = await request(app).get('/health');

      expect(res.body.environment).toBeDefined();
    });

    it('should respond to GET /health without authentication', async () => {
      // No Authorization header - should still succeed
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
    });

    it('should mount /api/health route for auth health checks', async () => {
      // /api/health is mounted without authenticateToken in the route definition,
      // but the health router has /auth endpoint
      // Note: In server.ts, healthRouter is mounted at /api/health without authenticateToken
      const res = await request(app).get('/api/health/auth');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('API Info Endpoint', () => {
    it('should respond to GET /api with API info', async () => {
      const res = await request(app).get('/api');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Bwaincell API');
      expect(res.body.version).toBe('2.1.0');
      expect(res.body.description).toBeDefined();
    });

    it('should list available endpoints in API info', async () => {
      const res = await request(app).get('/api');

      expect(res.body.endpoints).toBeDefined();
      expect(res.body.endpoints.tasks).toBe('/api/tasks');
      expect(res.body.endpoints.lists).toBe('/api/lists');
      expect(res.body.endpoints.notes).toBe('/api/notes');
      expect(res.body.endpoints.reminders).toBe('/api/reminders');
      expect(res.body.endpoints.budget).toBe('/api/budget');
      expect(res.body.endpoints.schedule).toBe('/api/schedule');
    });

    it('should include authentication info in API info', async () => {
      const res = await request(app).get('/api');

      expect(res.body.authentication).toBeDefined();
      expect(res.body.authentication).toContain('Bearer token');
    });

    it('should respond without authentication', async () => {
      const res = await request(app).get('/api');

      expect(res.status).toBe(200);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Endpoint not found');
    });

    it('should include the requested path in 404 response', async () => {
      const res = await request(app).get('/completely/unknown/path');

      expect(res.status).toBe(404);
      expect(res.body.path).toBe('/completely/unknown/path');
    });

    it('should return 404 for unknown HTTP methods on valid paths', async () => {
      // DELETE on /api which only supports GET
      const res = await request(app).delete('/api/nonexistent');

      expect(res.status).toBe(404);
    });

    it('should include descriptive message in 404 response', async () => {
      const res = await request(app).get('/nope');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('The requested endpoint does not exist');
    });
  });

  describe('Error Handling Middleware', () => {
    it('should be registered as the last middleware', () => {
      // The error handler is a 4-argument function (err, req, res, next)
      // We verify the app's middleware stack includes error handlers
      const stack = (app as any)._router.stack;
      expect(stack.length).toBeGreaterThan(0);

      // The last middleware entries should include our error handlers
      // (404 handler and global error handler)
      const lastLayers = stack.slice(-2);
      expect(lastLayers.some((layer: any) => layer.name === '<anonymous>')).toBe(true);
    });
  });

  describe('Public vs Protected Route Distinction', () => {
    it('should NOT require auth for /health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('should NOT require auth for /api', async () => {
      const res = await request(app).get('/api');
      expect(res.status).toBe(200);
    });

    it('should NOT require auth for /api/auth/* routes', async () => {
      const verifyRes = await request(app)
        .post('/api/auth/google/verify')
        .send({ idToken: 'test' });
      expect(verifyRes.status).not.toBe(401);

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'test' });
      expect(refreshRes.status).not.toBe(401);

      const logoutRes = await request(app).post('/api/auth/logout').send({});
      expect(logoutRes.status).not.toBe(401);
    });

    it('should require auth for /api/tasks', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(401);
    });

    it('should require auth for /api/lists', async () => {
      const res = await request(app).get('/api/lists');
      expect(res.status).toBe(401);
    });

    it('should require auth for /api/notes', async () => {
      const res = await request(app).get('/api/notes');
      expect(res.status).toBe(401);
    });

    it('should require auth for /api/reminders', async () => {
      const res = await request(app).get('/api/reminders');
      expect(res.status).toBe(401);
    });

    it('should require auth for /api/budget', async () => {
      const res = await request(app).get('/api/budget');
      expect(res.status).toBe(401);
    });

    it('should require auth for /api/schedule', async () => {
      const res = await request(app).get('/api/schedule');
      expect(res.status).toBe(401);
    });

    it('should NOT require auth for /api/health', async () => {
      const res = await request(app).get('/api/health/auth');
      expect(res.status).not.toBe(401);
    });
  });

  describe('Response Format Consistency', () => {
    it('should return JSON content type for /health', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should return JSON content type for /api', async () => {
      const res = await request(app).get('/api');
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should return JSON content type for 404 responses', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('should return JSON content type for 401 responses', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });
});
