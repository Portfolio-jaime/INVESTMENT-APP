# 🏗️ Arquitectura General - TRII Investment Platform

**Visión completa del sistema y decisiones técnicas**

---

## 📋 Tabla de Contenidos

1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Arquitectura por Capas](#arquitectura-por-capas)
3. [Patrón Arquitectónico](#patrón-arquitectónico)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Componentes Core](#componentes-core)
6. [Flujo de Datos](#flujo-de-datos)
7. [Seguridad](#seguridad)
8. [Escalabilidad](#escalabilidad)

---

## 🎯 Visión General del Sistema

TRII Investment Platform es una **arquitectura de microservicios event-driven** optimizada para procesamiento de datos financieros en tiempo real, análisis escalable y predicciones con machine learning.

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                      Desktop Application                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Electron + React + TypeScript + TradingView Charts      │   │
│  │  - Real-time Dashboard                                    │   │
│  │  - Portfolio Management                                   │   │
│  │  - Technical Analysis Tools                               │   │
│  │  - ML Predictions Visualization                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │ WebSocket/REST
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Kong/Traefik API Gateway                                 │   │
│  │  - Authentication/Authorization (JWT + OAuth2)            │   │
│  │  - Rate Limiting                                          │   │
│  │  - Request Routing                                        │   │
│  │  - SSL/TLS Termination                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Market     │    │  Analysis    │    │  Portfolio   │
│   Data       │    │  Engine      │    │  Manager     │
│   Service    │    │  Service     │    │  Service     │
│              │    │              │    │              │
│  FastAPI/    │    │  FastAPI/    │    │  NestJS/     │
│  Python      │    │  Python      │    │  Node.js     │
└──────────────┘    └──────────────┘    └──────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   ML/AI      │    │  Risk        │    │  Notification│
│   Prediction │    │  Assessment  │    │  Service     │
│   Service    │    │  Service     │    │              │
│              │    │              │    │              │
│  Python/     │    │  Python/     │    │  Node.js/    │
│  TensorFlow  │    │  Quantlib    │    │  Go          │
└──────────────┘    └──────────────┘    └──────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Message Bus Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  RabbitMQ/Kafka - Event Streaming                         │   │
│  │  - Market Data Events                                     │   │
│  │  - Analysis Triggers                                      │   │
│  │  - Alert Events                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │  TimescaleDB │    │  Redis       │
│  (Primary)   │    │  (Time Series│    │  (Cache +    │
│              │    │   Data)      │    │   Sessions)  │
│  - Users     │    │  - OHLCV     │    │              │
│  - Portfolio │    │  - Indicators│    │  - Hot Data  │
│  - Settings  │    │  - Signals   │    │  - Real-time │
└──────────────┘    └──────────────┘    └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   External Integrations                          │
│  - Alpha Vantage, Yahoo Finance, Twelve Data (Market Data)      │
│  - News APIs (Sentiment Analysis)                               │
│  - Economic Indicators (FRED, World Bank)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Arquitectura por Capas

### 1. Capa de Presentación (Desktop Application)

**Tecnologías**: Electron + React + TypeScript

**Responsabilidades**:
- Interfaz de usuario rica y responsiva
- Visualización de datos en tiempo real
- Gestión del estado de la aplicación
- Comunicación con APIs backend

**Características**:
- **Electron**: Aplicación nativa multiplataforma
- **React 18**: Componentes modernos con hooks
- **TradingView Charts**: Gráficos profesionales
- **WebSocket**: Actualizaciones en tiempo real

### 2. Capa de API Gateway

**Tecnologías**: Kong/Traefik

**Responsabilidades**:
- Enrutamiento de requests
- Autenticación y autorización
- Rate limiting
- Load balancing
- SSL/TLS termination

### 3. Capa de Microservicios

**Patrón**: Domain-Driven Design (DDD)

**Servicios Core**:
- **Market Data Service**: Ingestión y distribución de datos
- **Analysis Engine**: Cálculos técnicos y señales
- **Portfolio Manager**: Gestión de inversiones
- **ML Prediction Service**: Modelos de IA
- **Risk Assessment**: Análisis de riesgo
- **Notification Service**: Alertas y notificaciones

### 4. Capa de Datos

**Bases de Datos**:
- **PostgreSQL**: Datos relacionales y transaccionales
- **TimescaleDB**: Series temporales (OHLCV, indicadores)
- **Redis**: Cache de alto rendimiento
- **MinIO**: Almacenamiento de objetos (modelos ML)

### 5. Capa de Mensajería

**Tecnologías**: RabbitMQ/Kafka

**Patrones**:
- **Event Sourcing**: Historial completo de eventos
- **CQRS**: Separación de comandos y queries
- **Saga Pattern**: Transacciones distribuidas

---

## 🎨 Patrón Arquitectónico

### Event-Driven Microservices con CQRS

**Por qué este patrón**:

1. **Escalabilidad**: Servicios independientes escalan según demanda
2. **Resiliencia**: Fallos en un servicio no afectan otros
3. **Mantenibilidad**: Código organizado por dominio
4. **Flexibilidad**: Nuevos servicios se integran fácilmente
5. **Performance**: Procesamiento asíncrono para operaciones pesadas

### Domain-Driven Design (DDD)

**Bounded Contexts**:
- **Market Data**: Captura y distribución de datos financieros
- **Technical Analysis**: Cálculos de indicadores y señales
- **Portfolio Management**: Gestión de posiciones e inversiones
- **Risk Management**: Evaluación y mitigación de riesgos
- **ML Operations**: Entrenamiento y predicción de modelos

---

## 🛠️ Stack Tecnológico

### Frontend (Desktop Application)

| Tecnología | Versión | Propósito | Justificación |
|------------|---------|-----------|---------------|
| **Electron** | 25+ | Desktop app framework | Multiplataforma nativo |
| **React** | 18+ | UI framework | Componentes reutilizables |
| **TypeScript** | 5.0+ | Type safety | Prevención de errores |
| **TradingView** | Latest | Charts library | Estándar de la industria |
| **Redux Toolkit** | Latest | State management | Predictable state |
| **Socket.io** | Latest | Real-time comms | WebSocket client |

**Justificación**: Electron proporciona experiencia nativa con tecnologías web. TradingView es el estándar para visualización financiera.

### Backend Services

#### Core API Services (Python/FastAPI)

| Servicio | Tecnología | Propósito |
|----------|------------|-----------|
| Market Data | FastAPI/Python 3.11+ | APIs de datos de mercado |
| Analysis Engine | FastAPI/Python 3.11+ | APIs de análisis técnico |
| ML Prediction | FastAPI/Python 3.11+ | APIs de predicción |

**Justificación**: Python domina computación financiera (pandas, numpy, scikit-learn, TensorFlow). FastAPI proporciona performance async excelente.

#### Supporting Services (Node.js/NestJS)

| Servicio | Tecnología | Propósito |
|----------|------------|-----------|
| Portfolio Manager | NestJS/Node.js | APIs CRUD empresariales |
| Notification | NestJS/Node.js | APIs de notificaciones |

**Justificación**: Excelente para operaciones CRUD, WebSocket handling y patrones empresariales.

### Data Layer

#### Primary Database
**PostgreSQL 15+**
- Usuarios, autenticación
- Portafolios, transacciones
- Configuraciones de aplicación
- Watchlists, configuración de alertas

**Justificación**: ACID compliance crítico para transacciones financieras. Excelente soporte JSON, ecosistema robusto.

#### Time-Series Database
**TimescaleDB (PostgreSQL extension)**
- Datos OHLCV (Open, High, Low, Close, Volume)
- Historial de indicadores técnicos
- Logs de predicciones ML
- Métricas de performance

**Justificación**: Diseñado específicamente para datos de series temporales financieras. Integración perfecta con PostgreSQL.

#### Caching & Session Store
**Redis 7+**
- Cache de datos de mercado en tiempo real
- Gestión de sesiones de usuario
- Rate limiting
- Pub/Sub para actualizaciones en tiempo real

**Justificación**: Latencia sub-milisegundo. Excelente pub/sub para streaming en tiempo real.

#### Object Storage
**MinIO (S3-compatible)**
- Artefactos de modelos ML
- Archivos históricos de datos
- Resultados de backtests
- Reportes y exports

**Justificación**: Alternativa S3 auto-hospedada. Rentable para grandes datasets.

### Message Queue
**RabbitMQ or Apache Kafka**
- Arquitectura event-driven
- Procesamiento asincrónico de tareas
- Desacoplamiento de servicios
- Audit trail

**Recomendación**: RabbitMQ para simplicidad, Kafka para streaming de alto throughput.

### ML/AI Stack
- **TensorFlow/Keras**: Modelos de deep learning (LSTM, Transformers)
- **Scikit-learn**: Algoritmos clásicos de ML
- **XGBoost/LightGBM**: Gradient boosting para predicciones
- **Prophet**: Forecasting de series temporales
- **TA-Lib**: Indicadores técnicos
- **Pandas/NumPy**: Manipulación de datos
- **Polars**: DataFrames de alto rendimiento

### API Gateway
**Traefik or Kong**
- Enrutamiento de requests
- Autenticación/Autorización
- Rate limiting
- SSL/TLS termination
- Load balancing

### Monitoring & Observability
- **Prometheus**: Recolección de métricas
- **Grafana**: Dashboards de visualización
- **Loki**: Agregación de logs
- **Jaeger**: Tracing distribuido
- **Sentry**: Tracking de errores

### DevOps & Infrastructure
- **Docker**: Contenedorización
- **Docker Compose**: Desarrollo local
- **GitHub Actions**: CI/CD
- **Terraform**: Infrastructure as Code
- **Nginx**: Reverse proxy
- **Certbot**: Certificados SSL

---

## 🔧 Componentes Core

### Market Data Service

**Responsabilidades**:
- Ingestión de datos de mercado en tiempo real
- Gestión de datos históricos
- Normalización y validación de datos
- Streaming WebSocket a clientes

**Tecnologías**: FastAPI, WebSockets, Redis Pub/Sub, TimescaleDB

**APIs**:
```python
GET  /api/v1/market/quote/{symbol}      # Última cotización
GET  /api/v1/market/history/{symbol}    # Historial OHLCV
WS   /ws/market/stream                  # Stream en tiempo real
POST /api/v1/market/batch-quotes        # Solicitudes masivas
```

### Analysis Engine Service

**Responsabilidades**:
- Análisis técnico (RSI, MACD, Bandas de Bollinger, etc.)
- Cálculos de análisis fundamental
- Reconocimiento de patrones (patrones chart, candlestick)
- Generación de señales

**Tecnologías**: FastAPI, TA-Lib, Pandas, NumPy, Celery

**APIs**:
```python
POST /api/v1/analysis/technical         # Ejecutar análisis técnico
POST /api/v1/analysis/backtest          # Backtest de estrategia
GET  /api/v1/analysis/signals/{symbol}  # Obtener señales de trading
```

### ML/AI Prediction Service

**Responsabilidades**:
- Modelos de predicción de precios (LSTM, Transformers)
- Predicción de tendencias
- Forecasting de volatilidad
- Análisis de sentimiento en noticias
- Pipeline de entrenamiento y re-entrenamiento de modelos
- Feature engineering

**Tecnologías**: TensorFlow, Scikit-learn, MLflow, FastAPI

**APIs**:
```python
POST /api/v1/ml/predict/price           # Predicción de precio
POST /api/v1/ml/predict/trend           # Predicción de tendencia
GET  /api/v1/ml/model/performance       # Métricas del modelo
POST /api/v1/ml/sentiment              # Análisis de sentimiento
```

### Portfolio Manager Service

**Responsabilidades**:
- Operaciones CRUD de portafolios
- Tracking de holdings
- Cálculos de performance
- Historial de transacciones
- Recomendaciones de rebalanceo

**Tecnologías**: NestJS, TypeORM, PostgreSQL

**APIs**:
```typescript
POST   /api/v1/portfolio                # Crear portafolio
GET    /api/v1/portfolio/{id}           # Detalles del portafolio
POST   /api/v1/portfolio/{id}/transaction # Agregar transacción
GET    /api/v1/portfolio/{id}/performance # Métricas de performance
```

---

## 🔄 Flujo de Datos

### Flujo de Datos en Tiempo Real

```
1. EXCHANGE API ──► Market Data Service ──► Redis Cache
       │                       │
       │                       ▼
       │              TimescaleDB (Historical)
       │                       │
       ▼                       ▼
2. ANALYSIS ENGINE ◄────────────┘
       │
       ▼
3. SIGNAL GENERATION ──► RabbitMQ ──► NOTIFICATION SERVICE
       │
       ▼
4. TRADING DECISIONS ──► PORTFOLIO MANAGER ──► PostgreSQL
```

### Flujo de ML Training

```
HISTORICAL DATA ──► FEATURE ENGINEERING ──► MODEL TRAINING
       ▲                       │                       │
       │                       ▼                       ▼
       └─────────► VALIDATION DATA ◄─────────► MODEL EVALUATION
                                                       │
                                                       ▼
                                             MODEL DEPLOYMENT ──► PREDICTION API
```

---

## 🔒 Seguridad

### Autenticación y Autorización
- **JWT tokens** con expiración corta (15 min access, 7 días refresh)
- **OAuth2** flow para integraciones third-party
- **Multi-factor authentication** (TOTP)
- **Role-Based Access Control (RBAC)**

### Protección de Datos
- **Encryption at rest**: AES-256 para PostgreSQL, Redis
- **Encryption in transit**: TLS 1.3 para todas las comunicaciones
- **API key management**: Vault/AWS Secrets Manager
- **PII data handling**: Cumplimiento GDPR

### Seguridad de Aplicación
- **Input validation**: Modelos Pydantic, schemas Zod
- **Rate limiting**: Por usuario, por endpoint
- **SQL injection prevention**: Uso de ORM, queries parametrizadas
- **XSS protection**: Content Security Policy
- **CORS**: Validación estricta de origen
- **Dependency scanning**: Snyk, Dependabot

### Cumplimiento de Datos Financieros
- **Audit logging**: Todas las transacciones financieras
- **Data retention policies**: Períodos de retención configurables
- **Backup strategy**: Backups encriptados diarios
- **Disaster recovery**: RPO < 1 hora, RTO < 4 horas

### Seguridad de Infraestructura
- **Network segmentation**: Subnets privadas para databases
- **Firewall rules**: Exposición mínima
- **Container security**: Imágenes distroless, scanning de vulnerabilidades
- **Secrets management**: Sin credenciales hardcodeadas

---

## 📈 Escalabilidad

### Escalado Horizontal
- **Stateless services**: Todos los microservicios sin estado
- **Load balancing**: Round-robin + least connections
- **Auto-scaling**: Triggers basados en CPU/Memory
- **Database sharding**: Por user ID o symbol (futuro)

### Escalado Vertical
- **Resource allocation**: Límites CPU/Memory por servicio
- **Database optimization**: Tuning de performance de queries
- **Cache sizing**: Optimización de memoria Redis
- **Query optimization**: Índices, planeación de queries

### Gestión de Datos
- **Data archival**: Mover datos antiguos a cold storage (>2 años)
- **Data compression**: Compresión TimescaleDB
- **Query optimization**: Índices, planeación de queries

### Requisitos de Infraestructura

#### Ambiente de Desarrollo
```yaml
Servicios:
  - PostgreSQL (con TimescaleDB): 2 GB RAM
  - Redis: 512 MB RAM
  - RabbitMQ: 1 GB RAM
  - Servicios API (4 contenedores): 4 GB RAM
  - Servidor Dev Frontend: 1 GB RAM
  - MinIO: 512 MB RAM
Total: ~10 GB RAM, 4 CPU cores
```

#### Ambiente de Producción (Single Node)
```yaml
Servicios:
  - PostgreSQL (con TimescaleDB): 8 GB RAM
  - Redis: 2 GB RAM
  - RabbitMQ: 2 GB RAM
  - Servicios API (escalados): 8 GB RAM
  - Stack de Monitoreo: 2 GB RAM
  - MinIO: 2 GB RAM
  - API Gateway: 1 GB RAM
Total: ~25 GB RAM, 8 CPU cores, 500 GB SSD
```

#### Despliegue en Cloud (AWS/Azure/GCP)
- **Compute**: Instancias VM/Container (ej: AWS ECS, GKE)
- **Database**: PostgreSQL managed (RDS, Cloud SQL)
- **Cache**: Redis managed (ElastiCache, Cloud Memorystore)
- **Storage**: Object storage (S3, Blob Storage, GCS)
- **Load Balancer**: ALB/NLB, Cloud Load Balancing
- **Monitoring**: CloudWatch, Stackdriver

---

## 📊 Monitoreo y Observabilidad

### Métricas Clave

**Métricas de Aplicación**:
- Tasa de requests, latencia (p50, p95, p99)
- Tasa de error (4xx, 5xx)
- Disponibilidad de servicios
- Conexiones WebSocket activas

**Métricas de Negocio**:
- Usuarios activos
- Portafolios creados
- Predicciones generadas
- Alertas disparadas

**Métricas de Infraestructura**:
- Uso de CPU, memoria, disco
- Conexiones de base de datos
- Hit rate de cache
- Profundidad de cola de mensajes

### Reglas de Alerting
- Latencia API > 2 segundos
- Tasa de error > 1%
- Downtime de servicio > 1 minuto
- Agotamiento de pool de conexiones DB
- Cache miss rate > 30%
- Uso de disco > 80%

### Estrategia de Logging
- **Logging estructurado**: Formato JSON
- **Niveles de log**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Correlation IDs**: Tracing de requests
- **Retención de logs**: 30 días (hot), 1 año (cold)

---

## 🚀 Mejoras Futuras

### Fase 2: Características Avanzadas
- App móvil complementaria (React Native)
- Características de trading social
- Modo paper trading
- Estrategias avanzadas de opciones
- Soporte para criptomonedas

### Mejoras Técnicas
- Orquestación Kubernetes
- Service mesh (Istio)
- Federación GraphQL
- Características colaborativas en tiempo real
- Modelos ML avanzados (Transformers)

---

## 📋 Referencias Rápidas

### Puertos de Desarrollo
- Frontend: 3000
- API Gateway: 8080
- Market Data Service: 8001
- Analysis Engine: 8002
- ML Service: 8003
- Portfolio Manager: 8004
- Risk Assessment: 8005
- Notification Service: 8006
- PostgreSQL: 5432
- Redis: 6379
- RabbitMQ: 5672, 15672 (management)
- MinIO: 9000, 9001 (console)
- Prometheus: 9090
- Grafana: 3001

### Comandos Clave
```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f [service-name]

# Ejecutar tests
pnpm test
pytest tests/

# Construir imágenes de producción
docker-compose -f docker-compose.prod.yml build

# Desplegar
./scripts/deploy.sh [environment]

# Migraciones de DB
npm run migration:run
alembic upgrade head

# Backup de DB
./scripts/backup-database.sh
```

---

**Versión de Arquitectura**: 1.0
**Última Actualización**: Diciembre 2025
**Equipo Responsable**: Arquitectura TRII Platform