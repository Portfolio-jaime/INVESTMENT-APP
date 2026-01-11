# Esquema de Base de Datos - TRII Platform

## 🗄️ Visión General

La plataforma TRII utiliza una arquitectura de datos híbrida que combina **PostgreSQL** para datos transaccionales, **TimescaleDB** para series temporales, y **Redis** para caché de alta velocidad.

## 📊 Diagrama Completo del Esquema

```mermaid
erDiagram
    %% Core User Management
    USERS ||--o{ PORTFOLIOS : owns
    USERS ||--o{ USER_SESSIONS : has
    USERS ||--o{ USER_PREFERENCES : configures
    USERS ||--o{ NOTIFICATIONS : receives
    
    USERS {
        uuid id PK
        string email UK "Unique email address"
        string password_hash "Bcrypt hashed password"
        string first_name
        string last_name
        string phone
        date birth_date
        enum kyc_status "PENDING, VERIFIED, REJECTED"
        jsonb kyc_documents "Identity verification docs"
        enum risk_profile "CONSERVATIVE, MODERATE, AGGRESSIVE"
        decimal investment_experience_years
        decimal income_range_min
        decimal income_range_max
        string country_code "ISO 3166-1"
        string timezone
        boolean is_active
        boolean email_verified
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
    }

    USER_SESSIONS {
        uuid id PK
        uuid user_id FK
        string session_token UK
        string device_info
        string ip_address
        timestamp created_at
        timestamp expires_at
        boolean is_active
    }

    USER_PREFERENCES {
        uuid user_id PK
        jsonb notification_settings
        jsonb ui_preferences
        jsonb trading_preferences
        string preferred_language
        string preferred_currency
        decimal risk_tolerance
        timestamp updated_at
    }

    %% Portfolio Management
    PORTFOLIOS ||--o{ POSITIONS : contains
    PORTFOLIOS ||--o{ TRADES : executes
    PORTFOLIOS ||--o{ REBALANCE_EVENTS : triggers
    
    PORTFOLIOS {
        uuid id PK
        uuid user_id FK
        string name
        string description
        decimal total_value "Current portfolio value in USD"
        decimal cash_balance "Available cash"
        decimal invested_amount "Total invested"
        decimal unrealized_pnl "Unrealized P&L"
        decimal realized_pnl "Realized P&L"
        jsonb allocation_target "Target allocation percentages"
        jsonb allocation_current "Current allocation"
        boolean auto_rebalance_enabled
        decimal rebalance_threshold "Percentage threshold"
        enum status "ACTIVE, SUSPENDED, CLOSED"
        timestamp created_at
        timestamp updated_at
    }

    POSITIONS ||--|| INSTRUMENTS : references
    POSITIONS {
        uuid id PK
        uuid portfolio_id FK
        uuid instrument_id FK
        decimal quantity
        decimal avg_cost "Average cost basis"
        decimal current_price "Last known price"
        decimal current_value "Current position value"
        decimal unrealized_pnl "Unrealized P&L"
        decimal allocation_percentage "Current allocation %"
        timestamp opened_at
        timestamp last_updated
    }

    %% Instruments & Market Data
    INSTRUMENTS ||--o{ MARKET_DATA : has
    INSTRUMENTS ||--o{ TECHNICAL_INDICATORS : has
    INSTRUMENTS ||--o{ ML_PREDICTIONS : has
    INSTRUMENTS ||--o{ NEWS_SENTIMENT : analyzed
    
    INSTRUMENTS {
        uuid id PK
        string symbol UK "Trading symbol"
        string isin "International Securities ID"
        string name
        string description
        enum type "STOCK, ETF, BOND, CRYPTO, COMMODITY"
        string exchange_code
        string currency_code
        string sector
        string industry
        decimal market_cap
        decimal shares_outstanding
        jsonb fundamental_data "P/E, EPS, etc."
        boolean is_tradeable
        timestamp listed_date
        timestamp created_at
        timestamp updated_at
    }

    MARKET_DATA {
        uuid instrument_id FK
        timestamp timestamp PK
        decimal open "Opening price"
        decimal high "Highest price"
        decimal low "Lowest price"
        decimal close "Closing price"
        decimal volume "Trading volume"
        decimal vwap "Volume weighted average price"
        integer trade_count "Number of trades"
        timestamp created_at
    }

    TECHNICAL_INDICATORS {
        uuid id PK
        uuid instrument_id FK
        timestamp timestamp
        string indicator_type "RSI, MACD, BB, SMA, EMA"
        jsonb indicator_values
        jsonb parameters "Indicator parameters"
        timestamp calculated_at
    }

    %% ML & Predictions
    ML_PREDICTIONS {
        uuid id PK
        uuid instrument_id FK
        timestamp prediction_date
        timestamp target_date "Date being predicted"
        decimal predicted_price
        decimal confidence_score "0-1 confidence level"
        string model_name
        string model_version
        jsonb features_used "Feature vector"
        jsonb model_metadata
        decimal actual_price "Actual price (for evaluation)"
        decimal prediction_error
        timestamp created_at
    }

    ML_MODELS {
        uuid id PK
        string name
        string version
        enum model_type "REGRESSION, CLASSIFICATION, ENSEMBLE"
        jsonb hyperparameters
        jsonb performance_metrics "MAE, RMSE, accuracy, etc."
        string training_dataset_id
        timestamp trained_at
        boolean is_active
        boolean is_production
    }

    NEWS_SENTIMENT {
        uuid id PK
        uuid instrument_id FK
        string news_source
        string headline
        text content
        decimal sentiment_score "(-1 to 1)"
        decimal relevance_score "0-1"
        jsonb sentiment_breakdown "positive, negative, neutral"
        timestamp published_at
        timestamp analyzed_at
    }

    %% Trading & Orders
    TRADES {
        uuid id PK
        uuid portfolio_id FK
        uuid instrument_id FK
        string order_id UK "External order ID"
        enum trade_type "BUY, SELL"
        enum order_type "MARKET, LIMIT, STOP_LOSS"
        decimal quantity
        decimal price "Execution price"
        decimal total_amount "Total trade amount"
        decimal fees "Trading fees"
        decimal commission "Broker commission"
        enum status "PENDING, EXECUTED, CANCELLED, FAILED"
        string execution_venue "Exchange/broker"
        timestamp order_placed_at
        timestamp executed_at
        string cancel_reason
    }

    ORDER_BOOK {
        uuid instrument_id FK
        timestamp timestamp PK
        jsonb bids "Array of bid prices/quantities"
        jsonb asks "Array of ask prices/quantities"
        decimal best_bid
        decimal best_ask
        decimal spread
        timestamp updated_at
    }

    %% Analytics & Reporting
    PORTFOLIO_SNAPSHOTS {
        uuid id PK
        uuid portfolio_id FK
        date snapshot_date
        decimal total_value
        decimal cash_balance
        decimal invested_amount
        decimal daily_return
        decimal total_return
        decimal volatility
        decimal sharpe_ratio
        decimal max_drawdown
        jsonb allocation_breakdown
        jsonb performance_attribution
        timestamp created_at
    }

    REBALANCE_EVENTS {
        uuid id PK
        uuid portfolio_id FK
        enum trigger_type "AUTOMATIC, MANUAL, THRESHOLD"
        jsonb old_allocation
        jsonb new_allocation
        jsonb trades_executed
        decimal total_cost "Rebalancing cost"
        boolean completed_successfully
        timestamp started_at
        timestamp completed_at
    }

    %% Compliance & Audit
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string entity_type "USER, PORTFOLIO, TRADE, etc."
        uuid entity_id
        string action "CREATE, UPDATE, DELETE"
        jsonb old_values
        jsonb new_values
        string ip_address
        string user_agent
        timestamp created_at
    }

    COMPLIANCE_CHECKS {
        uuid id PK
        uuid user_id FK
        uuid portfolio_id FK
        string check_type "POSITION_LIMIT, SECTOR_LIMIT, RISK_LIMIT"
        enum status "PASS, FAIL, WARNING"
        jsonb check_details
        string violation_reason
        timestamp checked_at
    }

    %% Notifications & Communications
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        enum type "TRADE_EXECUTED, PORTFOLIO_ALERT, MARKET_NEWS"
        string title
        text message
        jsonb metadata
        enum priority "LOW, MEDIUM, HIGH, URGENT"
        boolean is_read
        timestamp created_at
        timestamp read_at
    }

    %% Relationships
    USERS ||--o{ AUDIT_LOGS : generates
    PORTFOLIOS ||--o{ PORTFOLIO_SNAPSHOTS : snapshots
    PORTFOLIOS ||--o{ COMPLIANCE_CHECKS : monitored
    INSTRUMENTS ||--o{ ORDER_BOOK : has
    ML_MODELS ||--o{ ML_PREDICTIONS : generates
```

