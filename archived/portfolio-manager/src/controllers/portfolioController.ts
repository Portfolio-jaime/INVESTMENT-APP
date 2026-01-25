import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import portfolioService from '../services/portfolioService';
import { AppError, ApiResponse } from '../types';

class PortfolioController {
  // Validation rules
  validateCreate = [
    body('user_id').isInt({ min: 1 }).withMessage('Valid user_id is required'),
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  ];

  validateUpdate = [
    param('id').isInt({ min: 1 }).withMessage('Valid portfolio ID is required'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('is_active').optional().isBoolean(),
  ];

  validateId = [
    param('id').isInt({ min: 1 }).withMessage('Valid portfolio ID is required'),
  ];

  // Get all portfolios
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;
      const portfolios = await portfolioService.getAllPortfolios(userId);

      const response: ApiResponse = {
        success: true,
        data: portfolios,
        message: `Found ${portfolios.length} portfolio(s)`,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get portfolio by ID
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const id = parseInt(req.params.id);
      const portfolio = await portfolioService.getPortfolioById(id);

      if (!portfolio) {
        throw new AppError('Portfolio not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: portfolio,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Create portfolio
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const portfolio = await portfolioService.createPortfolio(req.body);

      const response: ApiResponse = {
        success: true,
        data: portfolio,
        message: 'Portfolio created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Update portfolio
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const id = parseInt(req.params.id);
      const portfolio = await portfolioService.updatePortfolio(id, req.body);

      const response: ApiResponse = {
        success: true,
        data: portfolio,
        message: 'Portfolio updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Delete portfolio (soft delete)
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed', 400);
      }

      const id = parseInt(req.params.id);
      await portfolioService.deletePortfolio(id);

      const response: ApiResponse = {
        success: true,
        message: 'Portfolio deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new PortfolioController();
