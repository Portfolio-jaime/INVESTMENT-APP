# ML Prediction Service

Machine Learning prediction service for the TRII Investment Platform. Provides price predictions, trading signals, and trend analysis using simple ML models and technical indicators.

## Overview

The ML Prediction Service offers three main prediction capabilities:

1. **Price Prediction** - Next day closing price forecast using linear regression
2. **Trading Signals** - Buy/Sell/Hold recommendations based on RSI and MACD
3. **Trend Analysis** - Up/Down/Neutral trend prediction using moving average slope

## Technology Stack

- **Framework**: FastAPI
- **ML Library**: scikit-learn
- **Data Processing**: pandas, numpy
- **HTTP Client**: httpx
- **Logging**: structlog
- **Monitoring**: Prometheus

## Architecture

### ML Models

#### Price Prediction
- **Algorithm**: Linear Regression with Moving Averages
- **Features**: Day number, 5-day SMA, 10-day SMA, Volume
- **Output**: Predicted price, confidence score (R² score)

#### Signal Generation
- **Indicators**: RSI (Relative Strength Index), MACD
- **Rules**:
  - RSI < 30: Buy signal (oversold)
  - RSI > 70: Sell signal (overbought)
  - MACD crossover: Buy/Sell signals
- **Output**: Buy/Sell/Hold with strength and confidence

#### Trend Prediction
- **Method**: Moving Average Slope Analysis
- **Features**: 3-day SMA, 10-day SMA, Price volatility
- **Output**: Trend direction, strength, confidence

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

### Price Prediction
```
POST /api/v1/predictions/price/{symbol}?days_history=60
```
Predict the next trading day's closing price.

**Parameters:**
- `symbol`: Stock symbol (e.g., AAPL)
- `days_history`: Days of historical data to use (30-365, default: 60)

**Response:**
```json
{
  "symbol": "AAPL",
  "current_price": 175.50,
  "predicted_price": 178.25,
  "predicted_change_percent": 1.57,
  "confidence": 0.72,
  "prediction_date": "2025-12-17T00:00:00Z",
  "model_used": "linear_regression"
}
```

### Trading Signal
```
POST /api/v1/predictions/signal/{symbol}?days_history=60
```
Generate buy/sell/hold signal based on technical indicators.

**Parameters:**
- `symbol`: Stock symbol
- `days_history`: Days of historical data (30-365, default: 60)

**Response:**
```json
{
  "symbol": "AAPL",
  "signal": "buy",
  "strength": 0.75,
  "confidence": 0.68,
  "reasoning": {
    "rsi": 28.5,
    "rsi_signal": "oversold",
    "macd_trend": "bullish",
    "macd_histogram": 0.45
  },
  "timestamp": "2025-12-16T12:00:00Z"
}
```

### Trend Prediction
```
POST /api/v1/predictions/trend/{symbol}?days_history=60&window=3
```
Predict price trend direction.

**Parameters:**
- `symbol`: Stock symbol
- `days_history`: Days of historical data (10-365, default: 60)
- `window`: Window for trend calculation (3-10, default: 3)

**Response:**
```json
{
  "symbol": "AAPL",
  "trend": "up",
  "trend_strength": 0.65,
  "confidence": 0.70,
  "momentum_indicators": {
    "sma_3": 176.20,
    "sma_10": 174.80,
    "slope": 0.47,
    "volatility": 2.3
  },
  "timestamp": "2025-12-16T12:00:00Z"
}
```

## Service Integration

The ML Prediction Service integrates with:

- **Market Data Service** (port 8001): Fetches historical price data
- **Analysis Engine** (port 8002): Retrieves technical indicators (RSI, MACD)

## Project Structure

```
ml-prediction/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application
│   ├── api/
│   │   └── predictions.py         # Prediction endpoints
│   ├── core/
│   │   └── config.py              # Configuration settings
│   ├── models/
│   │   └── predictor.py           # ML prediction logic
│   └── schemas/
│       └── predictions.py         # Pydantic schemas
├── requirements.txt               # Python dependencies
├── Dockerfile                     # Container configuration
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## Environment Variables

```bash
# App Settings
DEBUG=true
APP_NAME=ML Prediction Service
APP_VERSION=0.1.0

# API Configuration
API_V1_PREFIX=/api/v1
HOST=0.0.0.0
PORT=8004

# Service URLs
MARKET_DATA_SERVICE_URL=http://market-data:8001
ANALYSIS_ENGINE_URL=http://analysis-engine:8002

# ML Model Settings
MIN_TRAINING_SAMPLES=30
PREDICTION_WINDOW=1

# Technical Indicator Thresholds
RSI_OVERSOLD=30.0
RSI_OVERBOUGHT=70.0
```

## Running the Service

### Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up ml-prediction
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app.main:app --host 0.0.0.0 --port 8004 --reload
```

## API Documentation

Once running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8004/docs
- **ReDoc**: http://localhost:8004/redoc
- **OpenAPI JSON**: http://localhost:8004/api/v1/openapi.json

## Monitoring

- **Prometheus Metrics**: http://localhost:8004/metrics
- **Health Check**: http://localhost:8004/health

## Model Details

### Minimum Data Requirements
- Price Prediction: 30 days minimum
- Signal Generation: 30 days minimum
- Trend Prediction: 10 days minimum (configurable window)

### Confidence Scoring
- **Price Prediction**: Based on R² score of linear regression model
- **Signal Generation**: Based on indicator agreement (RSI + MACD)
- **Trend Prediction**: Based on price movement consistency

## Limitations

This is a **simple ML service** focusing on basic functionality:

- Uses linear regression (not complex neural networks)
- Simple technical indicator-based signals
- Not suitable for production trading without further validation
- No model persistence or retraining capabilities
- Single-day prediction horizon

## Future Enhancements

- Advanced ML models (LSTM, Random Forest)
- Multi-day predictions
- Model persistence and versioning
- Backtesting capabilities
- More technical indicators
- Sentiment analysis integration
- Real-time predictions via WebSocket

## Dependencies

Key Python packages:
- fastapi==0.109.0
- uvicorn==0.27.0
- scikit-learn==1.4.0
- numpy==1.26.3
- pandas==2.2.0
- httpx==0.26.0
- structlog==24.1.0

See `requirements.txt` for complete list.

## License

Part of the TRII Investment Platform.
