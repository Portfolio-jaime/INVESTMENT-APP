import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import portfolioService from '../services/portfolioService';
import { AppError, ApiResponse, TransactionType } from '../types';

class TransactionController {
  // Validation rules
  validateGetTransactions = [
    param('id').isInt({ min: 1 }).withMessage('Valid portfolio ID is required'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  ];

  validateCreate = [
    param('id').isInt({ min: 1 }).withMessage('Valid portfolio ID is required'),
    body('symbol').trim().isLength({ min: 1, max: 20 }).withMessage('Symbol is required (max 20 characters)'),
    body('transaction_type')
      .isIn([TransactionType.BUY, TransactionType.SELL])
      .withMessage('Transaction type must be BUY or SELL'),
    body('quantity').isFloat({ min: 0.00001 }).withMessage('Quantity must be greater than 0'),
    body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
    body('fees').optional().isFloat({ min: 0 }).withMessage('Fees must be non-negative'),
    body('notes').optional().trim().isLength({ max: 500 }),
    body('transaction_date').optional().isISO8601().withMessage('Invalid date format'),
  ];

  // Get all transactions for a portfolio
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const portfolioId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const transactions = await portfolioService.getTransactions(portfolioId, limit);

      const response: ApiResponse = {
        success: true,
        data: transactions,
        message: `Found ${transactions.length} transaction(s)`,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Create a new transaction
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const portfolioId = parseInt(req.params.id);
      const transaction = await portfolioService.createTransaction(portfolioId, req.body);

      const response: ApiResponse = {
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
