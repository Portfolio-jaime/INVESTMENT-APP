# TRII Investment Platform - Project Directory Structure

```
investment-app/
│
├── .github/                                    # GitHub configurations
│   ├── workflows/                              # CI/CD pipelines
│   │   ├── ci-frontend.yml                    # Frontend CI pipeline
│   │   ├── ci-backend.yml                     # Backend services CI
│   │   ├── ci-ml-service.yml                  # ML service CI
│   │   ├── deploy-staging.yml                 # Staging deployment
│   │   ├── deploy-production.yml              # Production deployment
│   │   ├── security-scan.yml                  # Security scanning
│   │   └── performance-test.yml               # Performance benchmarks
│   ├── ISSUE_TEMPLATE/                        # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md               # PR template
│
├── apps/                                       # Application layer
│   └── desktop-client/                        # Electron desktop app
│       ├── public/                            # Static assets
│       ├── src/
│       │   ├── main/                          # Electron main process
│       │   │   ├── index.ts                   # Main entry point
│       │   │   ├── preload.ts                 # Preload script
│       │   │   ├── ipc/                       # IPC handlers
│       │   │   └── services/                  # Main process services
│       │   ├── renderer/                      # React application
│       │   │   ├── components/                # React components
│       │   │   │   ├── common/                # Shared components
│       │   │   │   ├── charts/                # Chart components
│       │   │   │   ├── portfolio/             # Portfolio components
│       │   │   │   ├── analysis/              # Analysis components
│       │   │   │   └── alerts/                # Alert components
│       │   │   ├── features/                  # Feature modules
│       │   │   │   ├── dashboard/
│       │   │   │   ├── portfolio/
│       │   │   │   ├── market-data/
│       │   │   │   ├── analysis/
│       │   │   │   ├── predictions/
│       │   │   │   ├── risk/
│       │   │   │   └── settings/
│       │   │   ├── store/                     # Redux store
│       │   │   │   ├── slices/                # Redux slices
│       │   │   │   ├── api/                   # RTK Query API
│       │   │   │   └── index.ts
│       │   │   ├── hooks/                     # Custom React hooks
│       │   │   ├── utils/                     # Utility functions
│       │   │   ├── types/                     # TypeScript types
│       │   │   ├── services/                  # API services
│       │   │   ├── App.tsx                    # Root component
│       │   │   └── index.tsx                  # Renderer entry
│       │   └── shared/                        # Shared code
│       ├── tests/                             # Tests
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── electron-builder.yml               # Electron builder config
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts                     # Vite configuration
│
├── services/                                   # Backend microservices
│   ├── market-data/                           # Market data service
│   │   ├── app/
│   │   │   ├── api/                           # API endpoints
│   │   │   │   ├── v1/
│   │   │   │   │   ├── endpoints/
│   │   │   │   │   │   ├── quotes.py
│   │   │   │   │   │   ├── history.py
│   │   │   │   │   │   └── streaming.py
│   │   │   │   │   └── router.py
│   │   │   │   └── dependencies.py
│   │   │   ├── core/                          # Core configurations
│   │   │   │   ├── config.py
│   │   │   │   ├── security.py
│   │   │   │   └── logging.py
│   │   │   ├── models/                        # Data models
│   │   │   │   ├── domain/                    # Domain models
│   │   │   │   └── schemas/                   # Pydantic schemas
│   │   │   ├── services/                      # Business logic
│   │   │   │   ├── data_provider.py
│   │   │   │   ├── data_normalizer.py
│   │   │   │   └── websocket_manager.py
│   │   │   ├── repositories/                  # Data access layer
│   │   │   │   ├── timescale_repo.py
│   │   │   │   └── redis_repo.py
│   │   │   ├── integrations/                  # External integrations
│   │   │   │   ├── alpha_vantage.py
│   │   │   │   ├── yahoo_finance.py
│   │   │   │   └── twelve_data.py
│   │   │   ├── workers/                       # Background workers
│   │   │   │   └── data_ingestion.py
│   │   │   └── main.py                        # FastAPI app
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── pyproject.toml
│   │
│   ├── analysis-engine/                       # Technical analysis service
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── v1/
│   │   │   │       ├── endpoints/
│   │   │   │       │   ├── technical.py
│   │   │   │       │   ├── signals.py
│   │   │   │       │   └── backtest.py
│   │   │   │       └── router.py
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   │   ├── technical_analyzer.py
│   │   │   │   ├── pattern_recognizer.py
│   │   │   │   ├── signal_generator.py
│   │   │   │   └── backtester.py
│   │   │   ├── indicators/                    # Technical indicators
│   │   │   │   ├── trend.py                   # MA, EMA, etc.
│   │   │   │   ├── momentum.py                # RSI, MACD, etc.
│   │   │   │   ├── volatility.py              # Bollinger Bands, ATR
│   │   │   │   └── volume.py                  # Volume indicators
│   │   │   ├── strategies/                    # Trading strategies
│   │   │   └── main.py
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── ml-prediction/                         # ML/AI service
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── v1/
│   │   │   │       ├── endpoints/
│   │   │   │       │   ├── predictions.py
│   │   │   │       │   ├── models.py
│   │   │   │       │   └── sentiment.py
│   │   │   │       └── router.py
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   │   ├── lstm_model.py
│   │   │   │   ├── transformer_model.py
│   │   │   │   └── ensemble_model.py
│   │   │   ├── services/
│   │   │   │   ├── predictor.py
│   │   │   │   ├── trainer.py
│   │   │   │   ├── feature_engineer.py
│   │   │   │   └── sentiment_analyzer.py
│   │   │   ├── pipelines/                     # ML pipelines
│   │   │   │   ├── training_pipeline.py
│   │   │   │   └── inference_pipeline.py
│   │   │   └── main.py
│   │   ├── notebooks/                         # Jupyter notebooks
│   │   │   ├── exploration/
│   │   │   └── experiments/
│   │   ├── models/                            # Saved models
│   │   ├── data/                              # Training data
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── portfolio-manager/                     # Portfolio management service
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── portfolio/
│   │   │   │   │   ├── portfolio.controller.ts
│   │   │   │   │   ├── portfolio.service.ts
│   │   │   │   │   ├── portfolio.module.ts
│   │   │   │   │   └── entities/
│   │   │   │   │       ├── portfolio.entity.ts
│   │   │   │   │       └── transaction.entity.ts
│   │   │   │   ├── holdings/
│   │   │   │   ├── performance/
│   │   │   │   ├── rebalancing/
│   │   │   │   └── auth/
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   └── pipes/
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── risk-assessment/                       # Risk analysis service
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── v1/
│   │   │   │       ├── endpoints/
│   │   │   │       │   ├── risk_metrics.py
│   │   │   │       │   ├── position_sizing.py
│   │   │   │       │   └── simulations.py
│   │   │   │       └── router.py
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   │   ├── risk_calculator.py
│   │   │   │   ├── var_calculator.py          # Value at Risk
│   │   │   │   ├── monte_carlo.py
│   │   │   │   └── correlation_analyzer.py
│   │   │   └── main.py
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── notification/                          # Notification service
│       ├── src/
│       │   ├── modules/
│       │   │   ├── alerts/
│       │   │   ├── email/
│       │   │   └── websocket/
│       │   ├── config/
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── libs/                                       # Shared libraries
│   ├── common/                                 # Common utilities
│   │   ├── src/
│   │   │   ├── types/                         # Shared TypeScript types
│   │   │   ├── constants/
│   │   │   ├── utils/
│   │   │   └── validators/
│   │   └── package.json
│   ├── api-client/                            # API client library
│   │   ├── src/
│   │   │   ├── clients/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   └── package.json
│   └── python-common/                         # Python shared code
│       ├── trii_common/
│       │   ├── database/
│       │   ├── messaging/
│       │   ├── logging/
│       │   └── exceptions/
│       └── setup.py
│
├── infrastructure/                             # Infrastructure as Code
│   ├── docker/                                # Docker configurations
│   │   ├── docker-compose.yml                 # Local development
│   │   ├── docker-compose.prod.yml            # Production
│   │   ├── docker-compose.test.yml            # Testing
│   │   └── dockerfiles/
│   │       ├── Dockerfile.python              # Base Python image
│   │       ├── Dockerfile.node                # Base Node image
│   │       └── Dockerfile.nginx               # Nginx image
│   ├── terraform/                             # Terraform IaC
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── modules/
│   │   │   ├── networking/
│   │   │   ├── compute/
│   │   │   ├── database/
│   │   │   ├── storage/
│   │   │   └── monitoring/
│   │   └── main.tf
│   ├── kubernetes/                            # Kubernetes manifests (future)
│   │   ├── base/
│   │   └── overlays/
│   ├── nginx/                                 # Nginx configurations
│   │   ├── nginx.conf
│   │   └── sites/
│   └── monitoring/                            # Monitoring configs
│       ├── prometheus/
│       │   ├── prometheus.yml
│       │   └── rules/
│       ├── grafana/
│       │   ├── dashboards/
│       │   └── datasources/
│       └── loki/
│           └── loki-config.yml
│
├── scripts/                                    # Automation scripts
│   ├── setup/
│   │   ├── setup-dev.sh                       # Development setup
│   │   ├── install-dependencies.sh
│   │   └── init-databases.sh
│   ├── deployment/
│   │   ├── deploy.sh                          # Deployment script
│   │   ├── rollback.sh
│   │   └── health-check.sh
│   ├── database/
│   │   ├── backup-database.sh
│   │   ├── restore-database.sh
│   │   ├── migrate.sh
│   │   └── seed-data.sh
│   ├── maintenance/
│   │   ├── cleanup-logs.sh
│   │   ├── optimize-db.sh
│   │   └── rotate-secrets.sh
│   └── ci/
│       ├── run-tests.sh
│       ├── build-images.sh
│       └── security-scan.sh
│
├── docs/                                       # Documentation
│   ├── architecture/
│   │   ├── decisions/                         # ADRs
│   │   │   ├── 001-tech-stack.md
│   │   │   ├── 002-database-choice.md
│   │   │   └── 003-ml-framework.md
│   │   ├── diagrams/
│   │   └── components/
│   ├── api/
│   │   ├── market-data-api.md
│   │   ├── analysis-api.md
│   │   ├── ml-api.md
│   │   └── openapi/                           # OpenAPI specs
│   │       ├── market-data.yaml
│   │       ├── analysis.yaml
│   │       └── portfolio.yaml
│   ├── deployment/
│   │   ├── local-setup.md
│   │   ├── docker-deployment.md
│   │   └── cloud-deployment.md
│   ├── development/
│   │   ├── getting-started.md
│   │   ├── coding-standards.md
│   │   ├── testing-guide.md
│   │   └── contributing.md
│   ├── operations/
│   │   ├── runbooks/
│   │   │   ├── incident-response.md
│   │   │   ├── database-recovery.md
│   │   │   └── service-restart.md
│   │   └── monitoring.md
│   └── user/
│       ├── user-manual.md
│       ├── tutorials/
│       └── faq.md
│
├── tests/                                      # Integration & E2E tests
│   ├── integration/
│   │   ├── api/
│   │   ├── services/
│   │   └── database/
│   ├── e2e/
│   │   ├── playwright.config.ts
│   │   ├── specs/
│   │   │   ├── portfolio.spec.ts
│   │   │   ├── analysis.spec.ts
│   │   │   └── predictions.spec.ts
│   │   └── fixtures/
│   ├── performance/
│   │   ├── k6/
│   │   │   ├── load-test.js
│   │   │   └── stress-test.js
│   │   └── results/
│   └── security/
│       ├── zap/
│       └── reports/
│
├── data/                                       # Data storage (gitignored)
│   ├── historical/                            # Historical market data
│   ├── models/                                # ML model artifacts
│   ├── backups/                               # Database backups
│   └── exports/                               # User exports
│
├── config/                                     # Configuration files
│   ├── environments/
│   │   ├── .env.example                       # Environment template
│   │   ├── .env.development
│   │   ├── .env.staging
│   │   └── .env.production
│   ├── database/
│   │   ├── postgres.conf
│   │   └── timescaledb.conf
│   ├── redis/
│   │   └── redis.conf
│   └── rabbitmq/
│       └── rabbitmq.conf
│
├── .vscode/                                    # VS Code settings
│   ├── settings.json
│   ├── launch.json
│   ├── extensions.json
│   └── tasks.json
│
├── .husky/                                     # Git hooks
│   ├── pre-commit
│   ├── pre-push
│   └── commit-msg
│
├── .docker/                                    # Docker build cache
├── .github/                                    # GitHub metadata
├── .gitignore
├── .eslintrc.js                               # ESLint config
├── .prettierrc.js                             # Prettier config
├── .editorconfig
├── jest.config.js                             # Jest config
├── tsconfig.base.json                         # Base TypeScript config
├── package.json                               # Root package.json
├── pnpm-workspace.yaml                        # PNPM workspace config
├── Makefile                                   # Build automation
├── README.md                                  # Project README
├── ARCHITECTURE.md                            # Architecture documentation
├── CHANGELOG.md                               # Version history
├── CONTRIBUTING.md                            # Contribution guidelines
├── LICENSE                                    # License file
└── SECURITY.md                                # Security policy

```

