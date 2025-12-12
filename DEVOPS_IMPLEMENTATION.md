# TRII Investment Platform - DevOps Implementation Guide

## Table of Contents
1. [CI/CD Pipeline Architecture](#cicd-pipeline-architecture)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Docker Configuration](#docker-configuration)
4. [Monitoring & Observability](#monitoring--observability)
5. [Security & Compliance](#security--compliance)
6. [Deployment Strategies](#deployment-strategies)
7. [Infrastructure Automation](#infrastructure-automation)

---

## CI/CD Pipeline Architecture

### Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Developer Workflow                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ git push
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GitHub Actions Triggered                       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │    │  ML Service  │
│   Pipeline   │    │   Pipeline   │    │   Pipeline   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Quality Gate: All Checks Pass                 │
│  ✓ Linting  ✓ Tests  ✓ Security  ✓ Coverage  ✓ Build           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Build & Push Docker Images                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Deploy to Staging Environment                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Integration & E2E Tests                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Manual Approval (main branch)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Deploy to Production                           │
│                   (Blue-Green Strategy)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Post-Deployment Verification                   │
│  ✓ Health Checks  ✓ Smoke Tests  ✓ Performance Metrics         │
└─────────────────────────────────────────────────────────────────┘
```

### Branch Strategy & Triggers

| Branch Pattern | Triggers | Actions |
|---------------|----------|---------|
| `feature/*` | Push, PR | Lint, Test, Build |
| `develop` | Push, PR | Full CI + Deploy to Dev |
| `release/*` | Push, PR | Full CI + Deploy to Staging |
| `main` | Push | Full CI + Manual Approval + Production Deploy |
| `hotfix/*` | Push, PR | Full CI + Fast-track to Production |

---

## GitHub Actions Workflows

### Workflow Matrix Strategy

```yaml
# Matrix for parallel testing across environments
strategy:
  matrix:
    node-version: [18.x, 20.x]
    python-version: [3.11, 3.12]
    os: [ubuntu-latest, macos-latest, windows-latest]
```

### Workflow 1: Frontend CI Pipeline

**File**: `.github/workflows/ci-frontend.yml`

**Purpose**: Build, test, and validate desktop client application

**Stages**:
1. **Setup**: Checkout, cache dependencies, install PNPM
2. **Lint**: ESLint, Prettier, TypeScript compiler
3. **Test**: Jest unit tests, coverage report
4. **Build**: Electron app compilation
5. **E2E**: Playwright end-to-end tests
6. **Package**: Create distributable (DMG, EXE, AppImage)
7. **Upload Artifacts**: Store build artifacts

**Caching Strategy**:
- PNPM store cache: `~/.pnpm-store`
- Electron cache: `~/.cache/electron`
- Playwright browsers: `~/.cache/ms-playwright`

**Performance Optimizations**:
- Parallel test execution
- Incremental TypeScript compilation
- Dependency caching (restore in 3-5 seconds)

### Workflow 2: Backend Services CI Pipeline

**File**: `.github/workflows/ci-backend.yml`

**Purpose**: Test and validate all Python/Node microservices

**Stages**:
1. **Setup**: Matrix for Python 3.11/3.12, Node 18/20
2. **Lint**: Black, Pylint, MyPy, ESLint
3. **Test**: pytest with coverage, Jest for Node services
4. **Integration Tests**: Service-to-service communication
5. **Docker Build**: Multi-stage builds
6. **Security Scan**: Trivy, Snyk
7. **Push Images**: To GitHub Container Registry

**Service-Specific Jobs**:
- `test-market-data`: Market data service tests
- `test-analysis-engine`: Analysis service tests
- `test-ml-service`: ML service tests (requires GPU runner)
- `test-portfolio-manager`: Portfolio service tests
- `test-risk-assessment`: Risk service tests

### Workflow 3: ML Service CI/CD

**File**: `.github/workflows/ci-ml-service.yml`

**Purpose**: Train, validate, and deploy ML models

**Stages**:
1. **Data Validation**: Check training data integrity
2. **Model Training**: Train on GPU runner (self-hosted or cloud)
3. **Model Evaluation**: Validate metrics (accuracy, precision, recall)
4. **Model Versioning**: Upload to MLflow/DVC
5. **Integration Test**: Test inference API
6. **Deploy**: Update production model if metrics improved

**Model Performance Gates**:
- Training accuracy > 75%
- Validation accuracy > 70%
- Inference latency < 100ms (p95)

### Workflow 4: Security Scanning

**File**: `.github/workflows/security-scan.yml`

**Purpose**: Continuous security analysis

**Tools**:
- **Trivy**: Container vulnerability scanning
- **Snyk**: Dependency vulnerability detection
- **OWASP Dependency-Check**: Known CVE scanning
- **Gitleaks**: Secret detection
- **CodeQL**: Static code analysis
- **Checkov**: IaC security scanning

**Schedule**: Daily at 2 AM UTC + on every PR

**Thresholds**:
- High severity: Fail build
- Medium severity: Warning
- Low severity: Informational

### Workflow 5: Staging Deployment

**File**: `.github/workflows/deploy-staging.yml`

**Purpose**: Automated staging environment deployment

**Stages**:
1. **Checkout**: Get latest code
2. **Build Images**: Docker multi-stage builds
3. **Push Images**: Tagged with commit SHA + staging
4. **Deploy**: Docker Compose or Kubernetes deployment
5. **Database Migration**: Run pending migrations
6. **Smoke Tests**: Basic health checks
7. **Integration Tests**: Full E2E test suite
8. **Performance Tests**: k6 load testing
9. **Notification**: Slack/email notification

**Deployment Method**: Docker Compose (staging)
```bash
docker-compose -f docker-compose.staging.yml up -d
docker-compose exec market-data alembic upgrade head
```

### Workflow 6: Production Deployment

**File**: `.github/workflows/deploy-production.yml`

**Purpose**: Production deployment with approval gates

**Stages**:
1. **Manual Approval**: Required approval from DevOps team
2. **Pre-Deployment Backup**: Database + configuration backup
3. **Blue-Green Setup**: Spin up new environment (green)
4. **Deploy Services**: Deploy to green environment
5. **Health Checks**: Comprehensive health validation
6. **Traffic Switch**: Route 10% → 50% → 100% traffic
7. **Monitor**: 15-minute observation period
8. **Rollback Decision**: Auto-rollback on error spike
9. **Cleanup**: Remove old blue environment
10. **Post-Deployment**: Notification + audit log

**Rollback Trigger Conditions**:
- Error rate > 1%
- Latency p95 > 3 seconds
- Health check failures > 5%
- Manual rollback request

### Workflow 7: Performance Testing

**File**: `.github/workflows/performance-test.yml`

**Purpose**: Continuous performance benchmarking

**Tools**: k6, Lighthouse, Apache Bench

**Test Scenarios**:
1. **Load Test**: 1000 concurrent users, 5 minutes
2. **Stress Test**: Ramp up to failure point
3. **Spike Test**: Sudden traffic surge
4. **Soak Test**: Sustained load for 1 hour

**Performance Baselines**:
- API latency p95: < 500ms
- API latency p99: < 1000ms
- Throughput: > 1000 req/sec
- Error rate: < 0.1%

**Results**: Published to GitHub Pages + Grafana dashboard

---

## Docker Configuration

### Multi-Stage Build Strategy

**Benefits**:
- Smaller production images (50-70% size reduction)
- Security: No build tools in production
- Faster deployments
- Layer caching optimization

### Example: Python Service Dockerfile

```dockerfile
# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Production
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY ./app /app

# Non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Image Size Comparison**:
- Before multi-stage: ~1.2 GB
- After multi-stage: ~350 MB
- With Alpine: ~200 MB (but slower builds)

### Docker Compose: Development Environment

**File**: `infrastructure/docker/docker-compose.yml`

**Services**:
- PostgreSQL + TimescaleDB
- Redis
- RabbitMQ
- MinIO
- All microservices
- Nginx API Gateway
- Prometheus + Grafana

**Features**:
- Named volumes for data persistence
- Health checks for all services
- Depends_on for startup ordering
- Resource limits
- Network isolation
- Hot-reload for development

**Startup Command**:
```bash
docker-compose up -d
docker-compose logs -f [service-name]
```

### Docker Compose: Production Environment

**File**: `infrastructure/docker/docker-compose.prod.yml`

**Differences from Development**:
- No volume mounts (immutable containers)
- Stricter resource limits
- Production-optimized configurations
- Read-only root filesystems
- No debug ports exposed
- Secrets management via Docker secrets

---

## Monitoring & Observability

### Three Pillars of Observability

1. **Metrics** (Prometheus)
2. **Logs** (Loki + Grafana)
3. **Traces** (Jaeger)

### Prometheus Metrics Collection

**Instrumentation Strategy**:

**Python Services (FastAPI)**:
```python
from prometheus_client import Counter, Histogram, Gauge

# Request counter
request_count = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

# Request duration
request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

# Active connections
active_connections = Gauge(
    'websocket_connections',
    'Active WebSocket connections'
)
```

**Node.js Services (NestJS)**:
```typescript
import { Counter, Histogram } from 'prom-client';

const requestCounter = new Counter({
  name: 'api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'endpoint', 'status']
});
```

### Grafana Dashboards

**Pre-built Dashboards**:

1. **System Overview**
   - Service health status
   - Request rate (RPS)
   - Error rate
   - Latency (p50, p95, p99)
   - Resource utilization

2. **Business Metrics**
   - Active users
   - Portfolios created
   - Predictions generated
   - Alerts triggered

3. **Database Performance**
   - Query latency
   - Connection pool usage
   - Slow queries
   - Cache hit rate

4. **ML Model Performance**
   - Inference latency
   - Prediction accuracy
   - Model version
   - Feature importance

5. **Infrastructure**
   - CPU, memory, disk usage
   - Network I/O
   - Container health
   - Message queue depth

### Log Aggregation with Loki

**Log Levels**:
- DEBUG: Development only
- INFO: General information
- WARNING: Potential issues
- ERROR: Error conditions
- CRITICAL: System failures

**Structured Logging Format**:
```json
{
  "timestamp": "2025-12-11T10:30:00Z",
  "level": "INFO",
  "service": "market-data",
  "correlation_id": "abc-123-def",
  "user_id": "user-456",
  "message": "Quote fetched successfully",
  "metadata": {
    "symbol": "AAPL",
    "latency_ms": 45
  }
}
```

### Alerting Rules (Prometheus Alertmanager)

**Critical Alerts** (PagerDuty/SMS):
- Service down > 1 minute
- Error rate > 5%
- Database connection failure
- Disk usage > 90%

**Warning Alerts** (Slack/Email):
- Error rate > 1%
- Latency p95 > 2 seconds
- Cache hit rate < 70%
- Memory usage > 80%

**Alert Configuration Example**:
```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(api_requests_total{status=~"5.."}[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "{{ $labels.service }} error rate is {{ $value }}"
```

---

## Security & Compliance

### Security Layers

1. **Application Security**
   - Input validation (Pydantic, Zod)
   - Output encoding
   - Authentication (JWT)
   - Authorization (RBAC)
   - Rate limiting
   - CORS configuration

2. **Network Security**
   - TLS 1.3 only
   - Firewall rules
   - Network segmentation
   - VPN for admin access
   - DDoS protection

3. **Data Security**
   - Encryption at rest (AES-256)
   - Encryption in transit (TLS)
   - Key rotation (90 days)
   - PII data masking
   - Audit logging

4. **Container Security**
   - Distroless base images
   - Non-root users
   - Read-only root filesystem
   - Security scanning (Trivy)
   - Runtime security (Falco)

### Secrets Management

**Strategy**: HashiCorp Vault or AWS Secrets Manager

**Secrets Categories**:
- Database credentials
- API keys (market data providers)
- JWT signing keys
- Encryption keys
- Third-party service credentials

**Rotation Policy**:
- API keys: 90 days
- Passwords: 90 days
- JWT keys: 30 days
- Encryption keys: 180 days

### Compliance Requirements

**Financial Data Regulations**:
- Data retention: 7 years
- Audit trail: All transactions
- Access logs: 1 year retention
- Encryption: Required at rest and transit
- User consent: GDPR compliance

**Audit Logging**:
```json
{
  "timestamp": "2025-12-11T10:30:00Z",
  "user_id": "user-123",
  "action": "portfolio_created",
  "resource": "portfolio-456",
  "ip_address": "192.168.1.1",
  "user_agent": "TRII Desktop Client v1.0",
  "status": "success"
}
```

---

## Deployment Strategies

### Blue-Green Deployment

**Process**:
1. Current production = Blue (v1.0)
2. Deploy new version = Green (v1.1)
3. Run smoke tests on Green
4. Switch 10% traffic to Green
5. Monitor for 5 minutes
6. Switch 50% traffic to Green
7. Monitor for 10 minutes
8. Switch 100% traffic to Green
9. Keep Blue for 24 hours (rollback ready)
10. Decommission Blue

**Rollback**: Instant switch back to Blue

### Canary Deployment

**Process**:
1. Deploy v1.1 to 5% of users
2. Monitor metrics for 30 minutes
3. If successful, increase to 25%
4. Monitor for 1 hour
5. If successful, increase to 50%
6. Monitor for 2 hours
7. Complete rollout to 100%

**Metrics to Monitor**:
- Error rate comparison (canary vs baseline)
- Latency comparison
- User engagement metrics

### Database Migration Strategy

**Zero-Downtime Migrations**:

1. **Backward Compatible Changes**:
   - Add new columns (nullable)
   - Add new tables
   - Add indexes

2. **Multi-Phase Deployments**:
   - Phase 1: Add new column (nullable)
   - Phase 2: Populate new column
   - Phase 3: Make column required
   - Phase 4: Remove old column

3. **Rollback Plan**:
   - Keep migration scripts reversible
   - Database backups before migration
   - Tested rollback procedures

**Migration Tools**:
- Python: Alembic
- Node.js: TypeORM migrations
- PostgreSQL: pgAdmin for schema changes

---

## Infrastructure Automation

### Terraform Structure

**Directory Layout**:
```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   ├── database/
│   ├── storage/
│   └── monitoring/
└── main.tf
```

### Terraform Modules

**Networking Module**:
- VPC creation
- Subnet configuration
- Security groups
- NAT gateways
- Load balancers

**Compute Module**:
- EC2/ECS instances
- Auto-scaling groups
- Launch templates
- IAM roles

**Database Module**:
- RDS PostgreSQL
- ElastiCache Redis
- Backup policies
- Parameter groups

### Infrastructure as Code Best Practices

1. **State Management**:
   - Remote backend (S3 + DynamoDB)
   - State locking
   - Encrypted state files

2. **Modularization**:
   - Reusable modules
   - Clear interfaces
   - Version pinning

3. **Security**:
   - No hardcoded credentials
   - Least privilege IAM
   - Encryption by default

4. **Testing**:
   - Terratest for module testing
   - terraform validate
   - terraform plan review

### Automated Backup Strategy

**Database Backups**:
```bash
# Daily full backup
0 2 * * * /scripts/backup-database.sh full

# Hourly incremental backup
0 * * * * /scripts/backup-database.sh incremental

# Retention: 7 daily, 4 weekly, 12 monthly
```

**Backup Verification**:
- Automated restore tests (weekly)
- Backup integrity checks
- Offsite backup replication

---

## Next Steps for Implementation

### Phase 1: Foundation (Week 1-2)
1. ✅ Initialize Git repository
2. ✅ Create project structure
3. ✅ Setup GitHub repository
4. ⬜ Configure GitHub Actions workflows
5. ⬜ Create base Docker images
6. ⬜ Setup Docker Compose for local dev

### Phase 2: Core Services (Week 3-4)
1. ⬜ Implement Market Data Service
2. ⬜ Implement Portfolio Manager Service
3. ⬜ Setup PostgreSQL + TimescaleDB
4. ⬜ Setup Redis caching
5. ⬜ Create API Gateway configuration

### Phase 3: Analysis & ML (Week 5-6)
1. ⬜ Implement Analysis Engine Service
2. ⬜ Implement ML Prediction Service
3. ⬜ Setup MLflow for model versioning
4. ⬜ Create training pipeline

### Phase 4: Frontend (Week 7-8)
1. ⬜ Setup Electron + React
2. ⬜ Implement core UI components
3. ⬜ Integrate with backend APIs
4. ⬜ Add real-time data streaming

### Phase 5: DevOps & Deployment (Week 9-10)
1. ⬜ Setup monitoring (Prometheus + Grafana)
2. ⬜ Configure logging (Loki)
3. ⬜ Implement CI/CD pipelines
4. ⬜ Setup staging environment
5. ⬜ Create deployment scripts

### Phase 6: Testing & Security (Week 11-12)
1. ⬜ Write unit tests (80% coverage)
2. ⬜ Write integration tests
3. ⬜ Write E2E tests
4. ⬜ Security scanning setup
5. ⬜ Performance testing

### Phase 7: Production Readiness (Week 13-14)
1. ⬜ Production environment setup
2. ⬜ Disaster recovery planning
3. ⬜ Documentation completion
4. ⬜ Load testing
5. ⬜ Security audit

### Phase 8: Launch (Week 15)
1. ⬜ Beta testing
2. ⬜ Bug fixes
3. ⬜ Production deployment
4. ⬜ Post-launch monitoring
5. ⬜ User onboarding

---

## Quick Start Commands

```bash
# Clone and setup
git clone <repository-url>
cd investment-app
./scripts/setup/setup-dev.sh

# Start development environment
docker-compose up -d

# Run frontend
cd apps/desktop-client
pnpm install
pnpm dev

# Run backend service
cd services/market-data
pip install -r requirements.txt
uvicorn app.main:app --reload

# Run tests
pnpm test                    # Frontend tests
pytest                       # Backend tests

# Build Docker images
docker-compose build

# Deploy to staging
./scripts/deployment/deploy.sh staging

# View logs
docker-compose logs -f [service-name]
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-11
**Next Review**: 2025-12-25
