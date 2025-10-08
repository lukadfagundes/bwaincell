import { Router, Response } from 'express';
import { Note } from '@database/index';
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
 * Apply authentication to all note routes
 */
router.use(authenticateUser);

/**
 * GET /api/notes
 * Retrieve all notes for the authenticated user
 *
 * @query search - Optional search keyword for title/content
 * @query tag - Optional tag filter
 * @returns Array of notes
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const search = req.query.search as string;
    const tag = req.query.tag as string;

    logger.debug('[API] Fetching notes', {
      userId: req.user.discordId,
      search: search,
      tag: tag,
    });

    let notes;

    if (search) {
      notes = await Note.searchNotes(req.user.discordId, req.user.guildId, search);
    } else if (tag) {
      notes = await Note.getNotesByTag(req.user.discordId, req.user.guildId, tag);
    } else {
      notes = await Note.getNotes(req.user.discordId, req.user.guildId);
    }

    logger.info('[API] Notes fetched successfully', {
      userId: req.user.discordId,
      count: notes.length,
      search: search,
      tag: tag,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(notes));
  } catch (error) {
    logger.error('[API] Error fetching notes', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/notes/tags
 * Retrieve all unique tags for the authenticated user
 *
 * @returns Array of tag strings
 */
router.get('/tags', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    logger.debug('[API] Fetching note tags', {
      userId: req.user.discordId,
    });

    const tags = await Note.getAllTags(req.user.discordId, req.user.guildId);

    logger.info('[API] Note tags fetched successfully', {
      userId: req.user.discordId,
      count: tags.length,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(tags));
  } catch (error) {
    logger.error('[API] Error fetching note tags', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/notes/:id
 * Retrieve a single note by ID
 *
 * @param id - Note ID
 * @returns Single note object
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const noteId = parseInt(req.params.id, 10);

    if (isNaN(noteId)) {
      const { response, statusCode } = validationError('Invalid note ID');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Fetching note', {
      noteId: noteId,
      userId: req.user.discordId,
    });

    const note = await Note.getNote(noteId, req.user.discordId, req.user.guildId);

    if (!note) {
      const { response, statusCode } = notFoundError('Note');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Note fetched successfully', {
      noteId: noteId,
      userId: req.user.discordId,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(note));
  } catch (error) {
    logger.error('[API] Error fetching note', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      noteId: req.params.id,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * POST /api/notes
 * Create a new note
 *
 * @body title - Note title (required)
 * @body content - Note content (required)
 * @body tags - Array of tags (optional)
 * @returns Created note object
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const { title, content, tags } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string') {
      const { response, statusCode } = validationError('Title is required and must be a string');
      return res.status(statusCode).json(response);
    }

    if (title.trim().length === 0) {
      const { response, statusCode } = validationError('Title cannot be empty');
      return res.status(statusCode).json(response);
    }

    if (!content || typeof content !== 'string') {
      const { response, statusCode } = validationError('Content is required and must be a string');
      return res.status(statusCode).json(response);
    }

    if (content.trim().length === 0) {
      const { response, statusCode } = validationError('Content cannot be empty');
      return res.status(statusCode).json(response);
    }

    // Validate tags if provided
    let validatedTags: string[] = [];
    if (tags) {
      if (!Array.isArray(tags)) {
        const { response, statusCode } = validationError('Tags must be an array');
        return res.status(statusCode).json(response);
      }

      validatedTags = tags
        .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
        .map((tag: string) => tag.trim());
    }

    logger.debug('[API] Creating note', {
      title: title,
      contentLength: content.length,
      tags: validatedTags,
      userId: req.user.discordId,
    });

    const note = await Note.createNote(
      req.user.discordId,
      req.user.guildId,
      title.trim(),
      content.trim(),
      validatedTags
    );

    logger.info('[API] Note created successfully', {
      noteId: note.id,
      userId: req.user.discordId,
      duration: Date.now() - startTime,
    });

    res.status(201).json(successResponse(note));
  } catch (error) {
    logger.error('[API] Error creating note', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * PATCH /api/notes/:id
 * Update an existing note
 *
 * @param id - Note ID
 * @body title - New title (optional)
 * @body content - New content (optional)
 * @body tags - New tags array (optional)
 * @returns Updated note object
 */
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const noteId = parseInt(req.params.id, 10);

    if (isNaN(noteId)) {
      const { response, statusCode } = validationError('Invalid note ID');
      return res.status(statusCode).json(response);
    }

    const { title, content, tags } = req.body;

    // Validate at least one field is provided
    if (title === undefined && content === undefined && tags === undefined) {
      const { response, statusCode } = validationError(
        'At least one field (title, content, or tags) must be provided'
      );
      return res.status(statusCode).json(response);
    }

    // Build update object
    const updates: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        const { response, statusCode } = validationError('Title must be a non-empty string');
        return res.status(statusCode).json(response);
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        const { response, statusCode } = validationError('Content must be a non-empty string');
        return res.status(statusCode).json(response);
      }
      updates.content = content.trim();
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        const { response, statusCode } = validationError('Tags must be an array');
        return res.status(statusCode).json(response);
      }
      updates.tags = tags
        .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
        .map((tag: string) => tag.trim());
    }

    logger.debug('[API] Updating note', {
      noteId: noteId,
      updates: Object.keys(updates),
      userId: req.user.discordId,
    });

    const note = await Note.updateNote(noteId, req.user.discordId, req.user.guildId, updates);

    if (!note) {
      const { response, statusCode } = notFoundError('Note');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Note updated successfully', {
      noteId: noteId,
      userId: req.user.discordId,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(note));
  } catch (error) {
    logger.error('[API] Error updating note', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      noteId: req.params.id,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 *
 * @param id - Note ID
 * @returns Success message
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();

  try {
    const noteId = parseInt(req.params.id, 10);

    if (isNaN(noteId)) {
      const { response, statusCode } = validationError('Invalid note ID');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Deleting note', {
      noteId: noteId,
      userId: req.user.discordId,
    });

    const deleted = await Note.deleteNote(noteId, req.user.discordId, req.user.guildId);

    if (!deleted) {
      const { response, statusCode } = notFoundError('Note');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Note deleted successfully', {
      noteId: noteId,
      userId: req.user.discordId,
      duration: Date.now() - startTime,
    });

    res.json(successMessageResponse('Note deleted successfully'));
  } catch (error) {
    logger.error('[API] Error deleting note', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      noteId: req.params.id,
      userId: req.user?.discordId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

export default router;
