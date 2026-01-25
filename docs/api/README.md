# TRII Platform - API Documentation

## Overview

The TRII platform consists of multiple microservices, each exposing REST APIs for specific functionality. This document provides comprehensive API documentation for all services.

## Service Architecture

### Market Data Service
**Base URL**: `http://localhost:8001`
**Framework**: FastAPI (Python)
**Purpose**: Real-time market data aggregation and serving

### Analysis Engine Service
**Base URL**: `http://localhost:8002`
**Framework**: FastAPI (Python)
**Purpose**: Technical analysis and financial calculations

### Portfolio Manager Service
**Base URL**: `http://localhost:8003`
**Framework**: NestJS (TypeScript)
**Purpose**: Portfolio tracking and management

### ML Prediction Service
**Base URL**: `http://localhost:8004`
**Framework**: FastAPI (Python)
**Purpose**: AI/ML-powered investment insights

## API Endpoints

### Market Data Service

#### Get Real-time Quote
```http
GET /api/v1/quotes/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol (e.g., AAPL, GOOGL)

**Response**:
```json
{
  "symbol": "AAPL",
  "price": 150.25,
  "change": 2.15,
  "change_percent": 1.45,
  "volume": 45234123,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Historical Prices
```http
GET /api/v1/historical/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol
- `period` (query): Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
- `interval` (query): Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)

**Response**:
```json
{
  "symbol": "AAPL",
  "data": [
    {
      "date": "2024-01-15",
      "open": 148.50,
      "high": 151.20,
      "low": 147.80,
      "close": 150.25,
      "volume": 45234123
    }
  ]
}
```

### Analysis Engine Service

#### Technical Indicators

##### Simple Moving Average (SMA)
```http
GET /api/v1/indicators/sma/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol
- `period` (query, optional): Period for calculation (default: 20)

**Response**:
```json
{
  "symbol": "AAPL",
  "indicator": "SMA",
  "period": 20,
  "data": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "value": 149.75
    }
  ]
}
```

##### Exponential Moving Average (EMA)
```http
GET /api/v1/indicators/ema/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol
- `period` (query, optional): Period for calculation (default: 20)

##### Relative Strength Index (RSI)
```http
GET /api/v1/indicators/rsi/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol
- `period` (query, optional): Period for calculation (default: 14)

##### MACD (Moving Average Convergence Divergence)
```http
GET /api/v1/indicators/macd/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol
- `fast` (query, optional): Fast period (default: 12)
- `slow` (query, optional): Slow period (default: 26)
- `signal` (query, optional): Signal period (default: 9)

##### Bollinger Bands
```http
GET /api/v1/indicators/bollinger/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol
- `period` (query, optional): Period for moving average (default: 20)
- `std_dev` (query, optional): Standard deviation multiplier (default: 2.0)

##### All Indicators
```http
GET /api/v1/indicators/all/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol

**Response**: Combined response with all technical indicators

#### Comprehensive Analysis
```http
GET /api/v1/analysis/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol
- `include_fundamental` (query, optional): Include fundamental analysis (default: true)
- `include_sentiment` (query, optional): Include sentiment analysis (default: true)
- `include_colombian` (query, optional): Include Colombian market analysis (default: true)
- `include_llm` (query, optional): Include LLM insights (default: true)

**Response**:
```json
{
  "symbol": "AAPL",
  "technical": {
    "sma": {...},
    "ema": {...},
    "rsi": {...},
    "macd": {...},
    "bollinger_bands": {...}
  },
  "fundamental": {
    "pe_ratio": 28.5,
    "pb_ratio": 8.2,
    "market_cap": 2800000000000,
    "roe": 0.85,
    "debt_to_equity": 1.2
  },
  "sentiment": {
    "overall_sentiment": "positive",
    "confidence": 0.78,
    "sources_analyzed": 25
  },
  "colombian_market": {
    "trm_impact": "moderate",
    "bvc_pattern": "bullish",
    "market_context": "favorable"
  },
  "llm_insights": {
    "recommendation": "BUY",
    "confidence": 0.82,
    "reasoning": "Strong technical indicators and positive market sentiment suggest upward momentum"
  }
}
```

### Portfolio Manager Service

#### Portfolio Operations

##### Get User Portfolios
```http
GET /api/v1/portfolios
```

**Headers**:
- `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": 1,
    "name": "Main Portfolio",
    "currency": "USD",
    "cash_balance": 50000.00,
    "total_value": 125000.00,
    "is_active": true
  }
]
```

##### Create Portfolio
```http
POST /api/v1/portfolios
```

**Request Body**:
```json
{
  "name": "New Portfolio",
  "description": "Investment portfolio",
  "currency": "USD"
}
```

##### Get Portfolio Positions
```http
GET /api/v1/portfolios/{portfolioId}/positions
```

**Response**:
```json
[
  {
    "symbol": "AAPL",
    "quantity": 100,
    "avg_cost": 145.50,
    "current_price": 150.25,
    "market_value": 15025.00,
    "unrealized_pnl": 475.00,
    "unrealized_pnl_percent": 3.26
  }
]
```

##### Add Transaction
```http
POST /api/v1/portfolios/{portfolioId}/transactions
```

**Request Body**:
```json
{
  "symbol": "AAPL",
  "transaction_type": "BUY",
  "quantity": 50,
  "price": 150.00,
  "fees": 5.00
}
```

#### Watchlist Operations

##### Get Watchlist
```http
GET /api/v1/watchlist
```

**Response**:
```json
[
  {
    "id": 1,
    "symbol": "AAPL",
    "notes": "Tech sector leader",
    "added_at": "2024-01-15T09:00:00Z"
  }
]
```

##### Add to Watchlist
```http
POST /api/v1/watchlist
```

**Request Body**:
```json
{
  "symbol": "AAPL",
  "notes": "Monitor for breakout"
}
```

#### Alert Operations

##### Get Alerts
```http
GET /api/v1/alerts
```

**Response**:
```json
[
  {
    "id": 1,
    "symbol": "AAPL",
    "alert_type": "PRICE",
    "condition": "ABOVE",
    "target_value": 155.00,
    "is_active": true
  }
]
```

##### Create Alert
```http
POST /api/v1/alerts
```

**Request Body**:
```json
{
  "symbol": "AAPL",
  "alert_type": "PRICE",
  "condition": "ABOVE",
  "target_value": 155.00
}
```

### ML Prediction Service

#### Get Price Predictions
```http
GET /api/v1/predictions/{symbol}
```

**Parameters**:
- `symbol` (path): Stock symbol
- `horizon` (query, optional): Prediction horizon in days (default: 30)

**Response**:
```json
{
  "symbol": "AAPL",
  "predictions": [
    {
      "date": "2024-02-15",
      "predicted_price": 165.50,
      "confidence": 0.78,
      "upper_bound": 175.00,
      "lower_bound": 156.00
    }
  ],
  "model_info": {
    "algorithm": "LSTM",
    "accuracy": 0.85,
    "last_trained": "2024-01-15T08:00:00Z"
  }
}
```

#### Get Recommendations
```http
GET /api/v1/recommendations/{symbol}
```

**Response**:
```json
{
  "symbol": "AAPL",
  "recommendation": "BUY",
  "confidence_score": 0.82,
  "risk_level": "MEDIUM",
  "expected_return": 0.15,
  "time_horizon": "3-6 months",
  "reasoning": "Strong technical indicators and positive market sentiment"
}
```

## Authentication

Most API endpoints require authentication. The platform uses JWT tokens for authentication.

### Getting an Access Token
```http
POST /api/v1/auth/login
```

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "password"
}
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Using the Token
Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Error Handling

