# ML Prediction Service - Quick Start Guide

## Starting the Service

### Option 1: Docker Compose (Recommended)

Start all services including ml-prediction:
```bash
cd /Users/jaime.henao/arheanja/investment-app
docker-compose up ml-prediction
```

Or start in detached mode:
```bash
docker-compose up -d ml-prediction
```

### Option 2: Local Development

```bash
cd services/ml-prediction

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app.main:app --host 0.0.0.0 --port 8004 --reload
```

## Verify Service is Running

Check health:
```bash
curl http://localhost:8004/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ML Prediction Service",
  "version": "0.1.0"
}
```

## Try the API

### 1. View API Documentation

Open in browser:
- Swagger UI: http://localhost:8004/docs
- ReDoc: http://localhost:8004/redoc

### 2. Get Price Prediction

```bash
curl -X POST "http://localhost:8004/api/v1/predictions/price/AAPL?days_history=60"
```

### 3. Get Trading Signal

```bash
curl -X POST "http://localhost:8004/api/v1/predictions/signal/AAPL?days_history=60"
```

### 4. Get Trend Prediction

```bash
curl -X POST "http://localhost:8004/api/v1/predictions/trend/AAPL?days_history=60&window=3"
```

## Run Tests

```bash
# Install test dependencies (if not already installed)
pip install pytest pytest-asyncio

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_predictor.py -v
```

## Common Issues

### Service won't start
- Ensure Market Data Service (port 8001) is running
- Ensure Analysis Engine (port 8002) is running
- Check port 8004 is not already in use

### Predictions fail
- Verify Market Data Service is accessible: `curl http://localhost:8001/health`
- Verify Analysis Engine is accessible: `curl http://localhost:8002/health`
- Check logs: `docker-compose logs ml-prediction`

### Import errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version is 3.11+: `python --version`

## Service Dependencies

This service requires:
1. **Market Data Service** (port 8001) - For historical price data
2. **Analysis Engine** (port 8002) - For technical indicators (RSI, MACD)

## Next Steps

1. Review the API documentation at http://localhost:8004/docs
2. Explore the prediction endpoints with different symbols
3. Check the README.md for detailed information
4. Review the code in `app/` directory to understand the ML models

## Support

For issues or questions:
- Check the main README.md
- Review the API documentation
- Check Docker logs: `docker-compose logs ml-prediction`
