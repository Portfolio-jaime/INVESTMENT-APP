# Documentación de APIs - TRII Platform

## 🚀 Visión General

La plataforma TRII expone una suite completa de APIs RESTful para todas las funcionalidades core del sistema de inversiones. Todas las APIs siguen estándares OpenAPI 3.0 y están documentadas con Swagger UI.

## 🌐 URLs Base

| Ambiente | URL Base | Estado |
|----------|----------|--------|
| **Desarrollo** | `http://localhost:8080/api/v1` | ✅ Activo |
| **Staging** | `https://api-staging.trii.co/v1` | ✅ Activo |
| **Producción** | `https://api.trii.co/v1` | ✅ Activo |

## 🔑 Autenticación

### Bearer Token Authentication

```http
Authorization: Bearer <jwt_token>
```

### Obtener Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "tu_password_seguro"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "usuario@example.com",
    "first_name": "Juan",
    "last_name": "Pérez"
  }
}
```

## 📊 Market Data Service (Puerto 8001)

### Obtener Cotizaciones en Tiempo Real

```http
GET /market-data/quotes/{symbols}
```

**Parámetros:**
- `symbols` (string): Lista de símbolos separados por comas (ej: "AAPL,GOOGL,MSFT")

**Ejemplo:**
```http
GET /market-data/quotes/AAPL,GOOGL
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "data": {
    "AAPL": {
      "symbol": "AAPL",
      "price": 192.53,
      "change": 2.34,
      "change_percent": 1.23,
      "volume": 45234567,
      "high": 194.20,
      "low": 190.15,
      "open": 191.00,
      "previous_close": 190.19,
      "timestamp": "2026-01-11T15:30:00Z",
      "market_status": "OPEN"
    },
    "GOOGL": {
      "symbol": "GOOGL",
      "price": 2845.67,
      "change": -15.23,
      "change_percent": -0.53,
      "volume": 1234567,
      "high": 2860.00,
      "low": 2835.50,
      "open": 2850.00,
      "previous_close": 2860.90,
      "timestamp": "2026-01-11T15:30:00Z",
      "market_status": "OPEN"
    }
  },
  "timestamp": "2026-01-11T15:30:15Z",
  "source": "realtime"
}
```

### Obtener Datos Históricos

```http
GET /market-data/historical/{symbol}?period={period}&interval={interval}
```

**Parámetros:**
- `symbol` (string): Símbolo del instrumento
- `period` (string): Período de datos (`1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`)
- `interval` (string): Intervalo de datos (`1m`, `5m`, `15m`, `1h`, `1d`)

**Ejemplo:**
```http
GET /market-data/historical/AAPL?period=1mo&interval=1d
```

**Respuesta:**
```json
{
  "symbol": "AAPL",
  "period": "1mo",
  "interval": "1d",
  "data": [
    {
      "timestamp": "2025-12-11T00:00:00Z",
      "open": 185.25,
      "high": 187.50,
      "low": 183.10,
      "close": 186.75,
      "volume": 52345678,
      "adjusted_close": 186.75
    }
    // ... más datos
  ],
  "count": 22
}
```

### WebSocket - Streaming de Datos

```javascript
const ws = new WebSocket('ws://localhost:8001/market-data/stream');

// Suscribirse a símbolos
ws.send(JSON.stringify({
  action: 'subscribe',
  symbols: ['AAPL', 'GOOGL', 'MSFT']
}));

