-- TRII Investment Platform Database Initialization
-- This script creates the initial database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas for different domains
CREATE SCHEMA IF NOT EXISTS market_data;
CREATE SCHEMA IF NOT EXISTS portfolio;
CREATE SCHEMA IF NOT EXISTS analysis;
CREATE SCHEMA IF NOT EXISTS predictions;

-- Market Data Schema
CREATE TABLE IF NOT EXISTS market_data.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(15, 4) NOT NULL,
    volume BIGINT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, timestamp, source)
);

CREATE TABLE IF NOT EXISTS market_data.historical_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    open DECIMAL(15, 4) NOT NULL,
    high DECIMAL(15, 4) NOT NULL,
    low DECIMAL(15, 4) NOT NULL,
    close DECIMAL(15, 4) NOT NULL,
    volume BIGINT,
    adjusted_close DECIMAL(15, 4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, date)
);

-- Portfolio Schema
CREATE TABLE IF NOT EXISTS portfolio.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio.positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(15, 8) NOT NULL,
    average_price DECIMAL(15, 4) NOT NULL,
    current_price DECIMAL(15, 4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

CREATE TABLE IF NOT EXISTS portfolio.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity DECIMAL(15, 8) NOT NULL,
    price DECIMAL(15, 4) NOT NULL,
    fee DECIMAL(15, 4) DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis Schema
CREATE TABLE IF NOT EXISTS analysis.technical_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    indicator_type VARCHAR(50) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    value DECIMAL(15, 6) NOT NULL,
    parameters JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions Schema
CREATE TABLE IF NOT EXISTS predictions.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'HOLD', 'SELL', 'AVOID')),
    confidence DECIMAL(5, 4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    target_price DECIMAL(15, 4),
    stop_loss DECIMAL(15, 4),
    reasoning JSONB NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE TABLE IF NOT EXISTS predictions.model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    accuracy DECIMAL(5, 4),
    precision_score DECIMAL(5, 4),
    recall DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    training_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_symbol_timestamp ON market_data.quotes(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_historical_symbol_date ON market_data.historical_prices(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id ON portfolio.positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_symbol ON portfolio.transactions(portfolio_id, symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON portfolio.transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_technical_indicators_symbol ON analysis.technical_indicators(symbol, indicator_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_symbol ON predictions.recommendations(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_action ON predictions.recommendations(action, confidence DESC);

-- Insert initial data
INSERT INTO portfolio.portfolios (id, name, description) 
VALUES (uuid_generate_v4(), 'Default Portfolio', 'Your main investment portfolio')
ON CONFLICT DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW portfolio.portfolio_summary AS
SELECT 
    p.id,
    p.name,
    COUNT(pos.id) as positions_count,
    COALESCE(SUM(pos.quantity * pos.current_price), 0) as total_value,
    COALESCE(SUM(pos.quantity * (pos.current_price - pos.average_price)), 0) as total_pnl,
    p.created_at,
    p.updated_at
FROM portfolio.portfolios p
LEFT JOIN portfolio.positions pos ON p.id = pos.portfolio_id
GROUP BY p.id, p.name, p.created_at, p.updated_at;

CREATE OR REPLACE VIEW predictions.active_recommendations AS
SELECT 
    symbol,
    action,
    confidence,
    target_price,
    stop_loss,
    reasoning,
    model_version,
    created_at,
    expires_at
FROM predictions.recommendations
WHERE expires_at > NOW()
ORDER BY confidence DESC, created_at DESC;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA market_data TO trii_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA portfolio TO trii_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analysis TO trii_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA predictions TO trii_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA market_data TO trii_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA portfolio TO trii_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA analysis TO trii_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA predictions TO trii_user;
