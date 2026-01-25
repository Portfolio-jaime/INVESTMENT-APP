import { Router } from 'express';
import positionController from '../controllers/positionController';

const router = Router();

/**
 * @route   GET /api/v1/portfolios/:id/positions
 * @desc    Get all positions for a portfolio
 * @access  Public (should be protected in production)
 */
router.get(
  '/:id/positions',
  positionController.validateId,
  positionController.getPositions
);

/**
 * @route   GET /api/v1/portfolios/:id/summary
 * @desc    Get portfolio summary with P&L calculations
 * @access  Public (should be protected in production)
 */
router.get(
  '/:id/summary',
  positionController.validateId,
  positionController.getSummary
);

export default router;
