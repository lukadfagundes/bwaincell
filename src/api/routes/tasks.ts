import { Router, Response, Request } from 'express';
import { Task } from '@database/index';
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
 * Apply session authentication to all task routes
 */
router.use(requireSession);

/**
 * GET /api/tasks
 * Retrieve all tasks for the authenticated user
 *
 * @query filter - Optional filter: 'all' | 'pending' | 'completed' (default: 'all')
 * @returns Array of tasks
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const filter = (req.query.filter as string) || 'all';

    if (!['all', 'pending', 'completed'].includes(filter)) {
      const { response, statusCode } = validationError(
        'Invalid filter. Must be: all, pending, or completed'
      );
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Fetching tasks', {
      userId: req.session.userId,
      filter: filter,
    });

    const tasks = await Task.getUserTasks(
      req.session.userId!,
      req.session.guildId!,
      filter as 'all' | 'pending' | 'completed'
    );

    logger.info('[API] Tasks fetched successfully', {
      userId: req.session.userId,
      count: tasks.length,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(tasks));
  } catch (error) {
    logger.error('[API] Error fetching tasks', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/tasks/:id
 * Retrieve a single task by ID
 *
 * @param id - Task ID
 * @returns Single task object
 */
router.get('/:id', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      const { response, statusCode } = validationError('Invalid task ID');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Fetching task', {
      taskId: taskId,
      userId: req.session.userId,
    });

    const tasks = await Task.getUserTasks(req.session.userId!, req.session.guildId!);
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      const { response, statusCode } = notFoundError('Task');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Task fetched successfully', {
      taskId: taskId,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(task));
  } catch (error) {
    logger.error('[API] Error fetching task', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      taskId: req.params.id,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * POST /api/tasks
 * Create a new task
 *
 * @body description - Task description (required)
 * @body dueDate - Due date in ISO format (optional)
 * @returns Created task object
 */
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { description, dueDate } = req.body;

    // Validate required fields
    if (!description || typeof description !== 'string') {
      const { response, statusCode } = validationError(
        'Description is required and must be a string'
      );
      return res.status(statusCode).json(response);
    }

    if (description.trim().length === 0) {
      const { response, statusCode } = validationError('Description cannot be empty');
      return res.status(statusCode).json(response);
    }

    // Validate due date if provided
    let parsedDueDate: Date | null = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        const { response, statusCode } = validationError('Invalid due date format');
        return res.status(statusCode).json(response);
      }
    }

    logger.debug('[API] Creating task', {
      description: description,
      dueDate: parsedDueDate,
      userId: req.session.userId,
    });

    const task = await Task.createTask(
      req.session.userId!,
      req.session.guildId!,
      description.trim(),
      parsedDueDate
    );

    logger.info('[API] Task created successfully', {
      taskId: task.id,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.status(201).json(successResponse(task));
  } catch (error) {
    logger.error('[API] Error creating task', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * PATCH /api/tasks/:id
 * Update an existing task
 *
 * @param id - Task ID
 * @body description - New description (optional)
 * @body dueDate - New due date (optional)
 * @body completed - Completion status (optional)
 * @returns Updated task object
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      const { response, statusCode } = validationError('Invalid task ID');
      return res.status(statusCode).json(response);
    }

    const { description, dueDate, completed } = req.body;

    logger.debug('[API] Updating task', {
      taskId: taskId,
      userId: req.session.userId,
      updates: { description, dueDate, completed },
    });

    // Handle completion status change
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        const { response, statusCode } = validationError('Completed must be a boolean');
        return res.status(statusCode).json(response);
      }

      if (completed) {
        const task = await Task.completeTask(taskId, req.session.userId!, req.session.guildId!);

        if (!task) {
          const { response, statusCode } = notFoundError('Task');
          return res.status(statusCode).json(response);
        }

        logger.info('[API] Task marked as completed', {
          taskId: taskId,
          userId: req.session.userId,
          duration: Date.now() - startTime,
        });

        return res.json(successResponse(task));
      }
    }

    // Handle description/due date update
    if (description !== undefined || dueDate !== undefined) {
      let parsedDueDate: Date | null | undefined = undefined;

      if (dueDate !== undefined) {
        if (dueDate === null) {
          parsedDueDate = null;
        } else {
          parsedDueDate = new Date(dueDate);
          if (isNaN(parsedDueDate.getTime())) {
            const { response, statusCode } = validationError('Invalid due date format');
            return res.status(statusCode).json(response);
          }
        }
      }

      const task = await Task.editTask(
        taskId,
        req.session.userId!,
        req.session.guildId!,
        description !== undefined ? description.trim() : undefined,
        parsedDueDate
      );

      if (!task) {
        const { response, statusCode } = notFoundError('Task');
        return res.status(statusCode).json(response);
      }

      logger.info('[API] Task updated successfully', {
        taskId: taskId,
        userId: req.session.userId,
        duration: Date.now() - startTime,
      });

      return res.json(successResponse(task));
    }

    // If no updates provided
    const { response, statusCode } = validationError('No valid updates provided');
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('[API] Error updating task', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      taskId: req.params.id,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 *
 * @param id - Task ID
 * @returns Success message
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      const { response, statusCode } = validationError('Invalid task ID');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Deleting task', {
      taskId: taskId,
      userId: req.session.userId,
    });

    const deleted = await Task.deleteTask(taskId, req.session.userId!, req.session.guildId!);

    if (!deleted) {
      const { response, statusCode } = notFoundError('Task');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Task deleted successfully', {
      taskId: taskId,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.json(successMessageResponse('Task deleted successfully'));
  } catch (error) {
    logger.error('[API] Error deleting task', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      taskId: req.params.id,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

export default router;
