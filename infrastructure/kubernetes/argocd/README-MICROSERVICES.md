# TRII Platform - Microservices ArgoCD Deployment

## Overview

This directory contains the ArgoCD application manifests for deploying the TRII Investment Platform as separate, independently manageable microservices. Each microservice has its own ArgoCD Application, enabling:

- **Independent Deployment**: Deploy, update, or rollback individual services
- **Controlled Startup Order**: Sync waves ensure proper dependency resolution
- **Granular Monitoring**: Track health and sync status per service
- **Scalable Architecture**: Add new services without affecting existing ones
- **Production-Ready**: Proper health checks, sync policies, and rollback capabilities

## Architecture

### Microservices Separation

The platform is split into **6 independent ArgoCD Applications**:

#### 1. **trii-infrastructure** (Wave 0)
**Purpose**: Core infrastructure services that all microservices depend on

**Components**:
- PostgreSQL (TimescaleDB) - Time-series database
- Redis - Caching and session storage
- RabbitMQ - Message broker
- MinIO - S3-compatible object storage

**Characteristics**:
- StatefulSet deployments with persistent storage
- Sync Wave 0 - Deploys first
- Slower rollout strategy for data safety

#### 2. **trii-market-data** (Wave 1)
**Purpose**: Real-time market data ingestion and processing

**Components**:
- Market Data Service (FastAPI on port 8001)

**Dependencies**:
- PostgreSQL (for data persistence)
- Redis (for caching)

**Characteristics**:
- Core service that other services depend on
- Sync Wave 1 - Deploys after infrastructure
- Exposes REST API for market data access

#### 3. **trii-analysis-engine** (Wave 2)
**Purpose**: Technical analysis and indicator calculations

**Components**:
- Analysis Engine Service (FastAPI on port 8002)

**Dependencies**:
- Market Data Service
- PostgreSQL
- Redis

**Characteristics**:
- Sync Wave 2 - Deploys after market-data
- CPU-intensive workload

#### 4. **trii-ml-prediction** (Wave 2)
**Purpose**: Machine learning predictions and forecasting

**Components**:
- ML Prediction Service (FastAPI on port 8004)

**Dependencies**:
- Market Data Service
- Analysis Engine
- PostgreSQL

**Characteristics**:
- Sync Wave 2 - Parallel with analysis-engine
- Resource-intensive (ML models)
- Longer timeout configurations

#### 5. **trii-portfolio-manager** (Wave 3)
**Purpose**: Portfolio management and business logic

**Components**:
- Portfolio Manager Service (NestJS on port 8003)

**Dependencies**:
- Market Data Service
- PostgreSQL

**Characteristics**:
- Sync Wave 3 - Business logic layer
- Node.js-based service

#### 6. **trii-api-gateway** (Wave 4)
**Purpose**: API Gateway and routing layer

**Components**:
- API Gateway (Nginx on port 8080)

**Dependencies**:
- All backend services (market-data, analysis-engine, ml-prediction, portfolio-manager)

**Characteristics**:
- Sync Wave 4 - Deploys last
- Single entry point for all API requests
- Handles CORS, routing, and load balancing

---

## Sync Wave Strategy

Sync waves control the deployment order:

```
Wave 0: Infrastructure (postgres, redis, rabbitmq, minio)
   ↓
Wave 1: Core Services (market-data)
   ↓
Wave 2: Analysis Services (analysis-engine, ml-prediction) [Parallel]
   ↓
Wave 3: Business Logic (portfolio-manager)
   ↓
Wave 4: Gateway (api-gateway)
```

**Benefits**:
- Infrastructure is ready before services start
- Services start only when dependencies are healthy
- Gateway starts last to ensure all backends are available

---

## Directory Structure

```
infrastructure/kubernetes/argocd/
├── applications/
│   └── microservices/
│       ├── trii-infrastructure.yaml      # Wave 0
│       ├── trii-market-data.yaml         # Wave 1
│       ├── trii-analysis-engine.yaml     # Wave 2
│       ├── trii-ml-prediction.yaml       # Wave 2
│       ├── trii-portfolio-manager.yaml   # Wave 3
│       └── trii-api-gateway.yaml         # Wave 4
├── applicationsets/
│   └── trii-microservices-appset.yaml    # ApplicationSet (optional)
├── scripts/
│   ├── deploy-microservices.sh           # Interactive deployment tool
│   └── verify-deployment.sh              # Verification and testing
└── README-MICROSERVICES.md               # This file
```

---

## Deployment Methods

### Method 1: Individual Applications (Recommended)

Deploy each service as a separate ArgoCD Application:

