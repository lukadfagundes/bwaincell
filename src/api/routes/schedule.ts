import { Router, Response } from 'express';
import { Schedule } from '@database/index';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
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
 * Apply authentication to all schedule routes
 */
router.use(authenticateUser);

/**
 * GET /api/schedule
 * Retrieve schedule events for the authenticated user
 *
 * @query filter - 'upcoming' | 'past' | 'all' (default: 'upcoming')
 * @query days - Number of days for upcoming events (default: 7)
 * @returns Array of schedule events
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const filter = (req.query.filter as string) || 'upcoming';
    const days = parseInt(req.query.days as string, 10);

    if (!['upcoming', 'past', 'all'].includes(filter)) {
      const { response, statusCode } = validationError(
        'Invalid filter. Must be: upcoming, past, or all'
      );
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Fetching schedule events', {
      userId: req.user.discordId,
      filter: filter,
      days: days,
    });

    let events;

    if (filter === 'upcoming' && !isNaN(days) && days > 0) {
      // Get upcoming events within specified days
      events = await Schedule.getUpcomingEvents(req.user.discordId, req.user.guildId, days);
    } else {
      // Get events based on filter
      events = await Schedule.getEvents(
        req.user.discordId,
        req.user.guildId,
        filter as 'upcoming' | 'past' | 'all'
      );
    }

    logger.info('[API] Schedule events fetched successfully', {
      userId: req.user.discordId,
      count: events.length,
      filter: filter,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(events));
  } catch (error) {
    logger.error('[API] Error fetching schedule events', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/schedule/today
 * Retrieve today's schedule events
 *
 * @returns Array of today's events
 */
router.get('/today', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    logger.debug("[API] Fetching today's schedule events", {
      userId: req.user.discordId,
    });

    const events = await Schedule.getTodaysEvents(req.user.discordId, req.user.guildId);

    logger.info("[API] Today's schedule events fetched successfully", {
      userId: req.user.discordId,
      count: events.length,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(events));
  } catch (error) {
    logger.error("[API] Error fetching today's schedule events", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/schedule/countdown/:eventName
 * Get countdown to a specific event
 *
 * @param eventName - Event name (partial match supported)
 * @returns Event with time remaining
 */
router.get('/countdown/:eventName', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const eventName = decodeURIComponent(req.params.eventName);

    logger.debug('[API] Fetching event countdown', {
      eventName: eventName,
      userId: req.user.discordId,
    });

    const countdown = await Schedule.getCountdown(req.user.discordId, req.user.guildId, eventName);

    if (!countdown) {
      const { response, statusCode } = notFoundError('Event');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Event countdown fetched successfully', {
      eventName: eventName,
      userId: req.user.discordId,
      timeLeft: countdown.timeLeft,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(countdown));
  } catch (error) {
    logger.error('[API] Error fetching event countdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      eventName: req.params.eventName,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * POST /api/schedule
 * Create a new schedule event
 *
 * @body event - Event name (required)
 * @body date - Event date in YYYY-MM-DD format (required)
 * @body time - Event time in HH:MM format (required)
 * @body description - Event description (optional)
 * @returns Created event object
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const { event, date, time, description } = req.body;

    // Validate required fields
    if (!event || typeof event !== 'string') {
      const { response, statusCode } = validationError(
        'Event name is required and must be a string'
      );
      return res.status(statusCode).json(response);
    }

    if (event.trim().length === 0) {
      const { response, statusCode } = validationError('Event name cannot be empty');
      return res.status(statusCode).json(response);
    }

    if (!date || typeof date !== 'string') {
      const { response, statusCode } = validationError('Date is required and must be a string');
      return res.status(statusCode).json(response);
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      const { response, statusCode } = validationError('Date must be in YYYY-MM-DD format');
      return res.status(statusCode).json(response);
    }

    // Validate date is valid
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      const { response, statusCode } = validationError('Invalid date');
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

    logger.debug('[API] Creating schedule event', {
      event: event,
      date: date,
      time: time,
      userId: req.user.discordId,
    });

    const scheduleEvent = await Schedule.addEvent(
      req.user.discordId,
      req.user.guildId,
      event.trim(),
      date,
      time,
      description?.trim() || null
    );

    logger.info('[API] Schedule event created successfully', {
      eventId: scheduleEvent.id,
      userId: req.user.discordId,
      duration: Date.now() - startTime,
    });

    res.status(201).json(successResponse(scheduleEvent));
  } catch (error) {
    logger.error('[API] Error creating schedule event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * PATCH /api/schedule/:id
 * Update an existing schedule event
 *
 * @param id - Event ID
 * @body event - New event name (optional)
 * @body date - New date (optional)
 * @body time - New time (optional)
 * @body description - New description (optional)
 * @returns Updated event object
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const _startTime = Date.now();

  try {
    const eventId = parseInt(req.params.id, 10);

    if (isNaN(eventId)) {
      const { response, statusCode } = validationError('Invalid event ID');
      return res.status(statusCode).json(response);
    }

    const { event, date, time, description } = req.body;

    // Validate at least one field is provided
    if (
      event === undefined &&
      date === undefined &&
      time === undefined &&
      description === undefined
    ) {
      const { response, statusCode } = validationError(
        'At least one field must be provided for update'
      );
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Updating schedule event', {
      eventId: eventId,
      userId: req.user.discordId,
    });

    // For this simplified version, we'll inform users that updates aren't supported
    // In a production system, you'd implement proper update logic
    const { response, statusCode } = validationError(
      'Event updates not yet implemented. Please delete and create a new event.'
    );
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('[API] Error updating schedule event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      eventId: req.params.id,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /api/schedule/:id
 * Delete a schedule event
 *
 * @param id - Event ID
 * @returns Success message
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const eventId = parseInt(req.params.id, 10);

    if (isNaN(eventId)) {
      const { response, statusCode } = validationError('Invalid event ID');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Deleting schedule event', {
      eventId: eventId,
      userId: req.user.discordId,
    });

    const deleted = await Schedule.deleteEvent(eventId, req.user.discordId, req.user.guildId);

    if (!deleted) {
      const { response, statusCode } = notFoundError('Event');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Schedule event deleted successfully', {
      eventId: eventId,
      userId: req.user.discordId,
      duration: Date.now() - startTime,
    });

    res.json(successMessageResponse('Event deleted successfully'));
  } catch (error) {
    logger.error('[API] Error deleting schedule event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      eventId: req.params.id,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

export default router;
