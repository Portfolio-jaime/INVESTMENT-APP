# Arquitectura del Sistema TRII Platform

## 🏗️ Visión General

TRII Platform está diseñada siguiendo principios de **arquitectura de microservicios**, **domain-driven design** y **event-driven architecture** para garantizar escalabilidad, mantenibilidad y alta disponibilidad.

## 🎯 Principios Arquitectónicos

### 1. **Separation of Concerns**
- Cada microservicio tiene una responsabilidad específica
- Boundaries claros entre dominios de negocio
- APIs bien definidas entre servicios

### 2. **Event-Driven Architecture**
- Comunicación asíncrona via RabbitMQ
- Event sourcing para auditabilidad
- CQRS para separar lecturas y escrituras

### 3. **Cloud-Native**
- Containerización con Docker
- Orquestación con Kubernetes  
- Observabilidad integrada
- Auto-scaling horizontal

## 🏛️ Diagrama de Arquitectura de Alto Nivel

```mermaid
graph TB
    subgraph "🌐 External"
        USER[👥 Users]
        MARKET[📈 Market APIs]
        NEWS[📰 News APIs]
    end

    subgraph "🛡️ Edge Layer"
        CDN[🌍 CloudFlare CDN]
        WAF[🔒 WAF]
        LB[⚖️ Load Balancer]
    end

    subgraph "🚪 API Gateway"
        KONG[🦍 Kong Gateway]
        AUTH[🔐 Auth Service]
        RATE[🚦 Rate Limiting]
    end

    subgraph "🎯 Frontend Layer"
        WEB[💻 React Web App]
        MOBILE[📱 React Native]
        DESKTOP[🖥️ Electron App]
    end

    subgraph "⚙️ Core Services"
        MARKET_SVC[📊 Market Data Service]
        ANALYSIS_SVC[🔍 Analysis Engine]
        ML_SVC[🤖 ML Prediction Service]
        PORTFOLIO_SVC[💼 Portfolio Manager]
        NOTIFICATION_SVC[📢 Notification Service]
        USER_SVC[👤 User Service]
    end

    subgraph "💾 Data Layer"
        PG[(🗄️ PostgreSQL)]
        TS[(📈 TimescaleDB)]
        REDIS[(⚡ Redis)]
        S3[(☁️ Object Storage)]
    end

    subgraph "📡 Message Layer"
        RABBIT[🐰 RabbitMQ]
        KAFKA[📨 Apache Kafka]
    end

    subgraph "📊 Observability"
        PROM[📈 Prometheus]
        GRAF[📊 Grafana]
        JAEGER[🔍 Jaeger]
        LOGS[📝 Loki]
    end

    USER --> CDN
    CDN --> WAF
    WAF --> LB
    LB --> KONG
    KONG --> AUTH
    KONG --> WEB
    KONG --> MOBILE
    KONG --> DESKTOP

    WEB --> MARKET_SVC
    WEB --> ANALYSIS_SVC
    WEB --> ML_SVC
    WEB --> PORTFOLIO_SVC

    MARKET_SVC --> PG
    MARKET_SVC --> TS
    MARKET_SVC --> REDIS
    MARKET_SVC --> RABBIT

    ANALYSIS_SVC --> REDIS
    ANALYSIS_SVC --> RABBIT
    
    ML_SVC --> PG
    ML_SVC --> S3
    ML_SVC --> KAFKA

    PORTFOLIO_SVC --> PG
    PORTFOLIO_SVC --> RABBIT

    MARKET --> MARKET_SVC
    NEWS --> ANALYSIS_SVC

    PROM --> GRAF
    JAEGER --> GRAF
    LOGS --> GRAF
```

## 🔧 Arquitectura de Microservicios

### 📊 Market Data Service
**Responsabilidades:**
- Ingesta de datos de mercado en tiempo real
- Normalización de datos de múltiples fuentes
- Cache distribuido de cotizaciones
- WebSocket streams para clientes

**Tecnologías:**
- FastAPI + AsyncIO para alta concurrencia
- TimescaleDB para series temporales
- Redis para cache L1
- WebSockets para streaming

