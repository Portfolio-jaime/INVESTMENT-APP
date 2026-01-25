# TRII Investment Platform - Getting Started Guide

## Overview

The TRII Investment Platform is a comprehensive investment management system with four main microservices:

1. **Market Data Service** (Port 8001) - Real-time stock quotes and historical data
2. **Analysis Engine** (Port 8002) - Technical indicators (RSI, MACD, SMA, EMA, Bollinger Bands)
3. **Portfolio Manager** (Port 8003) - Portfolio and transaction management
4. **ML Prediction Service** (Port 8004) - Machine learning price predictions and trading signals

## Prerequisites

- Docker and Docker Compose installed
- All services running (use `docker-compose up -d`)
- Database initialized (see Database Setup section)

## Database Setup

The platform requires PostgreSQL tables for all services. Run the initialization script:

```bash
docker exec -i trii-postgres psql -U postgres -d trii_dev < /Users/jaime.henao/arheanja/investment-app/scripts/database/init_db.sql
```

This creates the following tables:
- `quotes` - Real-time market quotes
- `historical_prices` - Historical OHLCV data (TimescaleDB hypertable)
- `portfolios` - User investment portfolios
- `transactions` - Buy/sell transactions
- `positions` - Current holdings in portfolios
- `watchlist` - User watchlist of symbols
- `alerts` - Price and signal alerts
- `users` - Platform users
- `audit_log` - Audit trail (TimescaleDB hypertable)

## API Configuration

### Environment Variables

The `.env` file in the project root contains all configuration:

```env
# Alpha Vantage API Key (required for market data)
ALPHA_VANTAGE_API_KEY=DMRJBMVCSWVOKFMO

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trii_dev

# Redis
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
```

## Service Endpoints

### 1. Market Data Service (Port 8001)

Base URL: `http://localhost:8001/api/v1/market-data`

#### Get Real-time Quote

```bash
curl -s http://localhost:8001/api/v1/market-data/quotes/AAPL | jq .
```

**Response:**
```json
{
  "symbol": "AAPL",
  "exchange": "US",
  "price": 274.11,
  "open_price": 280.15,
  "high": 280.15,
  "low": 272.84,
  "previous_close": 278.28,
  "change": -4.17,
  "change_percent": -1.4985,
  "volume": 50409078,
  "avg_volume": null,
  "market_cap": null,
  "shares_outstanding": null,
  "timestamp": "2025-12-16T19:29:41.775442Z",
  "id": 2,
  "created_at": "2025-12-16T19:29:41.904643Z"
}
```

#### Get Historical Data

```bash
curl -s "http://localhost:8001/api/v1/market-data/quotes/AAPL/historical?limit=30" | jq .
```

**Note:** Historical data needs to be populated from Alpha Vantage. Currently returns 404 if no data exists.

#### Health Check

```bash
curl -s http://localhost:8001/health | jq .
```

**Response:**
```json
{
  "status": "healthy",
  "service": "TRII Market Data Service",
  "version": "1.0.0"
}
```

### 2. Analysis Engine (Port 8002)

Base URL: `http://localhost:8002/api/v1`

**Note:** Analysis endpoints require historical data to be available in the Market Data Service.

#### Get RSI Indicator

```bash
curl -s "http://localhost:8002/api/v1/indicators/rsi/AAPL" | jq .
```

#### Get MACD Indicator

```bash
curl -s "http://localhost:8002/api/v1/indicators/macd/AAPL" | jq .
```

#### Get SMA (Simple Moving Average)

```bash
curl -s "http://localhost:8002/api/v1/indicators/sma/AAPL?period=20" | jq .
```

#### Get EMA (Exponential Moving Average)

```bash
curl -s "http://localhost:8002/api/v1/indicators/ema/AAPL?period=12" | jq .
```

#### Get Bollinger Bands

```bash
curl -s "http://localhost:8002/api/v1/indicators/bollinger/AAPL" | jq .
```

