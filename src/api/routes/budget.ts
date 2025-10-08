import { Router, Response, Request } from 'express';
import { Budget } from '@database/index';
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
 * Apply session authentication to all budget routes
 */
router.use(requireSession);

/**
 * GET /api/budget/transactions
 * Retrieve recent budget transactions
 *
 * @query limit - Number of transactions to retrieve (default: 10, max: 100)
 * @returns Array of transactions
 */
router.get('/transactions', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    let limit = parseInt(req.query.limit as string, 10) || 10;

    // Validate limit
    if (isNaN(limit) || limit < 1) {
      limit = 10;
    }
    if (limit > 100) {
      limit = 100;
    }

    logger.debug('[API] Fetching budget transactions', {
      userId: req.session.userId,
      limit: limit,
    });

    const transactions = await Budget.getRecentEntries(
      req.session.userId!,
      req.session.guildId!,
      limit
    );

    logger.info('[API] Budget transactions fetched successfully', {
      userId: req.session.userId,
      count: transactions.length,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(transactions));
  } catch (error) {
    logger.error('[API] Error fetching budget transactions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/budget/summary
 * Retrieve budget summary for a specific month
 *
 * @query month - Month number (1-12) (optional, defaults to current month)
 * @returns Budget summary with income, expenses, balance, and categories
 */
router.get('/summary', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    let month: number | null = null;

    if (req.query.month) {
      month = parseInt(req.query.month as string, 10);

      if (isNaN(month) || month < 1 || month > 12) {
        const { response, statusCode } = validationError('Month must be a number between 1 and 12');
        return res.status(statusCode).json(response);
      }
    }

    logger.debug('[API] Fetching budget summary', {
      userId: req.session.userId,
      month: month,
    });

    const summary = await Budget.getSummary(req.session.userId!, req.session.guildId!, month);

    logger.info('[API] Budget summary fetched successfully', {
      userId: req.session.userId,
      month: month,
      entryCount: summary.entryCount,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(summary));
  } catch (error) {
    logger.error('[API] Error fetching budget summary', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/budget/categories
 * Retrieve expense categories with totals
 *
 * @returns Array of categories with total amounts
 */
router.get('/categories', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    logger.debug('[API] Fetching budget categories', {
      userId: req.session.userId,
    });

    const categories = await Budget.getCategories(req.session.userId!, req.session.guildId!);

    logger.info('[API] Budget categories fetched successfully', {
      userId: req.session.userId,
      count: categories.length,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(categories));
  } catch (error) {
    logger.error('[API] Error fetching budget categories', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * GET /api/budget/trends
 * Retrieve monthly budget trends
 *
 * @query months - Number of months to retrieve (default: 6, max: 12)
 * @returns Array of monthly trends
 */
router.get('/trends', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    let months = parseInt(req.query.months as string, 10) || 6;

    // Validate months
    if (isNaN(months) || months < 1) {
      months = 6;
    }
    if (months > 12) {
      months = 12;
    }

    logger.debug('[API] Fetching budget trends', {
      userId: req.session.userId,
      months: months,
    });

    const trends = await Budget.getMonthlyTrend(req.session.userId!, req.session.guildId!, months);

    logger.info('[API] Budget trends fetched successfully', {
      userId: req.session.userId,
      months: months,
      duration: Date.now() - startTime,
    });

    res.json(successResponse(trends));
  } catch (error) {
    logger.error('[API] Error fetching budget trends', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * POST /api/budget/transactions
 * Create a new budget transaction (expense or income)
 *
 * @body type - 'expense' | 'income' (required)
 * @body amount - Transaction amount (required, positive number)
 * @body category - Category name (required for expenses)
 * @body description - Description (optional)
 * @returns Created transaction object
 */
router.post('/transactions', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { type, amount, category, description } = req.body;

    // Validate type
    if (!type || !['expense', 'income'].includes(type)) {
      const { response, statusCode } = validationError(
        'Type is required and must be either "expense" or "income"'
      );
      return res.status(statusCode).json(response);
    }

    // Validate amount
    if (amount === undefined || amount === null) {
      const { response, statusCode } = validationError('Amount is required');
      return res.status(statusCode).json(response);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const { response, statusCode } = validationError('Amount must be a positive number');
      return res.status(statusCode).json(response);
    }

    // Validate category for expenses
    if (type === 'expense') {
      if (!category || typeof category !== 'string') {
        const { response, statusCode } = validationError(
          'Category is required for expenses and must be a string'
        );
        return res.status(statusCode).json(response);
      }

      if (category.trim().length === 0) {
        const { response, statusCode } = validationError('Category cannot be empty');
        return res.status(statusCode).json(response);
      }
    }

    logger.debug('[API] Creating budget transaction', {
      type: type,
      amount: parsedAmount,
      category: category,
      userId: req.session.userId,
    });

    let transaction;
    if (type === 'expense') {
      transaction = await Budget.addExpense(
        req.user.discordId,
        req.user.guildId,
        category.trim(),
        parsedAmount,
        description?.trim() || null
      );
    } else {
      transaction = await Budget.addIncome(
        req.user.discordId,
        req.user.guildId,
        parsedAmount,
        description?.trim() || null
      );
    }

    logger.info('[API] Budget transaction created successfully', {
      transactionId: transaction.id,
      type: type,
      amount: parsedAmount,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.status(201).json(successResponse(transaction));
  } catch (error) {
    logger.error('[API] Error creating budget transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /api/budget/transactions/:id
 * Delete a budget transaction
 *
 * @param id - Transaction ID
 * @returns Success message
 */
router.delete('/transactions/:id', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const transactionId = parseInt(req.params.id, 10);

    if (isNaN(transactionId)) {
      const { response, statusCode } = validationError('Invalid transaction ID');
      return res.status(statusCode).json(response);
    }

    logger.debug('[API] Deleting budget transaction', {
      transactionId: transactionId,
      userId: req.session.userId,
    });

    const deleted = await Budget.deleteEntry(
      transactionId,
      req.session.userId!,
      req.session.guildId!
    );

    if (!deleted) {
      const { response, statusCode } = notFoundError('Transaction');
      return res.status(statusCode).json(response);
    }

    logger.info('[API] Budget transaction deleted successfully', {
      transactionId: transactionId,
      userId: req.session.userId,
      duration: Date.now() - startTime,
    });

    res.json(successMessageResponse('Transaction deleted successfully'));
  } catch (error) {
    logger.error('[API] Error deleting budget transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      transactionId: req.params.id,
      userId: req.session?.userId,
    });

    const { response, statusCode } = serverError(error as Error);
    res.status(statusCode).json(response);
  }
});

export default router;
