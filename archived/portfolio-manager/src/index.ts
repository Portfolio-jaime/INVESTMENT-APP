import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { AppError, ApiResponse } from './types';

// Import routes
import portfolioRoutes from './routes/portfolios';
import transactionRoutes from './routes/transactions';
import positionRoutes from './routes/positions';
import analyticsRoutes from './routes/analytics';
import brokerRoutes from './routes/brokers';
import rebalancingRoutes from './routes/rebalancing';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8003;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // HTTP request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await testConnection();
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        service: 'portfolio-manager',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'connected' : 'disconnected',
      },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Service unhealthy',
      data: {
        status: 'unhealthy',
        service: 'portfolio-manager',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(503).json(response);
  }
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      service: 'TRII Portfolio Manager',
      version: '1.0.0',
      description: 'Portfolio management microservice for TRII Investment Platform',
      endpoints: {
        health: '/health',
        portfolios: '/api/v1/portfolios',
        transactions: '/api/v1/portfolios/:id/transactions',
        positions: '/api/v1/portfolios/:id/positions',
        summary: '/api/v1/portfolios/:id/summary',
        performance: '/api/v1/portfolios/:id/performance',
        risk: '/api/v1/portfolios/:id/risk',
        diversification: '/api/v1/portfolios/:id/diversification',
        taxes: '/api/v1/portfolios/:id/taxes/:year',
        brokers: '/api/v1/portfolios/:id/brokers',
        rebalancing: '/api/v1/portfolios/:id/rebalancing',
      },
    },
  };
  res.json(response);
});

// API Routes
app.use('/api/v1/portfolios', portfolioRoutes);
app.use('/api/v1/portfolios', transactionRoutes);
app.use('/api/v1/portfolios', positionRoutes);
app.use('/api/v1', analyticsRoutes);
app.use('/api/v1', brokerRoutes);
app.use('/api/v1', rebalancingRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: 'Route not found',
  };
  res.status(404).json(response);
});

// Error handling middleware
app.use((err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
    };
    res.status(err.statusCode).json(response);
  } else {
    const response: ApiResponse = {
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    };
    res.status(500).json(response);
  }
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Retrying in 5 seconds...');
      setTimeout(startServer, 5000);
      return;
    }

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║  TRII Portfolio Manager Service                           ║
║  Status: Running                                           ║
║  Port: ${PORT}                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║  Database: Connected                                       ║
║  Time: ${new Date().toISOString()}                         ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the application
startServer();

export default app;