#### Get All Indicators

```bash
curl -s "http://localhost:8002/api/v1/indicators/all/AAPL" | jq .
```

#### Health Check

```bash
curl -s http://localhost:8002/health | jq .
```

**Response:**
```json
{
  "status": "healthy",
  "service": "TRII Analysis Engine",
  "version": "1.0.0"
}
```

### 3. Portfolio Manager (Port 8003)

Base URL: `http://localhost:8003/api/v1`

#### Create Portfolio

```bash
curl -X POST http://localhost:8003/api/v1/portfolios \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Test Portfolio",
    "description": "Sample portfolio for testing TRII platform",
    "currency": "USD"
  }' | jq .
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "user_id": "1",
    "name": "Test Portfolio",
    "description": "Sample portfolio for testing TRII platform",
    "currency": "USD",
    "is_active": true,
    "created_at": "2025-12-16T19:33:49.084Z",
    "updated_at": null
  },
  "message": "Portfolio created successfully"
}
```

#### Get Portfolio by ID

```bash
curl -s http://localhost:8003/api/v1/portfolios/1 | jq .
```

#### Get All Portfolios

```bash
curl -s http://localhost:8003/api/v1/portfolios | jq .
```

#### Add Transaction (Buy/Sell)

```bash
curl -X POST http://localhost:8003/api/v1/portfolios/1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "transaction_type": "BUY",
    "quantity": 10,
    "price": 274.11,
    "fees": 5.00,
    "transaction_date": "2025-12-16T19:30:00Z",
    "notes": "Initial AAPL purchase for testing"
  }' | jq .
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "portfolio_id": "1",
    "symbol": "AAPL",
    "transaction_type": "BUY",
    "quantity": 10,
    "price": 274.11,
    "fees": 5,
    "total": 2746.1,
    "notes": "Initial AAPL purchase for testing",
    "transaction_date": "2025-12-16T19:30:00.000Z",
    "created_at": "2025-12-16T19:34:00.620Z"
  },
  "message": "Transaction created successfully"
}
```

#### Get Portfolio Positions

```bash
curl -s http://localhost:8003/api/v1/portfolios/1/positions | jq .
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "portfolio_id": "1",
      "symbol": "AAPL",
      "quantity": 10,
      "avg_cost": 274.11,
      "current_price": null,
      "market_value": null,
      "unrealized_pnl": null,
      "unrealized_pnl_percent": null,
      "last_updated": "2025-12-16T19:34:00.620Z",
      "created_at": "2025-12-16T19:34:00.620Z",
      "total_cost": 2741.1
    }
  ],
  "message": "Found 1 position(s)"
}
```

#### Get Portfolio Transactions

```bash
curl -s http://localhost:8003/api/v1/portfolios/1/transactions | jq .
```

#### Update Portfolio

```bash
curl -X PUT http://localhost:8003/api/v1/portfolios/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Portfolio Name",
    "description": "Updated description"
  }' | jq .
```

#### Delete Portfolio (Soft Delete)

```bash
curl -X DELETE http://localhost:8003/api/v1/portfolios/1 | jq .
```

#### Health Check

```bash
curl -s http://localhost:8003/health | jq .
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "portfolio-manager",
    "version": "1.0.0",
    "timestamp": "2025-12-16T19:29:28.182Z",
    "database": "connected"
  }
}
```

### 4. ML Prediction Service (Port 8004)

Base URL: `http://localhost:8004/api/v1`

**Note:** ML predictions require historical data (60+ days) to be available in the Market Data Service.

#### Get Price Prediction

Predicts the next trading day's closing price using linear regression.

```bash
curl -X POST "http://localhost:8004/api/v1/predictions/price/AAPL?days_history=60" | jq .
```

**Expected Response (when historical data is available):**
```json
{
  "symbol": "AAPL",
  "prediction_type": "price",
  "predicted_price": 275.50,
  "confidence": 0.85,
  "prediction_date": "2025-12-17",
  "model": "linear_regression",
  "features_used": ["close", "volume", "sma_20", "rsi_14"],
  "timestamp": "2025-12-16T19:35:00.000Z"
}
```

