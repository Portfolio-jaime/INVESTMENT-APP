import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import portfolioService from '../services/portfolioService';
import { AppError, ApiResponse } from '../types';

class PositionController {
  // Validation rules
  validateId = [
    param('id').isInt({ min: 1 }).withMessage('Valid portfolio ID is required'),
  ];

  // Get all positions for a portfolio
  async getPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const portfolioId = parseInt(req.params.id);
      const positions = await portfolioService.getPositions(portfolioId);

      const response: ApiResponse = {
        success: true,
        data: positions,
        message: `Found ${positions.length} position(s)`,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get portfolio summary with P&L
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const portfolioId = parseInt(req.params.id);
      const summary = await portfolioService.getPortfolioSummary(portfolioId);

      const response: ApiResponse = {
        success: true,
        data: summary,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new PositionController();