```bash
# Interactive deployment
./scripts/deploy-microservices.sh

# Or manually apply each application
kubectl apply -f applications/microservices/trii-infrastructure.yaml -n argocd
kubectl apply -f applications/microservices/trii-market-data.yaml -n argocd
kubectl apply -f applications/microservices/trii-analysis-engine.yaml -n argocd
kubectl apply -f applications/microservices/trii-ml-prediction.yaml -n argocd
kubectl apply -f applications/microservices/trii-portfolio-manager.yaml -n argocd
kubectl apply -f applications/microservices/trii-api-gateway.yaml -n argocd
```

**Pros**:
- Full control over each service
- Clear separation and visibility
- Easy to troubleshoot individual services

### Method 2: ApplicationSet (All at Once)

Deploy all services using a single ApplicationSet:

```bash
kubectl apply -f applicationsets/trii-microservices-appset.yaml -n argocd
```

**Pros**:
- Single resource manages all applications
- Easier to add new services (just update the list)
- Centralized configuration

**Cons**:
- Less granular control
- All applications share the same template

---

## Verification and Testing

### Quick Status Check

```bash
# Run verification script
./scripts/verify-deployment.sh
```

### Manual Verification

#### 1. Check ArgoCD Applications

```bash
kubectl get applications -n argocd -l app.kubernetes.io/part-of=trii-platform
```

Expected output:
```
NAME                      SYNC STATUS   HEALTH STATUS   SYNC WAVE
trii-infrastructure       Synced        Healthy         0
trii-market-data          Synced        Healthy         1
trii-analysis-engine      Synced        Healthy         2
trii-ml-prediction        Synced        Healthy         2
trii-portfolio-manager    Synced        Healthy         3
trii-api-gateway          Synced        Healthy         4
```

#### 2. Check Pod Status

```bash
kubectl get pods -n trii-dev -o wide
```

All pods should be in `Running` state.

#### 3. Test API Gateway

```bash
# Get NodePort
kubectl get svc api-gateway-nodeport -n trii-dev

# Test health endpoint
curl http://localhost:30805/health

# Expected: "healthy"
```

#### 4. Test Backend Services Through Gateway

```bash
# Test market-data service
curl http://localhost:30805/api/market-data/health

# Test analysis service
curl http://localhost:30805/api/analysis/health

# Test portfolio-manager service
curl http://localhost:30805/api/portfolio-manager/health

# Test ML prediction service
curl http://localhost:30805/api/predictions/health
```

---

## Common Operations

### Deploy Specific Service

```bash
# Using the deployment script
./scripts/deploy-microservices.sh
# Select option 4: Deploy Specific Service

# Or manually
kubectl apply -f applications/microservices/trii-api-gateway.yaml -n argocd
```

### Sync Application Manually

```bash
# Using ArgoCD CLI
argocd app sync trii-api-gateway

# Using kubectl
kubectl patch application trii-api-gateway -n argocd \
  --type merge \
  -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{}}}'
```

### View Application Details

```bash
# ArgoCD CLI
argocd app get trii-api-gateway

# Kubectl
kubectl get application trii-api-gateway -n argocd -o yaml
```

### Rollback Application

```bash
# ArgoCD CLI - rollback to previous version
argocd app rollback trii-api-gateway

# Kubectl - change target revision
kubectl patch application trii-api-gateway -n argocd \
  --type merge \
  -p '{"spec":{"source":{"targetRevision":"<previous-commit-sha>"}}}'
```

### Delete Specific Application

```bash
# This will delete the ArgoCD Application but NOT the K8s resources
kubectl delete application trii-api-gateway -n argocd

# To delete both Application and resources
kubectl patch application trii-api-gateway -n argocd \
  -p '{"metadata":{"finalizers":["resources-finalizer.argocd.argoproj.io"]}}' \
  --type merge
kubectl delete application trii-api-gateway -n argocd
```

### Scale Individual Service

```bash
# Scale deployment
kubectl scale deployment api-gateway -n trii-dev --replicas=3

# Note: If selfHeal is enabled, ArgoCD will revert to Git state
```

---

## Monitoring and Troubleshooting

### View Application Sync Status

```bash
kubectl get applications -n argocd \
  -o custom-columns=\
NAME:.metadata.name,\
SYNC:.status.sync.status,\
HEALTH:.status.health.status,\
WAVE:.metadata.annotations.argocd\\.argoproj\\.io/sync-wave
```

### View Application Events

```bash
kubectl describe application trii-api-gateway -n argocd
```

### View Service Logs

```bash
# API Gateway logs
kubectl logs -n trii-dev -l app=api-gateway --tail=100 -f

# Market Data logs
kubectl logs -n trii-dev -l app=market-data --tail=100 -f

# All service logs
kubectl logs -n trii-dev --all-containers=true --tail=100 -f
```

### Debug Failed Sync

```bash
# Check application status
argocd app get trii-api-gateway

# View sync operation details
kubectl get application trii-api-gateway -n argocd \
  -o jsonpath='{.status.operationState.message}'

# Force refresh
argocd app get trii-api-gateway --refresh
```

