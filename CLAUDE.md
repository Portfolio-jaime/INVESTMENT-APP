# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TRII Investment Decision Support Platform** - A comprehensive desktop application for detecting optimal investment opportunities using real-time data analysis, technical indicators, and machine learning predictions.

**Architecture**: Microservices-based platform with Electron frontend, Python/Node.js backends, deployed via Docker Compose (migrating to Kubernetes).

## Development Commands

### Package Management
Uses `pnpm` with workspaces for monorepo management.

```bash
# Install dependencies
pnpm install

# Development (starts desktop client)
pnpm dev

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Lint code across all packages
pnpm lint

# Format code
pnpm format

# Type check all TypeScript
pnpm type-check

# Clean all build artifacts
pnpm clean
```

### Desktop Client (Electron)
Located in `apps/desktop-client/`

```bash
# Start desktop client (from root)
pnpm dev

# Or from desktop-client directory
cd apps/desktop-client
npm start              # Start with hot-reload
npm run build          # Build for production
npm run package        # Package as distributable
```

### Backend Services

#### Market Data Service (FastAPI/Python)
```bash
cd services/market-data

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest
pytest tests/test_specific.py  # Single test file

# Code quality
black app/                     # Format code
mypy app/                      # Type checking
pylint app/                    # Linting

# Run locally (port 8001)
uvicorn app.main:app --reload --port 8001
```

#### Portfolio Manager (NestJS/Node.js)
```bash
cd services/portfolio-manager

# Install dependencies
npm install

# Development (port 8003)
npm run dev

# Build and start
npm run build
npm start

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

#### ML Prediction Service (FastAPI/Python)
```bash
cd services/ml-prediction

# Install dependencies
pip install -r requirements.txt

# Run locally (port 8004)
uvicorn app.main:app --reload --port 8004

# Run tests
pytest
```

#### Analysis Engine (FastAPI/Python)
```bash
cd services/analysis-engine

# Run locally (port 8002)
uvicorn app.main:app --reload --port 8002
```

### Infrastructure

#### Docker Compose (Current)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose build [service-name]
docker-compose up -d [service-name]
```

#### Kubernetes (In Migration)
Uses Kind (Kubernetes in Docker) + ArgoCD for GitOps.

```bash
# Setup local Kind cluster
./scripts/setup-argocd-access.sh

# Switch contexts
./scripts/k8s-context-selector.sh

# Connect to PostgreSQL
./scripts/connect-postgres-now.sh
./scripts/postgres-ingress-connection.sh

# Database operations
./scripts/database/run_migrations.sh
./scripts/populate-test-data.sh

# Debug applications
./scripts/debug-app.sh
./scripts/diagnose-postgres.sh
```

## Architecture Overview

### Monorepo Structure
```
investment-app/
├── apps/                    # Frontend applications
│   └── desktop-client/      # Electron + React + TypeScript
├── services/                # Backend microservices
│   ├── market-data/         # FastAPI - Real-time market data (port 8001)
│   ├── analysis-engine/     # FastAPI - Technical analysis (port 8002)
│   ├── portfolio-manager/   # NestJS - Portfolio management (port 8003)
│   ├── ml-prediction/       # FastAPI - ML predictions (port 8004)
│   ├── notification/        # Notification service
│   └── risk-assessment/     # Risk assessment service
├── libs/                    # Shared libraries
│   ├── api-client/          # API client utilities
│   ├── common/              # Common TypeScript utilities
│   └── python-common/       # Common Python utilities
├── infrastructure/          # Infrastructure as Code
│   ├── docker/              # Docker Compose configs
│   ├── kubernetes/          # K8s manifests (base, overlays, ArgoCD)
│   ├── monitoring/          # Prometheus, Grafana, Loki
│   ├── nginx/               # Nginx configurations
│   └── terraform/           # Terraform IaC
└── scripts/                 # Automation scripts
```

### Service Dependencies & Ports

**Infrastructure Services:**
- PostgreSQL (TimescaleDB): 5433 → 5432 (time-series data)
- Redis: 6379 (caching)
- RabbitMQ: 5672 (messaging), 15672 (management UI)
- MinIO: 9000 (S3-compatible storage), 9001 (console)

**Application Services:**
- market-data: 8001 (depends on: postgres, redis)
- analysis-engine: 8002 (depends on: market-data)
- portfolio-manager: 8003 (depends on: postgres, market-data)
- ml-prediction: 8004 (depends on: market-data, analysis-engine)