#### Get Trading Signal

Generates a trading signal (BUY, SELL, HOLD) based on technical indicators.

```bash
curl -X POST "http://localhost:8004/api/v1/predictions/signal/AAPL?days_history=60" | jq .
```

**Expected Response (when historical data is available):**
```json
{
  "symbol": "AAPL",
  "signal": "BUY",
  "strength": 0.75,
  "confidence": 0.82,
  "indicators": {
    "rsi": 45.5,
    "macd": 1.25,
    "sma_cross": "bullish"
  },
  "timestamp": "2025-12-16T19:35:00.000Z"
}
```

#### Get Trend Prediction

Predicts the market trend (BULLISH, BEARISH, NEUTRAL).

```bash
curl -X POST "http://localhost:8004/api/v1/predictions/trend/AAPL?days_history=60" | jq .
```

**Expected Response (when historical data is available):**
```json
{
  "symbol": "AAPL",
  "trend": "BULLISH",
  "confidence": 0.78,
  "duration": "short_term",
  "support_level": 270.00,
  "resistance_level": 280.00,
  "timestamp": "2025-12-16T19:35:00.000Z"
}
```

#### Current Status

Currently, ML predictions return an error because historical data is not yet populated:

```bash
curl -X POST "http://localhost:8004/api/v1/predictions/price/AAPL" | jq .
```

**Current Response:**
```json
{
  "detail": "Cannot fetch market data: Client error '404 Not Found' for url 'http://market-data:8001/api/v1/market-data/AAPL/historical?days=60'"
}
```

#### Health Check

```bash
curl -s http://localhost:8004/health | jq .
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ML Prediction Service",
  "version": "0.1.0"
}
```

## Interactive API Documentation

All services provide interactive Swagger UI documentation:

- Market Data: http://localhost:8001/docs
- Analysis Engine: http://localhost:8002/docs
- Portfolio Manager: http://localhost:8003/docs (TypeScript/Express - basic docs)
- ML Prediction: http://localhost:8004/docs

## Sample Workflow

### 1. Create a Portfolio and Add Transactions

```bash
# Create portfolio
PORTFOLIO_RESPONSE=$(curl -s -X POST http://localhost:8003/api/v1/portfolios \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "My Investment Portfolio",
    "description": "Long-term growth portfolio",
    "currency": "USD"
  }')

PORTFOLIO_ID=$(echo $PORTFOLIO_RESPONSE | jq -r '.data.id')
echo "Created portfolio with ID: $PORTFOLIO_ID"

# Get current AAPL price
AAPL_PRICE=$(curl -s http://localhost:8001/api/v1/market-data/quotes/AAPL | jq -r '.price')
echo "Current AAPL price: $AAPL_PRICE"

# Buy 10 shares of AAPL
curl -X POST http://localhost:8003/api/v1/portfolios/$PORTFOLIO_ID/transactions \
  -H "Content-Type: application/json" \
  -d "{
    \"symbol\": \"AAPL\",
    \"transaction_type\": \"BUY\",
    \"quantity\": 10,
    \"price\": $AAPL_PRICE,
    \"fees\": 5.00,
    \"transaction_date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"notes\": \"Initial AAPL purchase\"
  }" | jq .

# View portfolio positions
curl -s http://localhost:8003/api/v1/portfolios/$PORTFOLIO_ID/positions | jq .
```

### 2. Monitor Stock Prices

```bash
# Get real-time quotes for multiple symbols
for symbol in AAPL MSFT GOOGL TSLA; do
  echo "=== $symbol ==="
  curl -s http://localhost:8001/api/v1/market-data/quotes/$symbol | jq '{
    symbol: .symbol,
    price: .price,
    change: .change,
    change_percent: .change_percent,
    volume: .volume
  }'
  echo
done
```

