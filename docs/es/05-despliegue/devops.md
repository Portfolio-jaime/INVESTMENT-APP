# DevOps e Implementación - TRII Platform

**CI/CD, monitoreo y estrategias de despliegue**

---

## 📋 Tabla de Contenidos

1. [Arquitectura CI/CD](#arquitectura-cicd)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Configuración Docker](#configuración-docker)
4. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
5. [Seguridad y Cumplimiento](#seguridad-y-cumplimiento)
6. [Estrategias de Despliegue](#estrategias-de-despliegue)

---

## 🚀 Arquitectura CI/CD

### Flujo de Pipeline

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

### Estrategia de Ramas y Triggers

| Patrón de Rama | Triggers | Acciones |
|----------------|----------|----------|
| `feature/*` | Push, PR | Lint, Test, Build |
| `develop` | Push, PR | CI Completo + Deploy a Dev |
| `release/*` | Push, PR | CI Completo + Deploy a Staging |
| `main` | Push | CI Completo + Aprobación Manual + Deploy Producción |
| `hotfix/*` | Push, PR | CI Completo + Fast-track a Producción |

---

## 🔄 GitHub Actions Workflows

### Estrategia de Matriz

```yaml
# Testing paralelo en múltiples entornos
strategy:
  matrix:
    node-version: [18.x, 20.x]
    python-version: [3.11, 3.12]
    os: [ubuntu-latest, macos-latest, windows-latest]
```

### Workflow 1: Frontend CI Pipeline

**Archivo**: `.github/workflows/ci-frontend.yml`

**Propósito**: Build, test y validación de aplicación desktop

**Etapas**:
1. **Setup**: Checkout, cache dependencias, instalar PNPM
2. **Lint**: ESLint, Prettier, TypeScript compiler
3. **Test**: Jest unit tests, reporte de cobertura
4. **Build**: Compilación Electron app
5. **E2E**: Playwright end-to-end tests
6. **Package**: Crear distribuibles (DMG, EXE, AppImage)
7. **Upload Artifacts**: Almacenar build artifacts

**Estrategia de Cache**:
- PNPM store: `~/.pnpm-store`
- Electron cache: `~/.cache/electron`
- Playwright browsers: `~/.cache/ms-playwright`

### Workflow 2: Backend Services CI Pipeline

**Archivo**: `.github/workflows/ci-backend.yml`

**Propósito**: Test y validación de microservicios Python/Node

**Etapas**:
1. **Setup**: Matriz Python 3.11/3.12, Node 18/20
2. **Lint**: Black, Pylint, MyPy, ESLint
3. **Test**: pytest con cobertura, Jest para servicios Node
4. **Integration Tests**: Comunicación service-to-service
5. **Docker Build**: Multi-stage builds
6. **Security Scan**: Trivy, Snyk
7. **Push Images**: GitHub Container Registry

### Workflow 3: ML Service CI/CD

**Archivo**: `.github/workflows/ci-ml-service.yml`

**Propósito**: Entrenar, validar y desplegar modelos ML

**Etapas**:
1. **Data Validation**: Verificar integridad datos de entrenamiento
2. **Model Training**: Entrenar en GPU runner (self-hosted o cloud)
3. **Model Evaluation**: Validar métricas (accuracy, precision, recall)
4. **Model Versioning**: Upload a MLflow/DVC
5. **Integration Test**: Test API de inferencia
6. **Deploy**: Actualizar modelo producción si métricas mejoraron

**Gates de Performance**:
- Training accuracy > 75%
- Validation accuracy > 70%
- Inference latency < 100ms (p95)

---

## 🐳 Configuración Docker

### Estrategia Multi-Stage Build

**Beneficios**:
- Imágenes de producción más pequeñas (50-70% reducción)
- Seguridad: Sin herramientas de build en producción
- Despliegues más rápidos
- Optimización de cache de layers

### Dockerfile Python Service

```dockerfile
# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /build

# Instalar dependencias de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Production
FROM python:3.11-slim

WORKDIR /app

# Instalar runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copiar paquetes instalados
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copiar código aplicación
COPY ./app /app

# Usuario no-root por seguridad
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Comparación de Tamaño**:
- Antes multi-stage: ~1.2 GB
- Después multi-stage: ~350 MB
- Con Alpine: ~200 MB (pero builds más lentos)

### Docker Compose: Ambiente Desarrollo

**Archivo**: `infrastructure/docker/docker-compose.yml`

**Servicios**:
- PostgreSQL + TimescaleDB
- Redis
- RabbitMQ
- MinIO
- Todos los microservicios
- Nginx API Gateway
- Prometheus + Grafana

**Características**:
- Named volumes para persistencia de datos
- Health checks para todos los servicios
- depends_on para orden de inicio
- Límites de recursos
- Aislamiento de red
- Hot-reload para desarrollo

---

## 📊 Monitoreo y Observabilidad

### Tres Pilares de Observabilidad

1. **Métricas** (Prometheus)
2. **Logs** (Loki + Grafana)
3. **Traces** (Jaeger)

### Recolección de Métricas Prometheus

**Estrategia de Instrumentación**:

**Servicios Python (FastAPI)**:
```python
from prometheus_client import Counter, Histogram, Gauge

# Contador de requests
request_count = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

# Duración de requests
request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

# Conexiones activas WebSocket
active_connections = Gauge(
    'websocket_connections',
    'Active WebSocket connections'
)
```

### Dashboards Grafana

**Dashboards Pre-construidos**:

1. **System Overview**
   - Estado de salud de servicios
   - Request rate (RPS)
   - Error rate
   - Latency (p50, p95, p99)
   - Utilización de recursos

2. **Business Metrics**
   - Usuarios activos
   - Portafolios creados
   - Predicciones generadas
   - Alertas disparadas

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

### Agregación de Logs con Loki

**Niveles de Log**:
- DEBUG: Solo desarrollo
- INFO: Información general
- WARNING: Problemas potenciales
- ERROR: Condiciones de error
- CRITICAL: Fallos del sistema

**Formato Structured Logging**:
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

### Reglas de Alerting (Prometheus Alertmanager)

**Alertas Críticas** (PagerDuty/SMS):
- Service down > 1 minuto
- Error rate > 5%
- Database connection failure
- Disk usage > 90%

**Alertas de Warning** (Slack/Email):
- Error rate > 1%
- Latency p95 > 2 segundos
- Cache hit rate < 70%
- Memory usage > 80%

---

## 🔒 Seguridad y Cumplimiento

### Capas de Seguridad

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

### Gestión de Secrets

**Estrategia**: HashiCorp Vault o AWS Secrets Manager

**Categorías de Secrets**:
- Database credentials
- API keys (proveedores de market data)
- JWT signing keys
- Encryption keys
- Third-party service credentials

**Política de Rotación**:
- API keys: 90 días
- Passwords: 90 días
- JWT keys: 30 días
- Encryption keys: 180 días

---

## 🚀 Estrategias de Despliegue

### Blue-Green Deployment

**Proceso**:
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

**Rollback**: Switch instantáneo de vuelta a Blue

### Canary Deployment

**Proceso**:
1. Deploy v1.1 to 5% of users
2. Monitor metrics for 30 minutes
3. If successful, increase to 25%
4. Monitor for 1 hour
5. If successful, increase to 50%
6. Monitor for 2 hours
7. Complete rollout to 100%

**Métricas a Monitorear**:
- Error rate comparison (canary vs baseline)
- Latency comparison
- User engagement metrics

### Estrategia de Migración de Base de Datos

**Zero-Downtime Migrations**:

1. **Cambios Backward Compatible**:
   - Add new columns (nullable)
   - Add new tables
   - Add indexes

2. **Despliegues Multi-Phase**:
   - Phase 1: Add new column (nullable)
   - Phase 2: Populate new column
   - Phase 3: Make column required
   - Phase 4: Remove old column

3. **Plan de Rollback**:
   - Keep migration scripts reversible
   - Database backups before migration
   - Tested rollback procedures

---

## 🏗️ Automatización de Infraestructura

### Estructura Terraform

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

### Mejores Prácticas IaC

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

---

## 📈 Próximos Pasos de Implementación

### Fase 1: Foundation (Week 1-2)
- [x] Initialize Git repository
- [x] Create project structure
- [x] Setup GitHub repository
- [ ] Configure GitHub Actions workflows
- [ ] Create base Docker images
- [ ] Setup Docker Compose for local dev

### Fase 2: Core Services (Week 3-4)
- [ ] Implement Market Data Service
- [ ] Implement Portfolio Manager Service
- [ ] Setup PostgreSQL + TimescaleDB
- [ ] Setup Redis caching
- [ ] Create API Gateway configuration

### Fase 3: Analysis & ML (Week 5-6)
- [ ] Implement Analysis Engine Service
- [ ] Implement ML Prediction Service
- [ ] Setup MLflow for model versioning
- [ ] Create training pipeline

### Fase 4: Frontend (Week 7-8)
- [ ] Setup Electron + React
- [ ] Implement core UI components
- [ ] Integrate with backend APIs
- [ ] Add real-time data streaming

### Fase 5: DevOps & Deployment (Week 9-10)
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Configure logging (Loki)
- [ ] Implement CI/CD pipelines
- [ ] Setup staging environment
- [ ] Create deployment scripts

---

## 🛠️ Comandos Rápidos

```bash
# Setup y desarrollo
git clone <repository-url>
cd investment-app
./scripts/setup/setup-dev.sh

# Ambiente desarrollo
docker-compose up -d
docker-compose logs -f [service-name]

# Tests
pnpm test                    # Frontend
pytest                       # Backend

# Build y deploy
docker-compose build
./scripts/deployment/deploy.sh staging
```

---

**Versión del Documento**: 1.0
**Última Actualización**: Diciembre 2025
**Próxima Revisión**: 2025-12-25