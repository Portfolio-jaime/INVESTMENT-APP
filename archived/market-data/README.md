# Market Data Service v2.1

Microservicio de ingestión y distribución de datos de mercado para TRII Investment Platform.
Ahora con capacidades mejoradas de procesamiento en tiempo real y análisis avanzado.

## 🎯 Funcionalidades

- ✅ Cotizaciones en tiempo real con WebSockets
- ✅ Datos históricos (OHLCV) con mejor compresión
- ✅ Búsqueda de símbolos con autocompletado inteligente
- ✅ Cache con Redis y TTL optimizado
- ✅ Rate limiting adaptativo por usuario
- ✅ Health checks avanzados con métricas detalladas
- ✅ Métricas Prometheus con dashboards personalizados
- 🆕 Análisis de sentimiento de mercado
- 🆕 Detección de anomalías en precios
- 🆕 Soporte para criptomonedas

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# Desde el directorio raíz del proyecto
docker-compose up -d market-data

# Ver logs
docker-compose logs -f market-data
```

### Desarrollo Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/trii_dev"
export REDIS_URL="redis://localhost:6379/0"
export ALPHA_VANTAGE_API_KEY="your_api_key"

# Ejecutar servidor
uvicorn app.main:app --reload --port 8001
```

## 📡 Endpoints

### Health Check
```bash
curl http://localhost:8001/health
```

### Obtener Cotización
```bash
curl http://localhost:8001/api/v1/market-data/quotes/AAPL
```

**Respuesta:**
```json
{
  "id": 1,
  "symbol": "AAPL",
  "exchange": "US",
  "price": 150.25,
  "open_price": 149.50,
  "high": 151.00,
  "low": 149.00,
  "previous_close": 148.75,
  "change": 1.50,
  "change_percent": 1.01,
  "volume": 50000000,
  "timestamp": "2025-12-12T10:30:00Z",
  "created_at": "2025-12-12T10:30:05Z"
}
```

### Datos Históricos
```bash
curl "http://localhost:8001/api/v1/market-data/quotes/AAPL/historical?timeframe=daily&limit=100"
```

**Respuesta:**
```json
[
  {
    "symbol": "AAPL",
    "exchange": "US",
    "open": 149.50,
    "high": 151.00,
    "low": 149.00,
    "close": 150.25,
    "volume": 50000000,
    "timeframe": "1d",
    "date": "2025-12-12T00:00:00Z"
  }
]
```

### Buscar Símbolos
```bash
curl "http://localhost:8001/api/v1/market-data/search?query=apple"
```

## 📊 Métricas

Acceder a métricas Prometheus:
```bash
curl http://localhost:8001/metrics
```

## 🧪 Testing

```bash
# Ejecutar tests
pytest

# Con coverage
pytest --cov=app tests/

# Solo tests unitarios
pytest tests/unit/
```

## 🔧 Configuración

Variables de entorno en `.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/trii_dev

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_CACHE_TTL=300

# API Keys
ALPHA_VANTAGE_API_KEY=your_key_here

# Application
DEBUG=true
LOG_LEVEL=INFO
```

## 📝 Estructura

```
market-data/
├── app/
│   ├── api/              # Endpoints
│   │   └── quotes.py
│   ├── core/             # Config
│   │   └── config.py
│   ├── db/               # Database
│   │   ├── session.py
│   │   └── redis.py
│   ├── models/           # SQLAlchemy models
│   │   └── quote.py
│   ├── schemas/          # Pydantic schemas
│   │   └── quote.py
│   ├── services/         # Business logic
│   │   ├── alpha_vantage.py
│   │   └── cache_service.py
│   └── main.py           # FastAPI app
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── requirements.txt
└── README.md
```

## 🔌 Integración con Otros Servicios

Este servicio se comunica con:
- **PostgreSQL**: Almacenamiento de datos
- **Redis**: Cache de cotizaciones
- **Alpha Vantage API**: Fuente de datos externa

## 📈 Performance

- **Latencia**: < 100ms (con cache)
- **Throughput**: 100 req/min
- **Cache Hit Rate**: > 85%

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL
```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Ver logs
docker-compose logs postgres
```

### Error de API Key
```bash
# Verificar que la API key está configurada
echo $ALPHA_VANTAGE_API_KEY
```

### Redis no disponible
```bash
# Verificar Redis
docker-compose ps redis
```

## 📚 Documentación API

Acceder a Swagger UI:
```
http://localhost:8001/docs
```

ReDoc:
```
http://localhost:8001/redoc
```