All APIs return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid symbol format",
    "details": {
      "symbol": "must be uppercase letters only"
    }
  }
}
```

### Common Error Codes
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Rate Limiting

API endpoints are rate limited to ensure fair usage:

- **Market Data**: 1000 requests/hour per user
- **Analysis Engine**: 500 requests/hour per user
- **Portfolio Manager**: 200 requests/hour per user
- **ML Prediction**: 100 requests/hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## WebSocket Real-time Updates

For real-time data, the platform provides WebSocket endpoints:

### Market Data Stream
```
ws://localhost:8001/ws/quotes
```

**Subscribe Message**:
```json
{
  "action": "subscribe",
  "symbols": ["AAPL", "GOOGL", "MSFT"]
}
```

**Data Message**:
```json
{
  "type": "quote",
  "symbol": "AAPL",
  "data": {
    "price": 150.25,
    "change": 2.15,
    "volume": 45234123,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## API Versioning

The API uses semantic versioning:
- **v1**: Current stable version
- All endpoints are prefixed with `/api/v1/`
- Breaking changes will be released as v2, v3, etc.

## SDKs and Libraries

### Python Client
```python
from trii_client import TriiClient

client = TriiClient(api_key="your-api-key")
quote = client.get_quote("AAPL")
analysis = client.get_analysis("AAPL")
```

### JavaScript/TypeScript Client
```javascript
import { TriiClient } from 'trii-client';

const client = new TriiClient({ apiKey: 'your-api-key' });
const quote = await client.quotes.get('AAPL');
const analysis = await client.analysis.get('AAPL');
```

## Support

For API support and questions:
- **Documentation**: [docs.trii.co/api](https://docs.trii.co/api)
- **Issues**: [GitHub Issues](https://github.com/your-org/investment-app/issues)
- **Email**: api-support@trii-platform.com

## Changelog

### v1.2.0 (Latest)
- Added Colombian market analysis endpoints
- Enhanced ML prediction accuracy
- Improved error handling and validation

### v1.1.0
- Added WebSocket real-time streaming
- Implemented comprehensive analysis endpoint
- Enhanced authentication and security

### v1.0.0
- Initial release with core functionality
- Market data, technical analysis, portfolio management
- Basic ML predictions and recommendations