### 3. Analyze Technical Indicators (Requires Historical Data)

```bash
# Get all indicators for AAPL
curl -s "http://localhost:8002/api/v1/indicators/all/AAPL" | jq .

# Get specific indicators
curl -s "http://localhost:8002/api/v1/indicators/rsi/AAPL" | jq .
curl -s "http://localhost:8002/api/v1/indicators/macd/AAPL" | jq .
```

## Troubleshooting

### Issue: Historical Data Not Available

**Symptom:** ML predictions and technical analysis return 404 errors.

**Solution:** Historical data needs to be fetched from Alpha Vantage and stored in the database. This is a known limitation with the demo API key which has rate limits.

**Workaround:** Use a paid Alpha Vantage API key or populate the database with sample historical data.

### Issue: Portfolio Service Returns 500 Error

**Symptom:** Cannot create portfolios or transactions.

**Solution:** Ensure the database tables are initialized:

```bash
docker exec -i trii-postgres psql -U postgres -d trii_dev < /Users/jaime.henao/arheanja/investment-app/scripts/database/init_db.sql
```

### Issue: Service is Unhealthy

**Symptom:** `docker ps` shows service as "unhealthy"

**Solution:** Check service logs:

```bash
docker logs trii-market-data --tail 50
docker logs trii-analysis-engine --tail 50
docker logs trii-portfolio-manager --tail 50
docker logs trii-ml-prediction --tail 50
```

### Issue: Cannot Connect to Database

**Symptom:** Services fail to start or return database connection errors.

**Solution:** Ensure PostgreSQL is running and accessible:

```bash
docker ps | grep postgres
docker exec trii-postgres psql -U postgres -d trii_dev -c "SELECT version();"
```

### Issue: Alpha Vantage Rate Limit Exceeded

**Symptom:** Market data requests return rate limit errors.

**Solution:**
- Wait for the rate limit to reset (typically 1 minute for free tier)
- Upgrade to a paid Alpha Vantage API key
- Use cached data when available

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TRII Platform                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Market Data │  │   Analysis   │  │  Portfolio   │      │
│  │   Service    │→ │    Engine    │  │   Manager    │      │
│  │   (8001)     │  │   (8002)     │  │   (8003)     │      │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘      │
│         │                                     │              │
│         └────────────┬────────────────────────┘              │
│                      ↓                                       │
│              ┌──────────────┐                                │
│              │      ML      │                                │
│              │  Prediction  │                                │
│              │   (8004)     │                                │
│              └──────────────┘                                │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                          │
│  ┌──────────┐  ┌───────┐  ┌──────────┐  ┌────────┐         │
│  │PostgreSQL│  │ Redis │  │ RabbitMQ │  │ MinIO  │         │
│  └──────────┘  └───────┘  └──────────┘  └────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

1. **Populate Historical Data**: Set up a data ingestion pipeline to fetch and store historical data from Alpha Vantage
2. **Enable ML Predictions**: Once historical data is available, test all ML prediction endpoints
3. **Set Up Monitoring**: Configure Prometheus and Grafana for service monitoring
4. **Implement Authentication**: Add JWT-based authentication for production use
5. **Build Desktop App**: Develop the Electron-based desktop application
6. **Add Real-time Updates**: Implement WebSocket connections for live market data

## Support

For issues and questions:
- Check service logs: `docker logs <service-name>`
- Review service documentation: http://localhost:<port>/docs
- Check the main README.md for architecture details

## Testing Summary

- Market Data Service: WORKING - Real-time quotes functional
- Analysis Engine: REQUIRES HISTORICAL DATA - Service healthy but needs data
- Portfolio Manager: WORKING - Portfolios and transactions functional
- ML Prediction Service: REQUIRES HISTORICAL DATA - Service healthy but needs data

All core infrastructure (PostgreSQL, Redis, RabbitMQ, MinIO) is operational and healthy.
