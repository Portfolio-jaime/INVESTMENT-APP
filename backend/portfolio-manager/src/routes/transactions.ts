import { Router } from 'express';
import transactionController from '../controllers/transactionController';

const router = Router();

/**
 * @route   GET /api/v1/portfolios/:id/transactions
 * @desc    Get all transactions for a portfolio
 * @access  Public (should be protected in production)
 * @query   limit - Optional limit (default 100, max 1000)
 */
router.get(
  '/:id/transactions',
  transactionController.validateGetTransactions,
  transactionController.getTransactions
);

/**
 * @route   POST /api/v1/portfolios/:id/transactions
 * @desc    Create a new transaction (buy/sell)
 * @access  Public (should be protected in production)
 * @body    { symbol, transaction_type, quantity, price, fees?, notes?, transaction_date? }
 */
router.post(
  '/:id/transactions',
  transactionController.validateCreate,
  transactionController.create
);

export default router;