```mermaid
sequenceDiagram
    participant Client
    participant MarketData
    participant Cache
    participant TimescaleDB
    participant ExternalAPI

    Client->>MarketData: GET /quotes/AAPL
    MarketData->>Cache: Check cache
    alt Cache Hit
        Cache-->>MarketData: Return cached data
    else Cache Miss
        MarketData->>TimescaleDB: Query latest data
        TimescaleDB-->>MarketData: Return data
        MarketData->>Cache: Update cache
    end
    MarketData-->>Client: Return quote
    
    par Background Process
        MarketData->>ExternalAPI: Fetch latest data
        ExternalAPI-->>MarketData: Market data
        MarketData->>TimescaleDB: Insert data
        MarketData->>Cache: Update cache
    end
```

### 🔍 Analysis Engine
**Responsabilidades:**
- Análisis técnico avanzado (RSI, MACD, Bollinger Bands)
- Procesamiento de sentiment de noticias
- Cálculo de indicadores personalizados
- Backtesting de estrategias

**Patrón de Arquitectura:** **Pipeline Pattern**

```mermaid
graph LR
    subgraph "📥 Data Ingestion"
        A[Market Data] --> B[Data Validator]
        C[News Data] --> B
    end
    
    subgraph "🔄 Processing Pipeline"
        B --> D[Technical Indicators]
        B --> E[Sentiment Analysis]
        D --> F[Signal Generator]
        E --> F
    end
    
    subgraph "📤 Output"
        F --> G[Analysis Results]
        F --> H[Event Publisher]
    end

    style D fill:#e1f5fe
    style E fill:#f3e5f5
    style F fill:#e8f5e8
```

### 🤖 ML Prediction Service
**Responsabilidades:**
- Entrenamiento de modelos predictivos
- Inferencia en tiempo real
- A/B testing de modelos
- Feature engineering

**Arquitectura ML:**

```mermaid
graph TD
    subgraph "📊 Data Pipeline"
        RAW[Raw Data] --> CLEAN[Data Cleaning]
        CLEAN --> FEAT[Feature Engineering]
        FEAT --> SPLIT[Train/Val/Test Split]
    end

    subgraph "🧠 Model Training"
        SPLIT --> TRAIN[Model Training]
        TRAIN --> VAL[Validation]
        VAL --> TUNE[Hyperparameter Tuning]
        TUNE --> SELECT[Model Selection]
    end

    subgraph "🚀 Deployment"
        SELECT --> STAGE[Staging Environment]
        STAGE --> AB[A/B Testing]
        AB --> PROD[Production Deployment]
    end

    subgraph "📈 Monitoring"
        PROD --> DRIFT[Drift Detection]
        DRIFT --> RETRAIN[Retrain Trigger]
        RETRAIN --> TRAIN
    end

    style TRAIN fill:#bbdefb
    style PROD fill:#c8e6c9
    style DRIFT fill:#ffcdd2
```

### 💼 Portfolio Manager
**Responsabilidades:**
- Optimización de portafolios
- Gestión de riesgo
- Rebalanceo automático
- Reporting de performance

**Patrón:** **Strategy Pattern** para algoritmos de optimización

## 🗄️ Arquitectura de Datos

### Modelo de Datos Principal

```mermaid
erDiagram
    USERS ||--o{ PORTFOLIOS : owns
    USERS {
        uuid id PK
        string email UK
        string password_hash
        jsonb preferences
        timestamp created_at
        timestamp updated_at
        enum status
    }

    PORTFOLIOS ||--o{ POSITIONS : contains
    PORTFOLIOS {
        uuid id PK
        uuid user_id FK
        string name
        decimal total_value
        decimal cash_balance
        jsonb allocation_target
        timestamp created_at
    }

    POSITIONS ||--|| INSTRUMENTS : references
    POSITIONS {
        uuid id PK
        uuid portfolio_id FK
        uuid instrument_id FK
        decimal quantity
        decimal avg_cost
        decimal current_value
        timestamp opened_at
    }

    INSTRUMENTS {
        uuid id PK
        string symbol UK
        string name
        enum type
        string exchange
        jsonb metadata
    }

    MARKET_DATA {
        uuid instrument_id FK
        timestamp timestamp PK
        decimal price
        decimal volume
        decimal high
        decimal low
        decimal open
    }

    PREDICTIONS {
        uuid id PK
        uuid instrument_id FK
        timestamp forecast_date
        decimal predicted_price
        decimal confidence
        string model_version
        jsonb features
    }

    TRADES {
        uuid id PK
        uuid portfolio_id FK
        uuid instrument_id FK
        enum type
        decimal quantity
        decimal price
        decimal fees
        timestamp executed_at
    }

    INSTRUMENTS ||--o{ MARKET_DATA : has
    INSTRUMENTS ||--o{ PREDICTIONS : has
    PORTFOLIOS ||--o{ TRADES : executes
```

