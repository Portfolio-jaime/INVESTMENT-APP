# TRII Investment Platform - Quick Start Guide

## Prerequisites

### Required Software
- **Node.js**: 18.x or 20.x ([Download](https://nodejs.org/))
- **Python**: 3.11 or 3.12 ([Download](https://www.python.org/))
- **Docker**: 24.x+ ([Download](https://www.docker.com/))
- **Docker Compose**: 2.20+ (included with Docker Desktop)
- **Git**: 2.40+ ([Download](https://git-scm.com/))
- **PNPM**: 8.x+ (install: `npm install -g pnpm`)

### Optional but Recommended
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Python
  - Docker
  - GitLens
- **PostgreSQL Client**: pgAdmin, DBeaver, or psql CLI
- **API Client**: Postman, Insomnia, or Thunder Client (VS Code)

### System Requirements
- **RAM**: 8 GB minimum, 16 GB recommended
- **Disk Space**: 10 GB free (for Docker images and data)
- **OS**: macOS 11+, Windows 10+, or Linux (Ubuntu 20.04+)

---

## Installation

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/investment-app.git
cd investment-app
```

### Step 2: Run Setup Script

**macOS/Linux**:
```bash
chmod +x scripts/setup/setup-dev.sh
./scripts/setup/setup-dev.sh
```

**Windows (PowerShell)**:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup\setup-dev.ps1
```

**Manual Setup** (if scripts fail):
```bash
# Install PNPM globally
npm install -g pnpm

# Install frontend dependencies
pnpm install

# Install Python dependencies for each service
cd services/market-data && pip install -r requirements.txt && cd ../..
cd services/analysis-engine && pip install -r requirements.txt && cd ../..
cd services/ml-prediction && pip install -r requirements.txt && cd ../..
cd services/risk-assessment && pip install -r requirements.txt && cd ../..

# Install Node.js service dependencies
cd services/portfolio-manager && npm install && cd ../..
cd services/notification && npm install && cd ../..

# Copy environment files
cp config/environments/.env.example .env
```

### Step 3: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, RabbitMQ, MinIO
docker-compose up -d postgres redis rabbitmq minio

# Wait for services to be ready (30-60 seconds)
docker-compose ps

# Initialize databases
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE trii_dev;"
docker-compose exec postgres psql -U postgres -d trii_dev -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"

# Run database migrations
cd services/market-data && alembic upgrade head && cd ../..
cd services/portfolio-manager && npm run migration:run && cd ../..
```

### Step 4: Start Backend Services

**Terminal 1 - Market Data Service**:
```bash
cd services/market-data
uvicorn app.main:app --reload --port 8001
```

**Terminal 2 - Analysis Engine**:
```bash
cd services/analysis-engine
uvicorn app.main:app --reload --port 8002
```

**Terminal 3 - ML Prediction Service**:
```bash
cd services/ml-prediction
uvicorn app.main:app --reload --port 8003
```

**Terminal 4 - Portfolio Manager**:
```bash
cd services/portfolio-manager
npm run start:dev
```

**Terminal 5 - Risk Assessment**:
```bash
cd services/risk-assessment
uvicorn app.main:app --reload --port 8005
```

**Terminal 6 - Notification Service**:
```bash
cd services/notification
npm run start:dev
```

**All-in-One (Using Docker Compose)**:
```bash
docker-compose up -d
docker-compose logs -f
```

### Step 5: Start Frontend Application

```bash
cd apps/desktop-client
pnpm dev
```

The desktop application will launch automatically.

---

## Verification

### Check Services Health

```bash
# Market Data Service
curl http://localhost:8001/health

# Analysis Engine
curl http://localhost:8002/health

# ML Service
curl http://localhost:8003/health

# Portfolio Manager
curl http://localhost:8004/health

# Risk Assessment
curl http://localhost:8005/health

# Notification Service
curl http://localhost:8006/health

# All services (using script)
./scripts/health-check.sh
```

Expected response:
```json
{
  "status": "healthy",
  "service": "market-data",
  "version": "1.0.0",
  "timestamp": "2025-12-11T10:30:00Z"
}
```

### Access Web Interfaces

- **Frontend Application**: Electron window (auto-launch)
- **API Documentation**:
  - Market Data: http://localhost:8001/docs
  - Analysis Engine: http://localhost:8002/docs
  - ML Service: http://localhost:8003/docs
  - Portfolio Manager: http://localhost:8004/api
- **Infrastructure**:
  - RabbitMQ Management: http://localhost:15672 (guest/guest)
  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
  - PostgreSQL: localhost:5432 (postgres/postgres)
  - Redis: localhost:6379

### Test API Endpoints

```bash
# Get market quote
curl -X POST http://localhost:8001/api/v1/market/quote \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'

# Run technical analysis
curl -X POST http://localhost:8002/api/v1/analysis/technical \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "indicators": ["RSI", "MACD", "BB"],
    "period": "1d"
  }'

# Get price prediction
curl -X POST http://localhost:8003/api/v1/ml/predict/price \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "horizon": 5
  }'
```

---

## Development Workflow

### Project Structure Navigation

```bash
investment-app/
├── apps/desktop-client/        # Frontend Electron app
├── services/                   # Backend microservices
│   ├── market-data/           # Market data API
│   ├── analysis-engine/       # Technical analysis
│   ├── ml-prediction/         # ML models
│   ├── portfolio-manager/     # Portfolio CRUD
│   ├── risk-assessment/       # Risk calculations
│   └── notification/          # Alerts & notifications
├── libs/                      # Shared libraries
├── infrastructure/            # Docker, Terraform, monitoring
├── scripts/                   # Automation scripts
├── docs/                      # Documentation
└── tests/                     # Integration & E2E tests
```

### Common Commands

```bash
# Frontend Development
cd apps/desktop-client
pnpm dev                       # Start dev server
pnpm test                      # Run tests
pnpm test:watch                # Watch mode
pnpm build                     # Build for production
pnpm package                   # Create distributable

# Backend Development (Python)
cd services/market-data
uvicorn app.main:app --reload  # Start with hot-reload
pytest                         # Run tests
pytest --cov                   # With coverage
black .                        # Format code
mypy .                         # Type checking

# Backend Development (Node.js)
cd services/portfolio-manager
npm run start:dev              # Start with hot-reload
npm test                       # Run tests
npm run test:watch             # Watch mode
npm run lint                   # Lint code
npm run format                 # Format with Prettier

# Database Operations
docker-compose exec postgres psql -U postgres -d trii_dev
npm run migration:create       # Create new migration
npm run migration:run          # Run migrations
alembic upgrade head           # Python migrations
alembic downgrade -1           # Rollback one migration

# Docker Operations
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f [service]  # View logs
docker-compose restart [service]  # Restart service
docker-compose ps              # List running services
docker-compose exec [service] sh  # Shell into container

# Code Quality
pnpm lint                      # Lint all code
pnpm format                    # Format all code
pnpm test                      # Run all tests
pnpm type-check                # TypeScript checking

# Infrastructure
cd infrastructure/docker
docker-compose -f docker-compose.yml up -d
cd ../monitoring
docker-compose up -d           # Start Prometheus + Grafana
```

### Git Workflow

```bash
# Feature development
git checkout -b feature/portfolio-rebalancing
# ... make changes ...
git add .
git commit -m "Add portfolio rebalancing logic"
git push origin feature/portfolio-rebalancing
# Create PR on GitHub

# Hotfix
git checkout -b hotfix/fix-quote-parsing
# ... fix bug ...
git commit -m "Fix quote parsing for split-adjusted prices"
git push origin hotfix/fix-quote-parsing
```

### Testing

```bash
# Unit Tests
pnpm test                      # Frontend
pytest                         # Backend (Python)
npm test                       # Backend (Node.js)

# Integration Tests
cd tests/integration
pytest test_market_data_api.py
pytest test_portfolio_service.py

# E2E Tests
cd tests/e2e
npx playwright test
npx playwright test --ui       # UI mode
npx playwright test --debug    # Debug mode

# Performance Tests
cd tests/performance/k6
k6 run load-test.js
k6 run stress-test.js

# Security Tests
trivy image trii/market-data:latest
snyk test
npm audit
```

---

## Configuration

### Environment Variables

**File**: `.env`

```bash
# Application
NODE_ENV=development
APP_NAME=TRII Platform
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trii_dev
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_MAX_CONNECTIONS=50

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=trii_events

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=trii-data

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# API Keys (Market Data Providers)
ALPHA_VANTAGE_API_KEY=your-key-here
TWELVE_DATA_API_KEY=your-key-here
FINNHUB_API_KEY=your-key-here

# Email (Notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Feature Flags
ENABLE_ML_PREDICTIONS=true
ENABLE_REAL_TIME_DATA=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

### API Rate Limits

Default rate limits (can be configured in API Gateway):
- **Authenticated users**: 1000 requests/hour
- **Anonymous users**: 100 requests/hour
- **WebSocket connections**: 5 concurrent per user

### Data Retention Policies

- **Real-time quotes**: 24 hours (Redis)
- **Historical OHLCV**: Unlimited (TimescaleDB)
- **User sessions**: 7 days (Redis)
- **Logs**: 30 days (Loki)
- **Metrics**: 90 days (Prometheus)
- **Database backups**: 30 days

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot connect to database"
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Verify connection
docker-compose exec postgres psql -U postgres -c "SELECT 1;"
```

#### Issue: "Port already in use"
```bash
# Find process using port
lsof -i :8001                  # macOS/Linux
netstat -ano | findstr :8001   # Windows

# Kill process
kill -9 <PID>                  # macOS/Linux
taskkill /PID <PID> /F         # Windows

# Or change port in .env file
PORT=8011
```

#### Issue: "Module not found"
```bash
# Frontend
cd apps/desktop-client
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Backend
cd services/market-data
rm -rf venv
python -m venv venv
source venv/bin/activate       # macOS/Linux
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

#### Issue: "Docker container won't start"
```bash
# View container logs
docker-compose logs [service-name]

# Rebuild container
docker-compose build [service-name]

# Remove and recreate
docker-compose down
docker-compose up -d --force-recreate

# Clean everything (WARNING: deletes data)
docker-compose down -v
docker system prune -a
```

#### Issue: "Frontend build fails"
```bash
# Clear cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules .next .vite
pnpm install

# Try with legacy OpenSSL (Node 18+)
export NODE_OPTIONS=--openssl-legacy-provider
pnpm build
```

#### Issue: "Tests failing"
```bash
# Update snapshots
pnpm test -- -u

# Run specific test
pnpm test -- --testPathPattern=portfolio

# Debug test
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Performance Issues

#### Slow API responses
```bash
# Check database performance
docker-compose exec postgres psql -U postgres -d trii_dev
EXPLAIN ANALYZE SELECT * FROM quotes WHERE symbol = 'AAPL';

# Check Redis connection
docker-compose exec redis redis-cli PING

# Monitor resource usage
docker stats

# Check logs for errors
docker-compose logs -f --tail=100
```

#### High memory usage
```bash
# Check container resources
docker stats

# Adjust Docker Desktop settings (Preferences > Resources)
# Recommended: 8 GB RAM, 4 CPUs

# Limit container memory
# In docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 2G
```

### Getting Help

1. **Check Logs**: `docker-compose logs -f [service]`
2. **Health Checks**: `./scripts/health-check.sh`
3. **Documentation**: See `/docs` folder
4. **GitHub Issues**: Report bugs with logs and steps to reproduce
5. **Community**: Join Discord/Slack (link in README)

---

## Next Steps

### After Successful Setup

1. **Explore the Application**:
   - Create a test portfolio
   - Add some stocks
   - Run technical analysis
   - View ML predictions

2. **Read Documentation**:
   - Architecture: `ARCHITECTURE.md`
   - API Documentation: http://localhost:8001/docs
   - Development Guide: `docs/development/getting-started.md`

3. **Configure API Keys**:
   - Get free Alpha Vantage key: https://www.alphavantage.co/support/#api-key
   - Get Twelve Data key: https://twelvedata.com/apikey
   - Update `.env` file

4. **Setup Monitoring**:
   ```bash
   cd infrastructure/monitoring
   docker-compose up -d
   # Access Grafana: http://localhost:3001 (admin/admin)
   ```

5. **Run Full Test Suite**:
   ```bash
   pnpm test
   pytest tests/
   npx playwright test
   ```

6. **Build Production Version**:
   ```bash
   # Frontend
   cd apps/desktop-client
   pnpm package

   # Backend (Docker)
   docker-compose -f docker-compose.prod.yml build
   ```

---

## Development Guidelines

### Code Style

- **TypeScript/JavaScript**: ESLint + Prettier
- **Python**: Black + Pylint + MyPy
- **Commits**: Conventional Commits (feat, fix, docs, etc.)
- **Branches**: `feature/*`, `hotfix/*`, `release/*`

### Before Committing

```bash
# Run pre-commit checks
pnpm lint
pnpm format
pnpm test
pytest
mypy .
```

### Pull Request Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No linting errors
- [ ] All tests pass
- [ ] Changelog updated
- [ ] Screenshots (if UI changes)

---

## Resources

### Documentation
- [Architecture Overview](ARCHITECTURE.md)
- [Technology Stack Justification](TECH_STACK_JUSTIFICATION.md)
- [DevOps Implementation](DEVOPS_IMPLEMENTATION.md)
- [API Documentation](docs/api/)

### External Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [TensorFlow Documentation](https://www.tensorflow.org/guide)

### Community
- GitHub: https://github.com/your-org/investment-app
- Discord: [Link]
- Email: support@trii-platform.com

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

**Last Updated**: 2025-12-11
**Version**: 1.0.0
**Maintainer**: TRII Platform Team