// Recibir actualizaciones
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Market update:', update);
};
```

## 🔍 Analysis Engine Service (Puerto 8002)

### Obtener Indicadores Técnicos

```http
GET /analysis-engine/indicators/{symbol}?indicators={indicators}&period={period}
```

**Parámetros:**
- `symbol` (string): Símbolo del instrumento
- `indicators` (string): Lista de indicadores separados por comas
- `period` (string): Período de cálculo

**Indicadores disponibles:**
- `RSI` - Relative Strength Index
- `MACD` - Moving Average Convergence Divergence  
- `BB` - Bollinger Bands
- `SMA` - Simple Moving Average
- `EMA` - Exponential Moving Average
- `STOCH` - Stochastic Oscillator
- `ATR` - Average True Range

**Ejemplo:**
```http
GET /analysis-engine/indicators/AAPL?indicators=RSI,MACD,BB&period=14
```

**Respuesta:**
```json
{
  "symbol": "AAPL",
  "timestamp": "2026-01-11T15:30:00Z",
  "indicators": {
    "RSI": {
      "value": 67.25,
      "signal": "NEUTRAL",
      "period": 14,
      "interpretation": "Momentum neutral, approaching overbought"
    },
    "MACD": {
      "macd_line": 1.25,
      "signal_line": 0.85,
      "histogram": 0.40,
      "signal": "BUY",
      "interpretation": "Bullish crossover detected"
    },
    "BB": {
      "upper_band": 195.50,
      "middle_band": 192.00,
      "lower_band": 188.50,
      "current_price": 192.53,
      "position": 0.52,
      "signal": "NEUTRAL"
    }
  }
}
```

### Análisis de Sentimientos

```http
GET /analysis-engine/sentiment/{symbol}?sources={sources}&days={days}
```

**Ejemplo:**
```http
GET /analysis-engine/sentiment/AAPL?sources=news,social&days=7
```

**Respuesta:**
```json
{
  "symbol": "AAPL",
  "period_days": 7,
  "overall_sentiment": {
    "score": 0.73,
    "label": "POSITIVE",
    "confidence": 0.89
  },
  "sources": {
    "news": {
      "score": 0.78,
      "articles_analyzed": 45,
      "recent_headlines": [
        "Apple Reports Strong Q4 Earnings Beat",
        "iPhone Sales Exceed Expectations"
      ]
    },
    "social": {
      "score": 0.68,
      "posts_analyzed": 12573,
      "trending_topics": ["#AAPL", "#iPhone15", "#AppleEarnings"]
    }
  },
  "trend": "IMPROVING",
  "last_updated": "2026-01-11T15:25:00Z"
}
```

### Backtesting de Estrategias

```http
POST /analysis-engine/backtest
Content-Type: application/json
```

**Body:**
```json
{
  "strategy": {
    "name": "RSI_MACD_Strategy",
    "rules": {
      "buy": {
        "RSI": {"operator": "<", "value": 30},
        "MACD": {"operator": "crossover", "value": "signal"}
      },
      "sell": {
        "RSI": {"operator": ">", "value": 70},
        "MACD": {"operator": "crossunder", "value": "signal"}
      }
    }
  },
  "symbols": ["AAPL", "GOOGL"],
  "start_date": "2025-01-01",
  "end_date": "2026-01-01",
  "initial_capital": 100000,
  "commission": 0.001
}
```

**Respuesta:**
```json
{
  "backtest_id": "bt_123456789",
  "results": {
    "total_return": 0.2145,
    "annual_return": 0.2145,
    "volatility": 0.18,
    "sharpe_ratio": 1.19,
    "max_drawdown": -0.085,
    "win_rate": 0.67,
    "total_trades": 24,
    "profitable_trades": 16,
    "avg_trade_return": 0.0089,
    "performance_by_symbol": {
      "AAPL": {"return": 0.23, "trades": 12},
      "GOOGL": {"return": 0.19, "trades": 12}
    }
  },
  "equity_curve": [
    {"date": "2025-01-01", "value": 100000},
    {"date": "2025-01-02", "value": 100850}
    // ... más puntos
  ]
}
```

## 🤖 ML Prediction Service (Puerto 8004)

### Generar Predicciones

```http
POST /ml-prediction/forecast
Content-Type: application/json
```

**Body:**
```json
{
  "symbol": "AAPL",
  "horizon_days": 5,
  "model_type": "ensemble",
  "include_confidence": true,
  "features": {
    "technical_indicators": true,
    "sentiment_analysis": true,
    "market_regime": true,
    "volatility_surface": false
  }
}
```

**Respuesta:**
```json
{
  "symbol": "AAPL",
  "predictions": [
    {
      "date": "2026-01-12",
      "predicted_price": 195.25,
      "confidence": 0.87,
      "price_range": {
        "lower": 192.10,
        "upper": 198.40
      }
    },
    {
      "date": "2026-01-13", 
      "predicted_price": 196.80,
      "confidence": 0.82,
      "price_range": {
        "lower": 193.20,
        "upper": 200.40
      }
    }
    // ... más predicciones
  ],
  "model_info": {
    "model_name": "TRII_Ensemble_v2.1",
    "model_version": "2.1.3",
    "training_date": "2026-01-01",
    "features_used": [
      "price_momentum", "volume_profile", "rsi", "macd", 
      "sentiment_score", "market_regime"
    ]
  },
  "metadata": {
    "prediction_time": "2026-01-11T15:30:00Z",
    "current_price": 192.53,
    "market_state": "NORMAL_VOLATILITY"
  }
}
```

### Obtener Performance del Modelo

```http
GET /ml-prediction/model-performance/{model_name}?days={days}
```

**Respuesta:**
```json
{
  "model_name": "TRII_Ensemble_v2.1",
  "evaluation_period": 30,
  "metrics": {
    "mae": 2.35,
    "rmse": 3.42,
    "mape": 0.018,
    "directional_accuracy": 0.73,
    "r2_score": 0.89,
    "confidence_calibration": 0.91
  },
  "by_horizon": {
    "1_day": {"mae": 1.25, "accuracy": 0.78},
    "3_day": {"mae": 2.10, "accuracy": 0.71},
    "5_day": {"mae": 3.45, "accuracy": 0.65}
  },
  "by_asset_class": {
    "large_cap": {"mae": 2.10, "accuracy": 0.75},
    "mid_cap": {"mae": 2.85, "accuracy": 0.68},
    "small_cap": {"mae": 3.90, "accuracy": 0.62}
  }
}
```

## 💼 Portfolio Manager Service (Puerto 8003)

### Obtener Resumen de Portfolio

```http
GET /portfolio-manager/portfolios/{portfolio_id}/summary
```

**Respuesta:**
```json
{
  "portfolio": {
    "id": "p_123456789",
    "name": "Mi Portfolio Principal", 
    "total_value": 125847.67,
    "cash_balance": 5247.32,
    "invested_amount": 120600.35,
    "unrealized_pnl": 2834.56,
    "realized_pnl": 1547.89,
    "total_return": 0.0347,
    "daily_return": 0.0023,
    "positions_count": 8,
    "last_updated": "2026-01-11T15:30:00Z"
  },
  "allocation": {
    "by_asset_class": {
      "stocks": 0.75,
      "etfs": 0.20,
      "bonds": 0.05
    },
    "by_sector": {
      "technology": 0.35,
      "healthcare": 0.20,
      "finance": 0.15,
      "consumer": 0.12,
      "energy": 0.08,
      "other": 0.10
    },
    "by_geography": {
      "us": 0.60,
      "colombia": 0.25,
      "emerging_markets": 0.15
    }
  },
  "performance": {
    "1d": 0.0023,
    "7d": 0.0145,
    "1m": 0.0287,
    "3m": 0.0756,
    "ytd": 0.0347,
    "1y": 0.1234
  }
}
```

### Optimización de Portfolio

```http
POST /portfolio-manager/portfolios/{portfolio_id}/optimize
Content-Type: application/json
```

**Body:**
```json
{
  "optimization_method": "mean_variance",
  "constraints": {
    "max_position_size": 0.15,
    "min_position_size": 0.02,
    "max_sector_allocation": 0.30,
    "target_risk": 0.12,
    "exclude_symbols": ["HIGH_RISK_STOCK"],
    "include_esg": true
  },
  "objective": "maximize_sharpe",
  "rebalance_threshold": 0.05
}
```

**Respuesta:**
```json
{
  "optimization_id": "opt_987654321",
  "current_allocation": {
    "AAPL": 0.15,
    "GOOGL": 0.12,
    "MSFT": 0.10,
    // ... más posiciones
  },
  "recommended_allocation": {
    "AAPL": 0.13,
    "GOOGL": 0.14,
    "MSFT": 0.11,
    "NVDA": 0.08,
    // ... nueva allocación
  },
  "trades_required": [
    {
      "symbol": "GOOGL",
      "action": "BUY",
      "quantity": 15,
      "estimated_cost": 4268.50
    },
    {
      "symbol": "AAPL", 
      "action": "SELL",
      "quantity": 12,
      "estimated_proceeds": 2310.36
    }
  ],
  "expected_improvement": {
    "expected_return": 0.145,
    "expected_volatility": 0.118,
    "sharpe_ratio": 1.23,
    "diversification_ratio": 0.87
  },
  "costs": {
    "trading_fees": 15.50,
    "market_impact": 8.25,
    "total_cost": 23.75
  }
}
```

### Análisis de Riesgo

```http
GET /portfolio-manager/portfolios/{portfolio_id}/risk-analysis
```

**Respuesta:**
```json
{
  "portfolio_id": "p_123456789",
  "risk_metrics": {
    "portfolio_volatility": 0.118,
    "beta": 1.05,
    "var_1d_95": -2847.50,
    "var_1d_99": -4125.75,
    "expected_shortfall": -5234.25,
    "max_drawdown": -0.085,
    "sharpe_ratio": 1.19,
    "sortino_ratio": 1.67,
    "calmar_ratio": 1.40
  },
  "sector_risk": {
    "technology": {"weight": 0.35, "contribution": 0.42},
    "healthcare": {"weight": 0.20, "contribution": 0.18},
    "finance": {"weight": 0.15, "contribution": 0.16}
  },
  "factor_exposure": {
    "market": 1.05,
    "size": 0.23,
    "value": -0.15,
    "momentum": 0.31,
    "quality": 0.18,
    "volatility": -0.22
  },
  "scenario_analysis": {
    "market_crash_2008": -0.245,
    "covid_march_2020": -0.185,
    "dot_com_bubble": -0.167,
    "inflation_spike": -0.089
  }
}
```

## 🔐 Authentication Service

### Registro de Usuario

```http
POST /auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "email": "nuevo@example.com",
  "password": "password_seguro_123",
  "first_name": "María",
  "last_name": "García",
  "phone": "+57300123456",
  "birth_date": "1990-05-15",
  "country_code": "CO",
  "risk_profile": "MODERATE",
  "terms_accepted": true,
  "privacy_accepted": true
}
```

### Renovar Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Verificación de Email

```http
POST /auth/verify-email
Content-Type: application/json

