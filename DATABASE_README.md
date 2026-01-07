# TRII Platform Database Schema

This directory contains the complete database schema and setup scripts for the TRII investment platform.

## Overview

The TRII platform uses a hybrid database architecture:

- **PostgreSQL**: Relational data (users, portfolios, transactions, broker integrations)
- **TimescaleDB**: Time-series market data and technical indicators
- **MongoDB**: Flexible recommendation data and unstructured market information

## Files

### Schema Documentation
- [`plans/database-schema.md`](plans/database-schema.md) - Complete schema documentation with ER diagrams, relationships, and indexing strategies

### PostgreSQL Schema
- [`init-new.sql`](init-new.sql) - Complete PostgreSQL schema initialization script
- Includes all tables, indexes, views, and initial data for Colombian market requirements

### MongoDB Schema
- [`mongodb-schema.js`](mongodb-schema.js) - MongoDB collections, validators, and indexes
- Includes schema validation, indexing, and sample data creation functions

### Setup Scripts
- [`setup-databases.sh`](setup-databases.sh) - Automated database setup script for both PostgreSQL and MongoDB

## Quick Start

### Prerequisites

1. **PostgreSQL 15+** with TimescaleDB extension
2. **MongoDB 5.0+**
3. Database client tools (`psql`, `mongosh` or `mongo`)

### Environment Setup

Set environment variables for database connections:

```bash
# PostgreSQL
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=trii_platform
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=trii_password

# MongoDB
export MONGODB_HOST=localhost
export MONGODB_PORT=27017
export MONGODB_DB=trii_platform
export MONGODB_USER=trii_user
export MONGODB_PASSWORD=trii_password
```

### Automated Setup

Run the setup script to initialize both databases:

```bash
# Setup both databases
./setup-databases.sh

# Setup only PostgreSQL
./setup-databases.sh --postgres-only

# Setup only MongoDB
./setup-databases.sh --mongodb-only

# Verify existing setup
./setup-databases.sh --verify-only
```

### Manual Setup

#### PostgreSQL Setup

1. Create the database:
```sql
CREATE DATABASE trii_platform;
```

2. Run the schema:
```bash
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -f init-new.sql
```

#### MongoDB Setup

1. Connect to MongoDB and run the schema:
```bash
mongosh --host $MONGODB_HOST --port $MONGODB_PORT --username $MONGODB_USER --password $MONGODB_PASSWORD $MONGODB_DB < mongodb-schema.js
```

## Schema Highlights

### Colombian Market Support

- **COP Currency**: Primary currency with TRM (exchange rate) tracking
- **IVA Calculations**: 19% IVA with tax breakdown in transactions
- **BVC Integration**: Support for Bolsa de Valores de Colombia symbols
- **Tax Rules**: Configurable tax rules for Colombian regulations
- **Economic Indicators**: TRM, IPC, PIB, interest rates tracking

### Multi-Broker Integration

- Encrypted API credentials storage
- Support for TRII, BVC, Interactive Brokers, and other brokers
- Broker-specific configurations and sync status tracking

### AI-Driven Recommendations

- Flexible recommendation schema with confidence scores
- Hybrid LLM reasoning (technical, fundamental, sentiment)
- Colombian market context and TRM impact analysis
- Automatic expiration with TTL indexes

### Time-Series Optimization

- TimescaleDB hypertables for market data
- Automatic partitioning and compression
- Retention policies for data lifecycle management

## Key Tables/Collections

### PostgreSQL Tables

| Schema | Table | Purpose |
|--------|-------|---------|
| auth | users | User profiles with Colombian ID |
| broker_integration | broker_connections | Multi-broker API configurations |
| portfolio | portfolios | User investment portfolios |
| portfolio | holdings | Current positions |
| portfolio | transactions | Trade history with tax details |
| market_data | market_data_colombian | OHLCV data (TimescaleDB) |
| market_data | technical_indicators | Technical analysis (TimescaleDB) |
| analysis | economic_indicators | Colombian economic data |
| analysis | tax_rules | Tax calculation rules |

### MongoDB Collections

| Collection | Purpose |
|------------|---------|
| recommendations | AI-driven investment recommendations |
| market_news | Financial news with sentiment analysis |
| sentiment_analysis | Market sentiment by symbol |
| user_preferences | User settings and preferences |
| audit_log | Security audit trail |
| notification_queue | Notification delivery system |

## Performance Features

### Indexing Strategy

- **PostgreSQL**: Composite indexes for common queries, partial indexes for active records
- **TimescaleDB**: Time-based partitioning with symbol-specific indexes
- **MongoDB**: Compound indexes for user-specific queries, TTL indexes for cleanup

### Data Retention

- Market data: 5 years for daily, 30 days for real-time quotes
- Recommendations: 30 days with automatic expiration
- Audit logs: 7 years for compliance

### Compression

- TimescaleDB automatic compression for historical data
- Configurable compression policies by data age

## Colombian Market Specifics

### Currency Handling

- COP as primary currency
- TRM tracking in economic_indicators table
- Multi-currency portfolio support (COP, USD, EUR)

### Tax Calculations

- IVA: 19% on applicable transactions
- Retención en la fuente: Variable rates by income type
- GMF: 0.4% on financial transactions
- Tax details stored in transaction records

### BVC Integration

- COLCAP index tracking
- Colombian stock symbols (e.g., ECOPETROL.CL)
- Local market data sources and APIs

## Migration Notes

### From Current Schema

The new schema expands the existing basic schema with:

1. **User Management**: Added Colombian ID, tax fields, and authentication
2. **Multi-Broker Support**: Encrypted API storage and connection management
3. **Tax Calculations**: IVA, retenciones, and tax rule engine
4. **Economic Data**: TRM, IPC, interest rates for Colombian market context
5. **AI Features**: Flexible recommendation storage with MongoDB
6. **Time-Series**: TimescaleDB for efficient market data storage

### Data Migration

Existing data can be migrated using standard PostgreSQL tools. MongoDB collections are new and don't require migration.

## Monitoring and Maintenance

### Backup Strategy

- PostgreSQL: Daily backups with WAL archiving
- TimescaleDB: Continuous backup with compression
- MongoDB: Replica set backups with oplog

### Health Checks

Use the setup script's `--verify-only` option to check database health:

```bash
./setup-databases.sh --verify-only
```

## Development

### Schema Updates

When updating the schema:

1. Update the SQL/JS files
2. Create migration scripts for existing databases
3. Update documentation in `plans/database-schema.md`
4. Test with the setup script

### Testing

The setup script includes sample data creation for testing. Run:

```javascript
// In MongoDB
db.load('mongodb-schema.js');
createSampleData();
```

## Support

For questions about the database schema or setup, refer to:

- [`plans/database-schema.md`](plans/database-schema.md) - Detailed schema documentation
- [`plans/new-trii-architecture.md`](plans/new-trii-architecture.md) - System architecture overview

## License

This schema is part of the TRII investment platform and follows the project's licensing terms.