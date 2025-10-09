import { Router, Request, Response } from 'express';
import { verifyGoogleToken, generateAccessToken, generateRefreshToken } from '../middleware/oauth';
import { User } from '@database/models/User';
import { logger } from '@shared/utils/logger';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * POST /api/auth/google/verify
 * Verify Google ID token and create/update user
 */
router.post('/google/verify', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token required',
      });
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token or email not authorized',
      });
    }

    // Find or create user
    let user = await User.findOne({ where: { googleId: googleUser.googleId } });

    if (!user) {
      // Map email to Discord ID (migration from Basic Auth)
      let discordId = process.env.STRAWHATLUKA_DISCORD_ID || '';
      const guildId = process.env.GUILD_ID || '';

      if (googleUser.email === 'caitlintmentink@gmail.com') {
        discordId = process.env.DANDELION_DISCORD_ID || '';
      }

      // Create new user
      user = await User.create({
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        discordId: discordId,
        guildId: guildId,
        refreshToken: null,
      });

      logger.info('[OAUTH] New user created', {
        email: googleUser.email,
        googleId: googleUser.googleId,
      });
    } else {
      // Update existing user
      user.name = googleUser.name;
      user.picture = googleUser.picture;

      // Update Discord IDs if they're missing (migration support)
      if (!user.discordId || !user.guildId) {
        let discordId = process.env.STRAWHATLUKA_DISCORD_ID || '';
        const guildId = process.env.GUILD_ID || '';

        if (googleUser.email === 'caitlintmentink@gmail.com') {
          discordId = process.env.DANDELION_DISCORD_ID || '';
        }

        user.discordId = discordId;
        user.guildId = guildId;
      }

      await user.save();

      logger.info('[OAUTH] User updated', {
        email: googleUser.email,
        discordId: user.discordId,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      googleId: user.googleId,
      email: user.email,
      discordId: user.discordId,
      guildId: user.guildId,
    });

    const refreshToken = generateRefreshToken(user.googleId);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      },
    });
  } catch (error) {
    logger.error('[OAUTH] Verification error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback-secret') as {
      googleId: string;
    };

    // Find user
    const user = await User.findOne({
      where: { googleId: decoded.googleId, refreshToken: refreshToken },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      googleId: user.googleId,
      email: user.email,
      discordId: user.discordId,
      guildId: user.guildId,
    });

    return res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    logger.error('[OAUTH] Refresh error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate refresh token
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Find user and clear refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback-secret') as {
        googleId: string;
      };

      const user = await User.findOne({ where: { googleId: decoded.googleId } });

      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('[OAUTH] Logout error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.json({
      success: true,
      message: 'Logged out',
    });
  }
});

export default router;