{
  "verification_token": "abc123def456",
  "email": "usuario@example.com"
}
```

## 📱 Notificaciones Service

### Obtener Notificaciones

```http
GET /notifications?page={page}&limit={limit}&type={type}
```

### Marcar como Leída

```http
PUT /notifications/{notification_id}/read
```

### Configurar Preferencias

```http
PUT /notifications/preferences
Content-Type: application/json

{
  "email_notifications": true,
  "push_notifications": true,
  "sms_notifications": false,
  "types": {
    "trade_executed": true,
    "portfolio_alert": true,
    "market_news": false,
    "price_alerts": true
  }
}
```

## 📊 Códigos de Respuesta HTTP

| Código | Significado | Descripción |
|--------|-------------|-------------|
| `200` | OK | Solicitud exitosa |
| `201` | Created | Recurso creado exitosamente |
| `400` | Bad Request | Parámetros inválidos o faltantes |
| `401` | Unauthorized | Token inválido o faltante |
| `403` | Forbidden | Sin permisos para el recurso |
| `404` | Not Found | Recurso no encontrado |
| `422` | Unprocessable Entity | Datos válidos pero lógica de negocio falló |
| `429` | Too Many Requests | Rate limiting activado |
| `500` | Internal Server Error | Error interno del servidor |
| `503` | Service Unavailable | Servicio temporalmente no disponible |

## 🔧 SDKs Disponibles

### JavaScript/TypeScript

```bash
npm install @trii/api-client
```

```typescript
import { TriiApiClient } from '@trii/api-client';

