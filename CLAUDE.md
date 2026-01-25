# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TRII Investment Decision Support Platform** - A comprehensive desktop application for detecting optimal investment opportunities using real-time data analysis, technical indicators, and machine learning predictions.

**Architecture**: Microservices-based platform with Electron frontend, Python/Node.js backends, deployed via Docker Compose.

### ⚠️ Important: Architecture Refactoring in Progress

This project is undergoing a **clean architecture refactoring**:

- **New Structure**: `app/` directory (clean architecture with separate electron/frontend/shared)
- **Legacy Structure**: `apps/desktop-client/` (original Electron app)
- **Backend**: Moved from `services/` to `backend/` directory
- **Infrastructure**: Simplified from full K8s setup to minimal Docker Compose (PostgreSQL + Redis only)
- **Removed**: RabbitMQ, MinIO, and over 118 Kubernetes files

**Current Status**: See `REFACTORING_PROGRESS.md` for detailed status. Both structures coexist during transition.

**For New Development**: Use `app/` structure and `backend/` services.

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

#### New Architecture (Recommended)
Located in `app/` directory with clean separation:

```bash
# Start new architecture app (from root)
# Note: May require additional setup - see REFACTORING_PROGRESS.md
cd app
npm install
npm start

# Structure:
# - app/electron/      - Main process code
# - app/frontend/      - React UI components
# - app/shared/        - Shared utilities
```

#### Legacy Architecture (Currently Active)
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

**Note**: The legacy structure in `apps/desktop-client/` is currently the active implementation. The new `app/` structure is being developed as part of the clean architecture refactoring.

### Backend Services

#### Market Data Service (FastAPI/Python)
```bash
cd backend/market-data

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

#### Portfolio Manager (Express/Node.js)
```bash
cd backend/portfolio-manager

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
cd backend/ml-prediction

# Install dependencies
pip install -r requirements.txt

# Run locally (port 8004)
uvicorn app.main:app --reload --port 8004

# Run tests
pytest
```

#### Analysis Engine (FastAPI/Python)
```bash
cd backend/analysis-engine

# Run locally (port 8002)
uvicorn app.main:app --reload --port 8002
```

### Infrastructure

#### Docker Compose (Simplified Infrastructure)
Located in `infrastructure/docker/`

```bash
# Start infrastructure services (PostgreSQL + Redis)
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f [service-name]

# Stop all services
docker-compose -f infrastructure/docker/docker-compose.yml down

# Common services:
# - postgres (PostgreSQL + TimescaleDB)
# - redis
```

**Note**: The infrastructure has been simplified to only include essential services (PostgreSQL and Redis). Backend microservices run independently during development.

#### Kubernetes (Optional/Advanced)
The project includes Kubernetes manifests for advanced deployments, though the infrastructure has been simplified.

```bash
# Setup local Kind cluster (optional)
./scripts/argocd/setup-argocd-access.sh

# Switch contexts
./scripts/k8s-context-selector.sh

# Connect to PostgreSQL (K8s deployment)
./scripts/connect-postgres-now.sh
./scripts/postgres-ingress-connection.sh

# Database operations
./scripts/database/run_migrations.sh

# Debug applications
./scripts/debug-app.sh
./scripts/diagnose-postgres.sh