### Check Service Endpoints

```bash
kubectl get endpoints -n trii-dev
```

---

## Configuration

### Modify Sync Policy

Edit the Application manifest and apply:

```yaml
syncPolicy:
  automated:
    prune: true          # Auto-delete resources not in Git
    selfHeal: true       # Auto-sync when drift detected
    allowEmpty: false    # Prevent deletion of all resources
  syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    - ApplyOutOfSyncOnly=true
```

### Change Target Revision

```bash
kubectl patch application trii-api-gateway -n argocd \
  --type merge \
  -p '{"spec":{"source":{"targetRevision":"feature/new-api"}}}'
```

### Disable Auto-Sync Temporarily

```bash
kubectl patch application trii-api-gateway -n argocd \
  --type merge \
  -p '{"spec":{"syncPolicy":{"automated":null}}}'
```

---

## Benefits of Microservices Separation

### 1. **Independent Deployment**
- Deploy updates to API Gateway without affecting backend services
- Rollback individual services without full platform rollback

### 2. **Granular Control**
- Different sync policies per service
- Service-specific resource limits and scaling
- Targeted monitoring and alerting

### 3. **Improved Reliability**
- Failures isolated to specific services
- Infrastructure updates don't require app restarts
- Progressive rollouts possible

### 4. **Better Developer Experience**
- Clear ownership boundaries
- Faster iteration on individual services
- Easier debugging and troubleshooting

### 5. **Production Readiness**
- Proper dependency management via sync waves
- Health checks at application level
- Automated sync and self-healing

### 6. **Scalability**
- Add new services without touching existing ones
- Scale services independently
- Easy to implement canary deployments per service

---

## Migration from Monolithic Application

If migrating from the previous monolithic `trii-platform` application:

### Step 1: Deploy New Microservices Applications

```bash
./scripts/deploy-microservices.sh
# Select option 1: Deploy Individual Applications
```

### Step 2: Verify All Services Are Healthy

```bash
./scripts/verify-deployment.sh
```

### Step 3: Delete Old Monolithic Application

```bash
kubectl delete application trii-platform -n argocd
```

### Step 4: Cleanup Old ApplicationSet (if exists)

```bash
kubectl delete applicationset trii-platform -n argocd
```

---

## ArgoCD UI Access

```bash
# Port-forward to ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Open browser
open https://localhost:8080
```

In the UI, you'll see:
- 6 separate applications (one per microservice)
- Health and sync status for each
- Dependency tree visualization
- Resource view per application

---

## Best Practices

### 1. **Always Use Sync Waves**
Ensure proper startup order by using sync wave annotations.

### 2. **Enable Auto-Sync with Caution**
- Use auto-sync for dev/staging environments
- Use manual sync for production
- Always test in staging first

### 3. **Monitor Application Health**
- Set up alerts for unhealthy applications
- Use ArgoCD notifications (Slack, email)
- Monitor sync failures

### 4. **Use Finalizers**
Ensure proper cleanup with `resources-finalizer.argocd.argoproj.io`.

### 5. **Version Control Everything**
All ArgoCD Application manifests should be in Git.

### 6. **Test Rollbacks**
Regularly test rollback procedures in staging.

### 7. **Document Dependencies**
Keep this README updated with service dependencies.

---

## Troubleshooting

### Application Stuck in Syncing State

```bash
# Delete the operation
kubectl patch application trii-api-gateway -n argocd \
  --type merge \
  -p '{"operation":null}'

# Trigger a new sync
argocd app sync trii-api-gateway
```

### Sync Wave Not Respected

Check that annotations are properly set in the kustomization files:

```yaml
commonAnnotations:
  argocd.argoproj.io/sync-wave: "4"
```

### Service Not Healthy

```bash
# Check pod status
kubectl get pods -n trii-dev -l app=api-gateway

# Check pod events
kubectl describe pod <pod-name> -n trii-dev

# Check logs
kubectl logs <pod-name> -n trii-dev
```

### API Gateway Can't Reach Backend

```bash
# Test from gateway pod
kubectl exec -n trii-dev <gateway-pod> -- \
  wget -O- http://market-data-service:8001/health

# Check service endpoints
kubectl get endpoints -n trii-dev
```

---

## Additional Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Sync Waves and Phases](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/)
- [ApplicationSets](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/)
- [Project README](/README.md)
- [Kubernetes Migration Plan](/PLAN_MIGRACION_KUBERNETES.md)

---

## Contact

For questions or issues with the ArgoCD microservices deployment:

- Check existing ArgoCD Applications: `kubectl get applications -n argocd`
- Review pod logs: `kubectl logs -n trii-dev -l <service-label>`
- Run verification script: `./scripts/verify-deployment.sh`

---

**Last Updated**: December 29, 2025
**Maintainer**: TRII Platform DevOps Team