### 📊 Particionamiento de TimescaleDB

```sql
-- Particionamiento por tiempo para market_data
CREATE TABLE market_data (
    instrument_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8),
    high DECIMAL(20,8),
    low DECIMAL(20,8),
    open DECIMAL(20,8)
);

-- Convertir a hypertable con particionamiento por tiempo
SELECT create_hypertable('market_data', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Crear índices optimizados
CREATE INDEX idx_market_data_instrument_time ON market_data (instrument_id, timestamp DESC);
CREATE INDEX idx_market_data_timestamp ON market_data (timestamp DESC);
```

## 🚦 Patrones de Comunicación

### 1. **Synchronous Communication** (REST APIs)
```yaml
Pattern: Request-Response
Use Case: Client-facing APIs, real-time queries
Technology: HTTP/REST with OpenAPI specs
Timeout: 30 seconds max
```

### 2. **Asynchronous Communication** (Events)
```yaml
Pattern: Publish-Subscribe
Use Case: Inter-service communication, data updates
Technology: RabbitMQ with topic exchanges
Delivery: At-least-once with idempotency
```

### 3. **Streaming Communication** (Real-time)
```yaml
Pattern: WebSocket/Server-Sent Events
Use Case: Live market data, notifications
Technology: WebSockets with Redis pub/sub
Scaling: Horizontal with sticky sessions
```

## 🔐 Seguridad por Capas

```mermaid
graph TD
    subgraph "🛡️ Security Layers"
        L1[🌐 Network Security]
        L2[🚪 Authentication]
        L3[🔑 Authorization]
        L4[🔒 Data Encryption]
        L5[📝 Audit & Monitoring]
    end

    L1 --> |TLS 1.3, WAF| L2
    L2 --> |OAuth 2.0, MFA| L3
    L3 --> |RBAC, ABAC| L4
    L4 --> |AES-256, PKI| L5
    L5 --> |SOC, SIEM| COMPLIANCE[📋 Compliance]

    style L1 fill:#ffebee
    style L2 fill:#e8f5e8
    style L3 fill:#e3f2fd
    style L4 fill:#fce4ec
    style L5 fill:#fff3e0
```

## 📈 Estrategia de Escalabilidad

### Horizontal Scaling
- **Stateless services**: Todos los microservicios son stateless
- **Load balancing**: NGINX + Kong Gateway
- **Auto-scaling**: HPA basado en CPU/memoria/custom metrics
- **Database sharding**: Particionamiento por user_id

### Vertical Scaling
- **Resource optimization**: Profiling continuo de servicios
- **Caching layers**: L1 (Redis), L2 (CDN), L3 (Application)
- **Connection pooling**: PgBouncer para PostgreSQL
- **Query optimization**: Índices optimizados, query analysis

## 🔄 DevOps y CI/CD

```mermaid
gitGraph:
    options:
        showBranch: true
        showCommitLabel: true
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature A"
    commit id: "Feature B"
    checkout main
    merge develop id: "Release v1.1"
    branch hotfix
    checkout hotfix
    commit id: "Critical Fix"
    checkout main
    merge hotfix id: "Hotfix v1.1.1"
```

### Pipeline Stages
1. **🔍 Code Quality**: ESLint, Prettier, SonarQube
2. **🧪 Testing**: Unit, Integration, E2E tests
3. **🔒 Security**: SAST, DAST, dependency scanning
4. **📦 Build**: Docker images, Helm charts
5. **🚀 Deploy**: Staging → Production via ArgoCD
6. **📊 Monitor**: Synthetic tests, alerts

## 🎯 SLAs y Métricas

### Service Level Objectives (SLOs)
- **Availability**: 99.9% uptime (8.77 hours downtime/year)
- **Latency**: p95 < 200ms para APIs críticas
- **Throughput**: 10,000 requests/second sostenidas
- **Data Freshness**: Market data < 100ms delay

### Key Performance Indicators (KPIs)
- **MTTR** (Mean Time To Recovery): < 15 minutes
- **MTTD** (Mean Time To Detection): < 2 minutes
- **Error Rate**: < 0.1% para operaciones críticas
- **Customer Satisfaction**: NPS > 70

---

**Última actualización**: Enero 2026  
**Versión**: 2.1.0