# Select Docker context
./scripts/docker-context-selector.sh
```

**Note**: The Kubernetes setup is available but simplified. For local development, Docker Compose is recommended.

## Architecture Overview

### Monorepo Structure
```
investment-app/
├── app/                     # Refactored Electron application
│   ├── electron/            # Electron main process
│   ├── frontend/            # React UI components
│   └── shared/              # Shared utilities
├── apps/                    # Original frontend applications
│   └── desktop-client/      # Electron + React + TypeScript (legacy)
├── backend/                 # Backend microservices
│   ├── market-data/         # FastAPI - Real-time market data (port 8001)
│   ├── analysis-engine/     # FastAPI - Technical analysis (port 8002)
│   ├── portfolio-manager/   # Express/Node.js - Portfolio management (port 8003)
│   ├── ml-prediction/       # FastAPI - ML predictions (port 8004)
│   └── gateway/             # API gateway
├── shared/                  # Shared backend utilities
├── libs/                    # Shared libraries
│   ├── api-client/          # API client utilities
│   ├── common/              # Common TypeScript utilities
│   └── python-common/       # Common Python utilities
├── infrastructure/          # Infrastructure as Code
│   ├── docker/              # Simplified Docker Compose (PostgreSQL + Redis)
│   ├── kubernetes/          # K8s manifests (archived/simplified)
│   └── monitoring/          # Prometheus, Grafana, Loki
└── scripts/                 # Automation scripts (30+ utilities)
```

**Note**: The project underwent a major refactoring to simplify architecture. The `app/` directory contains the new clean architecture, while `apps/desktop-client/` is the legacy structure.

### Service Dependencies & Ports

**Infrastructure Services:**
- PostgreSQL (TimescaleDB): 5433 → 5432 (time-series data)
- Redis: 6379 (caching)

**Note**: Infrastructure has been simplified. RabbitMQ and MinIO were removed during refactoring.

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
- Express (web framework) - Used in portfolio-manager service
- TypeScript
- pg (PostgreSQL client)
- Axios (HTTP client)
- Jest (testing)

**Note**: Portfolio-manager uses Express/Node.js, not NestJS as originally planned.

**Infrastructure:**
- Docker + Docker Compose (primary deployment method)
- Kubernetes + Kind (optional, for advanced deployments)
- ArgoCD (optional, GitOps CD)
- GitHub Actions (CI/CD pipelines)
- Prometheus + Grafana (monitoring, optional)
- Loki (log aggregation, optional)

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

### Kubernetes Deployment (Optional/Simplified)
- **Status**: Simplified infrastructure, K8s optional for advanced use
- Uses Kustomize for manifest management
- Manifests available in `infrastructure/kubernetes/`
- ArgoCD configurations available for GitOps deployments
- **For local development**: Use Docker Compose instead

### Docker Build Context
- Each service has its own Dockerfile
- Build context is the service directory
- Services use multi-stage builds where applicable
- Development: volume mounts for hot-reload
- Production: copy source into container

## Common Development Workflows

### Adding a New Feature
1. Identify which service(s) need changes
2. For frontend:
   - New architecture: work in `app/frontend/components/`
   - Legacy: work in `apps/desktop-client/src/`
3. For backend: work in appropriate `backend/*/app/` directory
4. Add tests alongside code changes
5. Update API contracts if service interfaces change
6. Test locally:
   - Start infrastructure: `docker-compose -f infrastructure/docker/docker-compose.yml up -d`
   - Start backend service: `cd backend/[service-name] && uvicorn app.main:app --reload`
   - Start frontend: `pnpm dev`
7. Update Kubernetes manifests if needed (optional for advanced deployments)

### Debugging Services
- Check infrastructure logs: `docker-compose -f infrastructure/docker/docker-compose.yml logs -f [service-name]`
- Access services directly via exposed ports (8001-8004)
- Use `/health` endpoints to verify service status
- Backend service logs: Check console output when running with uvicorn/npm
- PostgreSQL debugging: `./scripts/diagnose-postgres.sh`
- Application debugging: `./scripts/debug-app.sh`

### Database Operations
- Database schema in `infrastructure/docker/init.sql`
- Run migrations via `./scripts/database/run_migrations.sh`
- Direct PostgreSQL connection (when running locally):
  - Host: localhost
  - Port: 5433
  - Database: trii_dev
  - User: postgres
  - Password: postgres
- Connection string: `postgresql://postgres:postgres@localhost:5433/trii_dev`

### Working with Kubernetes (Optional)
- Local development can use Kind cluster (optional, advanced)
- ArgoCD available for GitOps deployments
- Access ArgoCD: `./scripts/argocd/setup-argocd-access.sh`
- Switch contexts: `./scripts/k8s-context-selector.sh`
- See `infrastructure/kubernetes/` for K8s manifests
- **Note**: For most development, Docker Compose is sufficient

## Key Configuration Files

- `pnpm-workspace.yaml` - Defines workspace packages (apps, backend, libs)
- `infrastructure/docker/docker-compose.yml` - Infrastructure services (PostgreSQL + Redis)
- `infrastructure/docker/init.sql` - Database schema and initialization
- `backend/*/requirements.txt` - Python service dependencies
- `backend/portfolio-manager/package.json` - Node.js service dependencies
- `.env` files in service directories - Service-specific configuration
- `REFACTORING_PROGRESS.md` - Current refactoring status and architecture changes
- `DATABASE_README.md` - Database schema documentation

## Node Version Requirements
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Python >= 3.11 (for Python services)

## Utility Scripts

The `scripts/` directory contains 30+ automation scripts:

### Database Scripts
- `./scripts/database/run_migrations.sh` - Run database migrations
- `./scripts/connect-postgres-now.sh` - Connect to PostgreSQL
- `./scripts/diagnose-postgres.sh` - PostgreSQL diagnostics

### Kubernetes Scripts (Optional/Advanced)
- `./scripts/k8s-context-selector.sh` - Switch K8s contexts
- `./scripts/debug-app.sh` - Debug K8s applications
- `./scripts/diagnose-cluster.sh` - Cluster diagnostics
- `./scripts/argocd/setup-argocd-access.sh` - Setup ArgoCD access

### Docker Scripts
- `./scripts/docker-context-selector.sh` - Switch Docker contexts
- `./scripts/configure-hosts.sh` - Configure /etc/hosts for local development

### Deployment Scripts
- Located in `./scripts/deployment/`
- See individual scripts for deployment automation

## CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:

- **ci-cd-pipeline.yml** - Main CI/CD pipeline
  - Automatically detects changed services
  - Builds and pushes Docker images to DockerHub
  - Updates Kubernetes manifests with new image tags
  - Triggers ArgoCD sync (if configured)

- **pr-validation.yml** - Pull request validation
  - Runs tests across all packages
  - Performs linting and type checking
  - Validates code quality

**Docker Images**: Published to DockerHub
- `trii/market-data`
- `trii/analysis-engine`
- `trii/portfolio-manager`
- `trii/ml-prediction`

## Development Status & Priorities

### Current Phase: Clean Architecture Refactoring

The project is transitioning to a simplified, clean architecture:

**Completed:**
- ✅ Simplified infrastructure (removed 118 K8s files, RabbitMQ, MinIO)
- ✅ Backend services reorganized in `backend/` directory
- ✅ New frontend structure created in `app/` directory
- ✅ Database schema designed (see `infrastructure/docker/init.sql`)
- ✅ Recommendations UI component created (`app/frontend/components/RecommendationsView.tsx`)
- ✅ CI/CD pipeline with automatic service detection

**In Progress:**
- 🔄 Completing migration from `apps/desktop-client/` to `app/` structure
- 🔄 Integrating new UI components with backend services
- 🔄 API Gateway setup in `backend/gateway/`

**Key Development Guidelines:**
1. **Prefer `backend/` over `services/`** - Services moved to backend directory
2. **Use simplified Docker Compose** - K8s is optional for advanced use
3. **New features in `app/`** - Use new clean architecture when possible
4. **Check `REFACTORING_PROGRESS.md`** - Always review current refactoring status before major changes
5. **Simple over complex** - Infrastructure has been intentionally simplified

### Quick Start for Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL + Redis)
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# 3. Start a backend service (example: market-data)
cd backend/market-data
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# 4. Start desktop client (legacy, currently active)
cd apps/desktop-client
npm start

# Or use root command
pnpm dev
```

## Additional Documentation
- `README.md` - Quick start guide
- `PROJECT_STATUS.md` - **⭐ Comprehensive project status and roadmap**
- `REFACTORING_PROGRESS.md` - **⭐ Clean architecture refactoring status (IMPORTANT)**
- `CLEAN_ARCHITECTURE_PLAN.md` - Architecture refactoring plan
- `DATABASE_README.md` - Database schema and design
- `TESTING_GUIDE.md` - Testing procedures and API examples
- Service-specific READMEs in each `backend/*/README.md`
- `.github/workflows/README.md` - CI/CD pipeline documentation
- `.github/CICD_SETUP.md` - CI/CD setup and configuration
