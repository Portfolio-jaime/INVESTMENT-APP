#!/bin/bash

# TRII Investment Platform - Database Migration Script

set -e

echo "🗄️  Running database migrations..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done

echo "✅ PostgreSQL is ready"

# Run migration script
echo "📝 Creating tables..."
docker-compose exec -T postgres psql -U postgres -d trii_dev -f /docker-entrypoint-initdb.d/init_db.sql

echo "✅ Database migrations completed successfully!"
echo ""
echo "📊 Database structure:"
docker-compose exec -T postgres psql -U postgres -d trii_dev -c "\dt"