## 🕒 Esquema de TimescaleDB

### Tablas de Series Temporales

```sql
-- Market Data Hypertable (particionado por tiempo)
CREATE TABLE market_data (
    instrument_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DECIMAL(20,8) NOT NULL,
    high DECIMAL(20,8) NOT NULL,
    low DECIMAL(20,8) NOT NULL,
    close DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) NOT NULL,
    vwap DECIMAL(20,8),
    trade_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convertir a hypertable con chunks de 1 día
SELECT create_hypertable('market_data', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Índices optimizados
CREATE INDEX idx_market_data_instrument_time ON market_data (instrument_id, timestamp DESC);
CREATE INDEX idx_market_data_symbol_time ON market_data (instrument_id, timestamp DESC) 
    WHERE timestamp > NOW() - INTERVAL '7 days';

-- Políticas de retención automática
SELECT add_retention_policy('market_data', INTERVAL '2 years');

-- Compresión automática para datos antiguos
ALTER TABLE market_data SET (
    timescaledb.compress,
    timescaledb.compress_orderby = 'timestamp DESC',
    timescaledb.compress_segmentby = 'instrument_id'
);

SELECT add_compression_policy('market_data', INTERVAL '7 days');
```

### Continuous Aggregates (Vistas Materializadas)

```sql
-- Agregados por hora
CREATE MATERIALIZED VIEW market_data_hourly
WITH (timescaledb.continuous) AS
SELECT 
    instrument_id,
    time_bucket('1 hour', timestamp) AS bucket,
    first(open, timestamp) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, timestamp) AS close,
    sum(volume) AS volume,
    avg(close) AS avg_price,
    count(*) AS data_points
FROM market_data
GROUP BY instrument_id, bucket;

-- Refresh automático cada 10 minutos
SELECT add_continuous_aggregate_policy('market_data_hourly',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '10 minutes',
    schedule_interval => INTERVAL '10 minutes');

-- Agregados diarios
CREATE MATERIALIZED VIEW market_data_daily
WITH (timescaledb.continuous) AS
SELECT 
    instrument_id,
    time_bucket('1 day', timestamp) AS bucket,
    first(open, timestamp) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, timestamp) AS close,
    sum(volume) AS volume,
    (last(close, timestamp) - first(open, timestamp)) / first(open, timestamp) * 100 AS daily_return_pct
FROM market_data
GROUP BY instrument_id, bucket;
```

