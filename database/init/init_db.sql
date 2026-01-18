-- TRII Investment Platform - Database Initialization Script
-- This script creates all necessary tables for the platform

-- Enable TimescaleDB extension (optional - will be skipped if not available)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB extension not available, continuing without it';
END $$;

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    open_price DOUBLE PRECISION,
    high DOUBLE PRECISION,
    low DOUBLE PRECISION,
    previous_close DOUBLE PRECISION,
    change DOUBLE PRECISION,
    change_percent DOUBLE PRECISION,
    volume BIGINT,
    avg_volume BIGINT,
    market_cap BIGINT,
    shares_outstanding BIGINT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_quotes_symbol ON quotes(symbol);
CREATE INDEX IF NOT EXISTS ix_quotes_symbol_timestamp ON quotes(symbol, timestamp);
CREATE INDEX IF NOT EXISTS ix_quotes_timestamp ON quotes(timestamp);

-- Create historical_prices table
CREATE TABLE IF NOT EXISTS historical_prices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume BIGINT NOT NULL,
    adjusted_close DOUBLE PRECISION,
    timeframe VARCHAR(10) NOT NULL DEFAULT '1d',
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_historical_symbol ON historical_prices(symbol);
CREATE INDEX IF NOT EXISTS ix_historical_date ON historical_prices(date);
CREATE INDEX IF NOT EXISTS ix_historical_symbol_date ON historical_prices(symbol, date);
CREATE INDEX IF NOT EXISTS ix_historical_symbol_timeframe_date ON historical_prices(symbol, timeframe, date);

-- Convert historical_prices to hypertable for time-series data (if TimescaleDB is available)
DO $$
BEGIN
    PERFORM create_hypertable('historical_prices', 'date', if_not_exists => TRUE);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB not available, historical_prices will be a regular table';
END $$;

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'USD',
    cash_balance DOUBLE PRECISION DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_portfolios_user_id ON portfolios(user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL')),
    quantity DOUBLE PRECISION NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    fees DOUBLE PRECISION DEFAULT 0,
    total DOUBLE PRECISION NOT NULL,
    cash_flow DOUBLE PRECISION DEFAULT 0,
    notes TEXT,
    transaction_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS ix_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS ix_transactions_date ON transactions(transaction_date);

-- Create positions table (current holdings)
CREATE TABLE IF NOT EXISTS positions (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    quantity DOUBLE PRECISION NOT NULL,
    avg_cost DOUBLE PRECISION NOT NULL,
    current_price DOUBLE PRECISION,
    market_value DOUBLE PRECISION,
    unrealized_pnl DOUBLE PRECISION,
    unrealized_pnl_percent DOUBLE PRECISION,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

CREATE INDEX IF NOT EXISTS ix_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX IF NOT EXISTS ix_positions_symbol ON positions(symbol);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS ix_watchlist_user_id ON watchlist(user_id);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('PRICE', 'TECHNICAL', 'ML_PREDICTION')),
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('ABOVE', 'BELOW', 'CROSSES')),
    target_value DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS ix_alerts_symbol ON alerts(symbol);
CREATE INDEX IF NOT EXISTS ix_alerts_active ON alerts(is_active) WHERE is_active = TRUE;

-- Create users table (basic)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS ix_audit_log_created_at ON audit_log(created_at);

-- Convert audit_log to hypertable (if TimescaleDB is available)
DO $$
BEGIN
    PERFORM create_hypertable('audit_log', 'created_at', if_not_exists => TRUE);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB not available, audit_log will be a regular table';
END $$;

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    symbol VARCHAR(20) NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('BUY', 'SELL', 'HOLD', 'WATCH')),
    confidence_score DOUBLE PRECISION CHECK (confidence_score >= 0 AND confidence_score <= 1),
    reasoning TEXT,
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    expected_return DOUBLE PRECISION,
    time_horizon VARCHAR(20),
    source VARCHAR(50) DEFAULT 'AI',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS ix_recommendations_symbol ON recommendations(symbol);
CREATE INDEX IF NOT EXISTS ix_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS ix_recommendations_active ON recommendations(is_active) WHERE is_active = TRUE;

-- Create migrations table
CREATE TABLE IF NOT EXISTS migrations (
    id BIGSERIAL PRIMARY KEY,
    version VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS ix_migrations_version ON migrations(version);

COMMENT ON TABLE quotes IS 'Real-time market quotes';
COMMENT ON TABLE historical_prices IS 'Historical OHLCV data (TimescaleDB hypertable)';
COMMENT ON TABLE portfolios IS 'User investment portfolios';
COMMENT ON TABLE transactions IS 'Buy/sell transactions';
COMMENT ON TABLE positions IS 'Current holdings in portfolios';
COMMENT ON TABLE watchlist IS 'User watchlist of symbols';
COMMENT ON TABLE alerts IS 'Price and signal alerts';
COMMENT ON TABLE users IS 'Platform users';
COMMENT ON TABLE audit_log IS 'Audit trail (TimescaleDB hypertable)';
COMMENT ON TABLE recommendations IS 'AI-driven investment recommendations';
COMMENT ON TABLE migrations IS 'Database migration tracking';
