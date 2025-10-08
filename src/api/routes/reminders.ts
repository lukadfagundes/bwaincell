import { Router, Response, Request } from 'express';
import { Reminder } from '@database/index';
import { requireSession } from '../middleware/requireSession';
import {
  successResponse,
  successMessageResponse,
  validationError,
  notFoundError,
  serverError,
} from '../utils/response';
import { logger } from '@shared/utils/logger';

const router = Router();

/**
 * Apply session authentication to all reminder routes
 */
router.use(requireSession);

/**
 * GET /api/reminders
 * Retrieve all active reminders for the authenticated user
 *
 * @returns Array of reminders
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    logger.debug('[API] Fetching reminders', {
      userId: req.session.userId,
    });

    const reminders = await Reminder.getUserReminders(req.session.userId!, req.session.guildId!);

    logger.info('[API] Reminders fetched successfully', {
      userId: req.session.userId,
      count: reminders.length,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(reminders));
  } catch (error) {
    logger.error('[API] Error fetching reminders', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * POST /api/reminders
 * Create a new reminder
 *
 * @body message - Reminder message (required)
 * @body time - Time in HH:MM format (required)
 * @body frequency - 'once' | 'daily' | 'weekly' (default: 'once')
 * @body dayOfWeek - Day of week for weekly reminders (0-6, Sunday=0) (optional)
 * @body channelId - Discord channel ID for notification (optional, uses default)
 * @returns Created reminder object
 */
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { message, time, frequency, dayOfWeek, channelId } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      const { response, statusCode } = validationError('Message is required and must be a string');
      return res.status(statusCode).json(response);
    }

    if (message.trim().length === 0) {
      const { response, statusCode } = validationError('Message cannot be empty');
      return res.status(statusCode).json(response);
    }

    if (!time || typeof time !== 'string') {
      const { response, statusCode } = validationError('Time is required and must be a string');
      return res.status(statusCode).json(response);
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      const { response, statusCode } = validationError('Time must be in HH:MM format (24-hour)');
      return res.status(statusCode).json(response);
    }

    // Validate frequency
    const validFrequencies = ['once', 'daily', 'weekly'];
    const validatedFrequency =
      frequency && validFrequencies.includes(frequency) ? frequency : 'once';

    // Validate day of week for weekly reminders
    let validatedDayOfWeek: number | null = null;
    if (validatedFrequency === 'weekly') {
      if (dayOfWeek === undefined || dayOfWeek === null) {
        const { response, statusCode } = validationError(
          'Day of week (0-6) is required for weekly reminders'
        );
        return res.status(statusCode).json(response);
      }

      const dayNum = parseInt(dayOfWeek, 10);
      if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
        const { response, statusCode } = validationError(
          'Day of week must be a number between 0 (Sunday) and 6 (Saturday)'
        );
        return res.status(statusCode).json(response);
      }
      validatedDayOfWeek = dayNum;
    }

    // Use provided channel ID or fall back to a default (guild ID for now)
    const validatedChannelId = channelId || req.session.guildId!;

    logger.debug('[API] Creating reminder', {
      message: message,
      time: time,
      frequency: validatedFrequency,
      dayOfWeek: validatedDayOfWeek,
      userId: req.session.userId,
    });

    const reminder = await Reminder.createReminder(
      req.session.userId!,
      req.session.guildId!,
      validatedChannelId,
      message.trim(),
      time,
      validatedFrequency as 'once' | 'daily' | 'weekly',
      validatedDayOfWeek
    );

    logger.info('[API] Reminder created successfully', {
      reminderId: reminder.id,
      userId: req.session.userId,
      nextTrigger: reminder.next_trigger,
      duration: Date.now() - startTime,
    });

    res.status(201).json(successResponse(reminder));
  } catch (error) {
    logger.error('[API] Error creating reminder', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * PATCH /api/reminders/:id
 * Update an existing reminder
 *
 * @param id - Reminder ID
 * @body message - New message (optional)
 * @body time - New time (optional)
 * @body frequency - New frequency (optional)
 * @body dayOfWeek - New day of week (optional)
 * @returns Updated reminder object
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const _startTime = Date.now();

  try {
    const reminderId = parseInt(req.params.id, 10);

    if (isNaN(reminderId)) {
      const { response, statusCode } = validationError('Invalid reminder ID');
      return res.status(statusCode).json(response);
    }

    const { message, time, frequency, dayOfWeek } = req.body;

    // Validate at least one field is provided
    if (
      message === undefined &&
      time === undefined &&
      frequency === undefined &&
      dayOfWeek === undefined
    ) {
      const { response, statusCode } = validationError(
        'At least one field must be provided for update'
      );
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Updating reminder', {
      reminderId: reminderId,
      userId: req.session.userId,
    });

    // For this simplified version, we'll delete and recreate the reminder
    // In a production system, you'd implement a proper update method
    const { response, statusCode } = validationError(
      'Reminder updates not yet implemented. Please delete and create a new reminder.'
    );
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('[API] Error updating reminder', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      reminderId: req.params.id,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /api/reminders/:id
 * Delete a reminder (sets it to inactive)
 *
 * @param id - Reminder ID
 * @returns Success message
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const reminderId = parseInt(req.params.id, 10);

    if (isNaN(reminderId)) {
      const { response, statusCode } = validationError('Invalid reminder ID');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Deleting reminder', {
      reminderId: reminderId,
      userId: req.session.userId,
    });

    const deleted = await Reminder.deleteReminder(
      reminderId,
      req.session.userId!,
      req.session.guildId!
    );

    if (!deleted) {
      const { response, statusCode } = notFoundError('Reminder');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Reminder deleted successfully', {
      reminderId: reminderId,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.json(successMessageResponse('Reminder deleted successfully'));
  } catch (error) {
    logger.error('[API] Error deleting reminder', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      reminderId: req.params.id,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

export default router;