## ⚡ Esquema de Redis

### Estructura de Cache

```redis
# Market Data Cache (TTL: 1 segundo)
market:quote:{symbol} → {
    "price": 150.25,
    "change": 2.15,
    "change_pct": 1.45,
    "volume": 1234567,
    "timestamp": 1641234567890
}

# User Sessions (TTL: 24 horas)
session:{token} → {
    "user_id": "uuid",
    "expires_at": 1641234567890,
    "permissions": ["read", "write", "trade"],
    "last_activity": 1641234567890
}

# Portfolio Cache (TTL: 30 segundos)
portfolio:{user_id}:{portfolio_id} → {
    "total_value": 125000.50,
    "daily_return": 850.25,
    "positions": [...],
    "last_updated": 1641234567890
}

# ML Predictions Cache (TTL: 1 hora)
ml:prediction:{symbol}:{model_version} → {
    "predicted_price": 155.75,
    "confidence": 0.87,
    "target_date": "2026-01-12",
    "features": {...}
}

# Real-time Streams
stream:market_data → Redis Streams para WebSocket broadcasting
stream:notifications:{user_id} → Notificaciones en tiempo real
stream:portfolio_updates → Actualizaciones de portafolio
```

## 🔍 Índices y Optimizaciones

### Índices Críticos

```sql
-- Búsquedas de usuarios
CREATE INDEX idx_users_email ON users (email) WHERE is_active = true;
CREATE INDEX idx_users_kyc_status ON users (kyc_status) WHERE kyc_status = 'PENDING';

-- Consultas de portfolio
CREATE INDEX idx_portfolios_user_id ON portfolios (user_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_positions_portfolio_instrument ON positions (portfolio_id, instrument_id);

-- Market data queries
CREATE INDEX idx_market_data_symbol_recent ON market_data (instrument_id, timestamp DESC) 
    WHERE timestamp > NOW() - INTERVAL '30 days';

-- Trading history
CREATE INDEX idx_trades_portfolio_date ON trades (portfolio_id, executed_at DESC);
CREATE INDEX idx_trades_status_date ON trades (status, executed_at) WHERE status = 'EXECUTED';

-- ML predictions
CREATE INDEX idx_ml_predictions_instrument_date ON ml_predictions (instrument_id, prediction_date DESC);
CREATE INDEX idx_ml_predictions_model ON ml_predictions (model_name, model_version) 
    WHERE prediction_date > NOW() - INTERVAL '7 days';
```

