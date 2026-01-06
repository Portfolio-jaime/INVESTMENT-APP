import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ApiResponse, AppError } from '../types';
import brokerService from '../services/brokerService';

const router = express.Router();

// Connect broker account
router.post('/portfolios/:id/brokers',
  [
    param('id').isInt().withMessage('Portfolio ID must be an integer'),
    body('broker_name').isString().notEmpty().withMessage('Broker name is required'),
    body('account_number').isString().notEmpty().withMessage('Account number is required'),
    body('credentials.api_key').optional().isString(),
    body('credentials.api_secret').optional().isString(),
    body('credentials.access_token').optional().isString(),
    body('credentials.refresh_token').optional().isString(),
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
      const { broker_name, account_number, credentials } = req.body;

      const brokerAccount = await brokerService.connectBrokerAccount(
        portfolioId,
        broker_name,
        account_number,
        credentials
      );

      const response: ApiResponse = {
        success: true,
        data: brokerAccount,
        message: 'Broker account connected successfully',
      };
      res.status(201).json(response);
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

// Get broker accounts for portfolio
router.get('/portfolios/:id/brokers',
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

      const brokerAccounts = await brokerService.getBrokerAccounts(portfolioId);

      const response: ApiResponse = {
        success: true,
        data: brokerAccounts,
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

// Sync broker account
router.post('/brokers/:accountId/sync',
  [
    param('accountId').isString().notEmpty().withMessage('Account ID is required'),
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

      const accountId = req.params.accountId;

      await brokerService.syncBrokerAccount(accountId);

      const response: ApiResponse = {
        success: true,
        message: 'Broker account synced successfully',
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

// Sync real-time prices
router.post('/portfolios/:id/sync-prices',
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

      await brokerService.syncRealTimePrices(portfolioId);

      const response: ApiResponse = {
        success: true,
        message: 'Real-time prices synced successfully',
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

// Get sync status
router.get('/portfolios/:id/sync-status',
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

      const syncStatus = await brokerService.getSyncStatus(portfolioId);

      const response: ApiResponse = {
        success: true,
        data: syncStatus,
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