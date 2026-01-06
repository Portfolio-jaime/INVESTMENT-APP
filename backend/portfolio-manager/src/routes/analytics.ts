import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiResponse, AppError } from '../types';
import analyticsService from '../services/analyticsService';

const router = express.Router();

// Get performance metrics
router.get('/portfolios/:id/performance',
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    query('period').optional().isIn(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL']).withMessage('Invalid period'),
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
      const period = req.query.period as string || '1Y';

      const metrics = await analyticsService.calculatePerformanceMetrics(portfolioId, period);

      const response: ApiResponse = {
        success: true,
        data: metrics,
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

// Get risk metrics
router.get('/portfolios/:id/risk',
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

      const riskMetrics = await analyticsService.calculateRiskMetrics(portfolioId);

      const response: ApiResponse = {
        success: true,
        data: riskMetrics,
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

// Get diversification analysis
router.get('/portfolios/:id/diversification',
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

      const diversification = await analyticsService.calculateDiversificationAnalysis(portfolioId);

      const response: ApiResponse = {
        success: true,
        data: diversification,
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

// Get tax calculations
router.get('/portfolios/:id/taxes/:year',
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    param('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
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
      const year = parseInt(req.params.year);

      const taxCalculation = await analyticsService.calculateTaxes(portfolioId, year);

      const response: ApiResponse = {
        success: true,
        data: taxCalculation,
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