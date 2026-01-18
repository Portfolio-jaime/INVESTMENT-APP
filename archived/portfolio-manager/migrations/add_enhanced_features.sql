-- Migration to add enhanced portfolio management features
-- Run this after the existing schema is set up

-- Broker Integration Tables
CREATE TABLE IF NOT EXISTS broker_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    broker_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'IDLE' CHECK (sync_status IN ('IDLE', 'SYNCING', 'SUCCESS', 'FAILED')),
    error_message TEXT,
    next_sync_scheduled TIMESTAMP WITH TIME ZONE,
    credentials TEXT, -- Encrypted JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broker_transactions (
    id SERIAL PRIMARY KEY,
    broker_transaction_id VARCHAR(255) NOT NULL,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    broker_account_id INTEGER NOT NULL REFERENCES broker_accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 4) NOT NULL,
    fees DECIMAL(20, 2) DEFAULT 0,
    total DECIMAL(20, 2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(broker_transaction_id, broker_account_id)
);

-- Rebalancing Tables
CREATE TABLE IF NOT EXISTS rebalancing_schedules (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
    threshold DECIMAL(5, 4) NOT NULL CHECK (threshold >= 0 AND threshold <= 1),
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id)
);

-- Performance and Analytics Tables (for caching computed metrics)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL, -- '1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'
    total_return DECIMAL(10, 4),
    annualized_return DECIMAL(10, 4),
    volatility DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 4),
    beta DECIMAL(10, 4),
    alpha DECIMAL(10, 4),
    sortino_ratio DECIMAL(10, 4),
    calmar_ratio DECIMAL(10, 4),
    information_ratio DECIMAL(10, 4),
    tracking_error DECIMAL(10, 4),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, period)
);

CREATE TABLE IF NOT EXISTS risk_metrics (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    value_at_risk_95 DECIMAL(10, 4),
    value_at_risk_99 DECIMAL(10, 4),
    expected_shortfall_95 DECIMAL(10, 4),
    expected_shortfall_99 DECIMAL(10, 4),
    beta DECIMAL(10, 4),
    correlation_matrix JSONB,
    stress_test_results JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diversification_analysis (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    sector_allocation JSONB,
    asset_class_allocation JSONB,
    geographic_allocation JSONB,
    concentration_risk JSONB,
    correlation_matrix JSONB,
    diversification_score DECIMAL(5, 2), -- 0-100
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_calculations (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    capital_gains_tax DECIMAL(20, 2) DEFAULT 0,
    iva_tax DECIMAL(20, 2) DEFAULT 0,
    trm_impact DECIMAL(20, 2) DEFAULT 0,
    total_tax_liability DECIMAL(20, 2) DEFAULT 0,
    effective_tax_rate DECIMAL(10, 4),
    tax_efficiency_score DECIMAL(5, 2), -- 0-100
    details JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, year)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_broker_accounts_portfolio_id ON broker_accounts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_broker_accounts_user_id ON broker_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_accounts_sync_status ON broker_accounts(sync_status);

CREATE INDEX IF NOT EXISTS idx_broker_transactions_portfolio_id ON broker_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_broker_transactions_broker_account_id ON broker_transactions(broker_account_id);
CREATE INDEX IF NOT EXISTS idx_broker_transactions_symbol ON broker_transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_broker_transactions_date ON broker_transactions(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_rebalancing_schedules_portfolio_id ON rebalancing_schedules(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_rebalancing_schedules_active ON rebalancing_schedules(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_portfolio_period ON performance_metrics(portfolio_id, period);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_calculated_at ON performance_metrics(calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_metrics_portfolio_id ON risk_metrics(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_calculated_at ON risk_metrics(calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_diversification_analysis_portfolio_id ON diversification_analysis(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_diversification_analysis_calculated_at ON diversification_analysis(calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tax_calculations_portfolio_year ON tax_calculations(portfolio_id, year);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_calculated_at ON tax_calculations(calculated_at DESC);

-- Update existing positions table to include more fields if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'current_price') THEN
        ALTER TABLE positions ADD COLUMN current_price DECIMAL(20, 4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'market_value') THEN
        ALTER TABLE positions ADD COLUMN market_value DECIMAL(20, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'unrealized_pnl') THEN
        ALTER TABLE positions ADD COLUMN unrealized_pnl DECIMAL(20, 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'unrealized_pnl_percent') THEN
        ALTER TABLE positions ADD COLUMN unrealized_pnl_percent DECIMAL(10, 4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'last_updated') THEN
        ALTER TABLE positions ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update portfolios table to include user_id if not present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'user_id') THEN
        ALTER TABLE portfolios ADD COLUMN user_id INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'currency') THEN
        ALTER TABLE portfolios ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'is_active') THEN
        ALTER TABLE portfolios ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolios' AND column_name = 'updated_at') THEN
        ALTER TABLE portfolios ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;