### Particionamiento

```sql
-- Particionamiento de audit_logs por mes
CREATE TABLE audit_logs_template (
    LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Crear particiones automáticamente
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    start_date := date_trunc('month', CURRENT_DATE);
    end_date := start_date + interval '1 month';
    partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs 
                    FOR VALUES FROM (%L) TO (%L)', 
                   partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Ejecutar mensualmente
SELECT cron.schedule('create-monthly-partition', '0 0 1 * *', 'SELECT create_monthly_partition()');
```

## 📊 Vistas y Funciones Útiles

### Vista de Portfolio Consolidado

```sql
CREATE VIEW v_portfolio_summary AS
SELECT 
    p.id,
    p.name,
    p.user_id,
    p.total_value,
    p.cash_balance,
    p.invested_amount,
    p.unrealized_pnl,
    COUNT(pos.id) as position_count,
    AVG(pos.allocation_percentage) as avg_allocation,
    MAX(pos.last_updated) as last_position_update,
    json_agg(
        json_build_object(
            'symbol', i.symbol,
            'quantity', pos.quantity,
            'current_value', pos.current_value,
            'pnl', pos.unrealized_pnl
        )
    ) as positions
FROM portfolios p
LEFT JOIN positions pos ON p.id = pos.portfolio_id
LEFT JOIN instruments i ON pos.instrument_id = i.id
WHERE p.status = 'ACTIVE'
GROUP BY p.id, p.name, p.user_id, p.total_value, p.cash_balance, p.invested_amount, p.unrealized_pnl;
```

### Función de Cálculo de Performance

```sql
CREATE OR REPLACE FUNCTION calculate_portfolio_performance(
    p_portfolio_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_return DECIMAL,
    annualized_return DECIMAL,
    volatility DECIMAL,
    sharpe_ratio DECIMAL,
    max_drawdown DECIMAL
) AS $$
DECLARE
    daily_returns DECIMAL[];
    avg_return DECIMAL;
    return_std DECIMAL;
    risk_free_rate DECIMAL := 0.03; -- 3% annual risk-free rate
BEGIN
    -- Obtener retornos diarios
    SELECT ARRAY_AGG(daily_return ORDER BY snapshot_date)
    INTO daily_returns
    FROM portfolio_snapshots 
    WHERE portfolio_id = p_portfolio_id 
    AND snapshot_date BETWEEN p_start_date AND p_end_date;
    
    -- Calcular métricas
    SELECT AVG(unnest), STDDEV(unnest)
    INTO avg_return, return_std
    FROM unnest(daily_returns);
    
    -- Retornar resultados
    RETURN QUERY
    SELECT 
        (SELECT daily_return FROM unnest(daily_returns) AS daily_return LIMIT 1) as total_return,
        avg_return * 252 as annualized_return, -- 252 trading days
        return_std * SQRT(252) as volatility,
        CASE 
            WHEN return_std > 0 THEN (avg_return * 252 - risk_free_rate) / (return_std * SQRT(252))
            ELSE 0 
        END as sharpe_ratio,
        -- Calcular max drawdown (simplificado)
        0.0 as max_drawdown;
END;
$$ LANGUAGE plpgsql;
```

## 🔒 Seguridad de Datos

### Row Level Security (RLS)

```sql
-- Habilitar RLS en tablas sensibles
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo pueden ver sus propios datos
CREATE POLICY user_portfolios ON portfolios
    FOR ALL TO authenticated_user
    USING (user_id = current_setting('app.user_id')::UUID);

-- Política: admin puede ver todo
CREATE POLICY admin_all_portfolios ON portfolios
    FOR ALL TO admin_role
    USING (true);
```

### Encriptación de Datos Sensibles

```sql
-- Función para encriptar PII
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para encriptar automáticamente
CREATE TRIGGER encrypt_user_pii
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_sensitive_data();
```

## 📈 Métricas y Monitoring

### Queries de Monitoreo

```sql
-- Database size and growth
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_inserted(c.oid) as inserts,
    pg_stat_get_tuples_updated(c.oid) as updates,
    pg_stat_get_tuples_deleted(c.oid) as deletes
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections by user
SELECT 
    usename,
    application_name,
    client_addr,
    state,
    COUNT(*) as connection_count
FROM pg_stat_activity 
WHERE state = 'active'
GROUP BY usename, application_name, client_addr, state;

-- Slow queries
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

**Última actualización**: Enero 2026  
**Versión del Schema**: 2.1.0