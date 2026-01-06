"""TimescaleDB setup and utilities."""

from sqlalchemy import text
from app.db.session import engine
import structlog

logger = structlog.get_logger()


async def setup_timescale():
    """Set up TimescaleDB hypertables and extensions."""
    try:
        async with engine.begin() as conn:
            # Enable TimescaleDB extension
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))

            # Create hypertable for historical prices
            # This converts the regular table to a hypertable partitioned by date
            await conn.execute(text("""
                SELECT create_hypertable('historical_prices', 'date', if_not_exists => TRUE);
            """))

            # Create additional indexes for better performance
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_historical_prices_symbol_date_desc
                ON historical_prices (symbol, date DESC);
            """))

            # Create retention policy (optional - keep data for 5 years)
            await conn.execute(text("""
                SELECT add_retention_policy('historical_prices', INTERVAL '5 years', if_not_exists => TRUE);
            """))

            logger.info("TimescaleDB setup completed successfully")

    except Exception as e:
        logger.error("Failed to setup TimescaleDB", error=str(e))
        # Don't raise - allow the app to start even if TimescaleDB setup fails
        # (e.g., if using regular PostgreSQL)


async def create_continuous_aggregates():
    """Create continuous aggregates for efficient time-series queries."""
    try:
        async with engine.begin() as conn:
            # Example: Create hourly aggregates
            await conn.execute(text("""
                CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_prices
                WITH (timescaledb.continuous) AS
                SELECT
                    symbol,
                    time_bucket('1 hour', date) AS bucket,
                    first(open, date) AS open,
                    max(high) AS high,
                    min(low) AS low,
                    last(close, date) AS close,
                    sum(volume) AS volume
                FROM historical_prices
                GROUP BY symbol, bucket
                WITH NO DATA;
            """))

            # Enable automatic refresh
            await conn.execute(text("""
                SELECT add_continuous_aggregate_policy('hourly_prices',
                    start_offset => INTERVAL '3 hours',
                    end_offset => INTERVAL '1 hour',
                    schedule_interval => INTERVAL '1 hour',
                    if_not_exists => TRUE);
            """))

            logger.info("Continuous aggregates created successfully")

    except Exception as e:
        logger.error("Failed to create continuous aggregates", error=str(e))


async def get_hypertable_info():
    """Get information about hypertables."""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT hypertable_name, num_chunks, compression_enabled
                FROM timescaledb_information.hypertables
                WHERE hypertable_name = 'historical_prices';
            """))
            info = result.fetchone()
            if info:
                logger.info("Hypertable info", **dict(info))
            return info
    except Exception as e:
        logger.error("Failed to get hypertable info", error=str(e))
        return None