**Service Communication:**
- Services communicate via HTTP (REST APIs)
- Environment variables define service URLs (e.g., `MARKET_DATA_SERVICE_URL`)
- All services expose `/health` endpoints for health checks

### Technology Stack

**Frontend:**
- Electron 28 + React 18 + TypeScript
- Webpack for bundling
- TailwindCSS for styling
- Recharts for data visualization
- Lucide for icons

**Backend - Python Services:**
- FastAPI (async web framework)
- SQLAlchemy + Asyncpg (async database ORM)
- Redis + Hiredis (caching)
- Pandas + NumPy (data processing)
- TensorFlow, Scikit-learn, XGBoost (ML)
- Structlog (structured logging)
- Prometheus client (metrics)
- pytest (testing)

**Backend - Node.js Services:**
- Express (web framework)
- TypeScript
- pg (PostgreSQL client)
- Axios (HTTP client)
- Jest (testing)

**Infrastructure:**
- Docker + Docker Compose
- Kubernetes + Kind (local development)
- ArgoCD (GitOps CD)
- Prometheus + Grafana (monitoring)
- Loki (log aggregation)

## Important Patterns & Conventions

### Environment Variables
- Each service has `.env.example` file showing required variables
- Local development uses `.env` files (gitignored)
- Kubernetes uses ConfigMaps and Secrets

### Database Connections
- PostgreSQL runs on port 5433 (mapped from container's 5432)
- Connection strings use format: `postgresql://postgres:postgres@localhost:5433/trii_dev`
- Python services use asyncpg: `postgresql+asyncpg://...`
- Node services use pg library
- TimescaleDB extensions enabled for time-series data

### API Patterns
- All services expose `/health` endpoint
- Python services use FastAPI with async/await
- Node services use Express with TypeScript
- CORS enabled for local development
- Helmet for security headers

### Testing
- Python: pytest with pytest-asyncio, pytest-cov
- Node: Jest
- Run tests from service directories or root with `pnpm test`

### Code Quality
- Python: black (formatting), mypy (type checking), pylint (linting)
- TypeScript: prettier (formatting), eslint (linting)
- Pre-commit hooks via Husky (see `.husky/`)

### Kubernetes Deployment
- Uses Kustomize for manifest management
- Base manifests in `infrastructure/kubernetes/base/`
- Environment overlays in `infrastructure/kubernetes/overlays/` (staging, prod)
- ArgoCD configurations in `infrastructure/kubernetes/argocd/`
- Each service has: Deployment, Service, and optional Ingress

### Docker Build Context
- Each service has its own Dockerfile
- Build context is the service directory
- Services use multi-stage builds where applicable
- Development: volume mounts for hot-reload
- Production: copy source into container

## Common Development Workflows

### Adding a New Feature
1. Identify which service(s) need changes
2. For frontend: work in `apps/desktop-client/src/`
3. For backend: work in appropriate `services/*/app/` directory
4. Add tests alongside code changes
5. Update API contracts if service interfaces change
6. Test locally with Docker Compose
7. Update Kubernetes manifests if deployment changes needed

### Debugging Services
- Check service logs: `docker-compose logs -f [service-name]`
- Access service directly via exposed ports
- Use `/health` endpoints to verify service status
- For Kubernetes: use debug scripts in `scripts/`
- PostgreSQL debugging: `./scripts/diagnose-postgres.sh`

### Database Migrations
- Located in individual service directories
- Run migrations via `./scripts/database/run_migrations.sh`
- Test data population: `./scripts/populate-test-data.sh`

### Working with Kubernetes
- Local development uses Kind cluster
- ArgoCD syncs from Git repository
- Access ArgoCD: `./scripts/setup-argocd-access.sh`
- Switch contexts: `./scripts/k8s-context-selector.sh`
- See `infrastructure/kubernetes/README.md` for detailed guide
- Migration plan documented in `PLAN_MIGRACION_KUBERNETES.md`

## Key Configuration Files

- `pnpm-workspace.yaml` - Defines workspace packages
- `docker-compose.yml` - Links to `infrastructure/docker/docker-compose.yml`
- `infrastructure/kubernetes/base/kustomization.yaml` - Base K8s resources
- `.env` files in service directories - Service-specific configuration
- `init.sh` - Automated development environment setup

## Node Version Requirements
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Python >= 3.11 (for Python services)

## Additional Documentation
- `README.md` - Quick start guide
- `PLAN_MIGRACION_KUBERNETES.md` - Kubernetes migration plan
- `infrastructure/kubernetes/README.md` - K8s setup guide
- Service-specific READMEs in each `services/*/README.md`