## Directory Purpose Summary

### Root Level
- **apps/**: Frontend applications (Electron desktop client)
- **services/**: Backend microservices (API services)
- **libs/**: Shared libraries and utilities
- **infrastructure/**: IaC, Docker, monitoring configurations
- **scripts/**: Automation and maintenance scripts
- **docs/**: Comprehensive documentation
- **tests/**: Integration, E2E, performance, security tests
- **data/**: Local data storage (gitignored)
- **config/**: Configuration files for various environments

### Key Principles
1. **Monorepo Structure**: All code in single repository
2. **Clear Separation**: Apps, services, libs clearly separated
3. **Scalability**: Each service can be deployed independently
4. **Testability**: Dedicated test directories with clear organization
5. **Documentation**: Comprehensive docs co-located with code
6. **DevOps Ready**: Infrastructure and CI/CD configurations included

### Technology-Specific Patterns
- **Python Services**: `app/` folder with FastAPI structure
- **Node.js Services**: `src/` folder with NestJS modules
- **Frontend**: Feature-based organization with Redux
- **Shared Code**: Separate `libs/` for reusable components

### Build Tools
- **Frontend**: PNPM workspaces for monorepo
- **Python**: Poetry or pip with requirements.txt
- **Docker**: Multi-stage builds for production
- **CI/CD**: GitHub Actions workflows

This structure supports:
- Local development
- Docker Compose deployment
- Kubernetes deployment (future)
- CI/CD automation
- Monitoring and observability
- Security scanning
- Performance testing