const client = new TriiApiClient({
  baseUrl: 'https://api.trii.co/v1',
  apiKey: 'your-api-key'
});

// Obtener cotizaciones
const quotes = await client.marketData.getQuotes(['AAPL', 'GOOGL']);

// Crear predicción
const prediction = await client.mlPrediction.forecast({
  symbol: 'AAPL',
  horizonDays: 5
});
```

### Python

```bash
pip install trii-api-client
```

```python
from trii_api import TriiClient

client = TriiClient(
    base_url='https://api.trii.co/v1',
    api_key='your-api-key'
)

# Obtener datos históricos
historical = client.market_data.get_historical(
    symbol='AAPL',
    period='1mo',
    interval='1d'
)

# Optimizar portfolio
optimization = client.portfolio_manager.optimize_portfolio(
    portfolio_id='p_123456789',
    method='mean_variance'
)
```

## 📚 Recursos Adicionales

- **🔍 Swagger UI**: https://api.trii.co/docs
- **📖 Postman Collection**: [Descargar](https://api.trii.co/postman-collection.json)
- **🧪 Sandbox Environment**: https://sandbox-api.trii.co/v1
- **📞 Soporte Técnico**: api-support@trii.co

---

**Última actualización**: Enero 2026  
**Versión API**: v1.2.0