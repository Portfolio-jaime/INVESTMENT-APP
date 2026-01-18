import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiResponse, AppError } from '../types';
import rebalancingService from '../services/rebalancingService';

const router = express.Router();

// Get rebalancing suggestions
router.get('/portfolios/:id/rebalancing/suggestions',
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: errors.array(),
        };
        return res.status(400).json(response);
      }

      const portfolioId = parseInt(req.params.id);

      const suggestions = await rebalancingService.getRebalancingSuggestions(portfolioId);

      const response: ApiResponse = {
        success: true,
        data: suggestions,
      };
      res.json(response);
    } catch (error) {
      if (error instanceof AppError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
        };
        res.status(error.statusCode).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Internal server error',
        };
        res.status(500).json(response);
      }
    }
  }
);

// Execute rebalancing
router.post('/portfolios/:id/rebalancing/execute',
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    body('target_allocations').isObject().withMessage('Target allocations must be provided'),
    body('trades_required').isArray().withMessage('Trades required must be provided'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: errors.array(),
        };
        return res.status(400).json(response);
      }

      const portfolioId = parseInt(req.params.id);
      const suggestion = req.body; // RebalancingSuggestion object

      await rebalancingService.executeRebalancing(portfolioId, suggestion);

      const response: ApiResponse = {
        success: true,
        message: 'Rebalancing executed successfully',
      };
      res.json(response);
    } catch (error) {
      if (error instanceof AppError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
        };
        res.status(error.statusCode).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Internal server error',
        };
        res.status(500).json(response);
      }
    }
  }
);

// Get rebalancing history
router.get('/portfolios/:id/rebalancing/history',
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: errors.array(),
        };
        return res.status(400).json(response);
      }

      const portfolioId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const history = await rebalancingService.getRebalancingHistory(portfolioId, limit);

      const response: ApiResponse = {
        success: true,
        data: history,
      };
      res.json(response);
    } catch (error) {
      if (error instanceof AppError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
        };
        res.status(error.statusCode).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Internal server error',
        };
        res.status(500).json(response);
      }
    }
  }
);

// Schedule automatic rebalancing
router.post('/portfolios/:id/rebalancing/schedule',
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    body('frequency').isIn(['weekly', 'monthly', 'quarterly']).withMessage('Invalid frequency'),
    body('threshold').isFloat({ min: 0, max: 1 }).withMessage('Threshold must be between 0 and 1'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: errors.array(),
        };
        return res.status(400).json(response);
      }

      const portfolioId = parseInt(req.params.id);
      const { frequency, threshold } = req.body;

      await rebalancingService.scheduleRebalancing(portfolioId, frequency, threshold);

      const response: ApiResponse = {
        success: true,
        message: 'Rebalancing schedule updated successfully',
      };
      res.json(response);
    } catch (error) {
      if (error instanceof AppError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
        };
        res.status(error.statusCode).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Internal server error',
        };
        res.status(500).json(response);
      }
    }
  }
);

// Check if rebalancing is needed
router.get('/portfolios/:id/rebalancing/check',
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: errors.array(),
        };
        return res.status(400).json(response);
      }

      const portfolioId = parseInt(req.params.id);

      const needed = await rebalancingService.checkRebalancingNeeded(portfolioId);

      const response: ApiResponse = {
        success: true,
        data: { rebalancing_needed: needed },
      };
      res.json(response);
    } catch (error) {
      if (error instanceof AppError) {
        const response: ApiResponse = {
          success: false,
          error: error.message,
        };
        res.status(error.statusCode).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Internal server error',
        };
        res.status(500).json(response);
      }
    }
  }
);

export default router;