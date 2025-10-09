import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '@shared/utils/logger';

const router = Router();

/**
 * GET /api/health/auth
 * Authentication health check endpoint
 * Returns 200 if credentials are valid, 401 if not
 *
 * This is a lightweight endpoint just for testing credentials
 * without fetching any actual data
 */
router.get('/auth', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  logger.debug('[HEALTH] Auth check successful', {
    username: req.user.username,
    ip: req.ip,
  });

  res.json({
    success: true,
    authenticated: true,
    username: req.user.username,
  });
});

export default router;
