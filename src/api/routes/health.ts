import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/oauth';
import { logger } from '@shared/utils/logger';

const router = Router();

/**
 * GET /api/health/auth
 * Authentication health check endpoint
 * Returns 200 if access token is valid, 401 if not
 *
 * This is a lightweight endpoint just for testing OAuth credentials
 * without fetching any actual data
 */
router.get('/auth', (req: AuthenticatedRequest, res: Response) => {
  logger.debug('[HEALTH] Auth check successful', {
    email: req.user.email,
    ip: req.ip,
  });

  res.json({
    success: true,
    authenticated: true,
    email: req.user.email,
  });
});

export default router;
