import { Router, Response, Request } from 'express';
import { List } from '@database/index';
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
 * Apply session authentication to all list routes
 */
router.use(requireSession);

/**
 * GET /api/lists
 * Retrieve all lists for the authenticated user
 *
 * @returns Array of lists with items
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    logger.debug('[API] Fetching lists', {
      userId: req.session.userId,
    });

    const lists = await List.getUserLists(req.session.userId!, req.session.guildId!);

    logger.info('[API] Lists fetched successfully', {
      userId: req.session.userId,
      count: lists.length,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(lists));
  } catch (error) {
    logger.error('[API] Error fetching lists', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/lists/:name
 * Retrieve a single list by name (case-insensitive)
 *
 * @param name - List name
 * @returns Single list object with items
 */
router.get('/:name', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const listName = decodeURIComponent(req.params.name);

    logger.debug('[API] Fetching list', {
      listName: listName,
      userId: req.session.userId,
    });

    const list = await List.getList(req.session.userId!, req.session.guildId!, listName);

    if (!list) {
      const { response, statusCode } = notFoundError('List');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] List fetched successfully', {
      listName: listName,
      userId: req.session.userId,
      itemCount: list.items?.length || 0,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(list));
  } catch (error) {
    logger.error('[API] Error fetching list', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      listName: req.params.name,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * POST /api/lists
 * Create a new list
 *
 * @body name - List name (required)
 * @returns Created list object
 */
router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { name } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      const { response, statusCode } = validationError('Name is required and must be a string');
      return res.status(statusCode).json(response);
    }

    if (name.trim().length === 0) {
      const { response, statusCode } = validationError('Name cannot be empty');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Creating list', {
      name: name,
      userId: req.session.userId,
    });

    const list = await List.createList(req.session.userId!, req.session.guildId!, name.trim());

    if (!list) {
      const { response, statusCode } = validationError('A list with this name already exists');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] List created successfully', {
      listId: list.id,
      name: name,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.status(201).json(successResponse(list));
  } catch (error) {
    logger.error('[API] Error creating list', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * POST /api/lists/:name/items
 * Add an item to a list
 *
 * @param name - List name
 * @body item - Item text (required)
 * @returns Updated list object
 */
router.post('/:name/items', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const listName = decodeURIComponent(req.params.name);
    const { item } = req.body;

    // Validate required fields
    if (!item || typeof item !== 'string') {
      const { response, statusCode } = validationError('Item is required and must be a string');
      return res.status(statusCode).json(response);
    }

    if (item.trim().length === 0) {
      const { response, statusCode } = validationError('Item cannot be empty');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Adding item to list', {
      listName: listName,
      item: item,
      userId: req.session.userId,
    });

    const list = await List.addItem(
      req.session.userId!,
      req.session.guildId!,
      listName,
      item.trim()
    );

    if (!list) {
      const { response, statusCode } = notFoundError('List');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Item added to list successfully', {
      listName: listName,
      userId: req.session.userId,
      itemCount: list.items?.length || 0,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(list));
  } catch (error) {
    logger.error('[API] Error adding item to list', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      listName: req.params.name,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * PATCH /api/lists/:name/items/:itemText/toggle
 * Toggle completion status of a list item
 *
 * @param name - List name
 * @param itemText - Item text to toggle
 * @returns Updated list object
 */
router.patch('/:name/items/:itemText/toggle', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const listName = decodeURIComponent(req.params.name);
    const itemText = decodeURIComponent(req.params.itemText);

    logger.debug('[API] Toggling list item', {
      listName: listName,
      itemText: itemText,
      userId: req.session.userId,
    });

    const list = await List.toggleItem(
      req.session.userId!,
      req.session.guildId!,
      listName,
      itemText
    );

    if (!list) {
      const { response, statusCode } = notFoundError('List or item');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] List item toggled successfully', {
      listName: listName,
      itemText: itemText,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(list));
  } catch (error) {
    logger.error('[API] Error toggling list item', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      listName: req.params.name,
      itemText: req.params.itemText,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /api/lists/:name/items/:itemText
 * Remove an item from a list
 *
 * @param name - List name
 * @param itemText - Item text to remove
 * @returns Updated list object
 */
router.delete('/:name/items/:itemText', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const listName = decodeURIComponent(req.params.name);
    const itemText = decodeURIComponent(req.params.itemText);

    logger.debug('[API] Removing item from list', {
      listName: listName,
      itemText: itemText,
      userId: req.session.userId,
    });

    const list = await List.removeItem(
      req.session.userId!,
      req.session.guildId!,
      listName,
      itemText
    );

    if (!list) {
      const { response, statusCode } = notFoundError('List or item');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Item removed from list successfully', {
      listName: listName,
      itemText: itemText,
      userId: req.session.userId,
      itemCount: list.items?.length || 0,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(list));
  } catch (error) {
    logger.error('[API] Error removing item from list', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      listName: req.params.name,
      itemText: req.params.itemText,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * POST /api/lists/:name/clear-completed
 * Clear all completed items from a list
 *
 * @param name - List name
 * @returns Updated list object
 */
router.post('/:name/clear-completed', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const listName = decodeURIComponent(req.params.name);

    logger.debug('[API] Clearing completed items from list', {
      listName: listName,
      userId: req.session.userId,
    });

    const list = await List.clearCompleted(req.session.userId!, req.session.guildId!, listName);

    if (!list) {
      const { response, statusCode } = notFoundError('List');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Completed items cleared successfully', {
      listName: listName,
      userId: req.session.userId,
      remainingItems: list.items?.length || 0,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(list));
  } catch (error) {
    logger.error('[API] Error clearing completed items', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      listName: req.params.name,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /api/lists/:name
 * Delete a list
 *
 * @param name - List name
 * @returns Success message
 */
router.delete('/:name', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const listName = decodeURIComponent(req.params.name);

    logger.debug('[API] Deleting list', {
      listName: listName,
      userId: req.session.userId,
    });

    const deleted = await List.deleteList(req.session.userId!, req.session.guildId!, listName);

    if (!deleted) {
      const { response, statusCode } = notFoundError('List');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] List deleted successfully', {
      listName: listName,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.json(successMessageResponse('List deleted successfully'));
  } catch (error) {
    logger.error('[API] Error deleting list', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      listName: req.params.name,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

export default router;
