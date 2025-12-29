# TRII Platform - Microservices Quick Start Guide

## TL;DR - Get Running in 5 Minutes

```bash
# 1. Deploy all microservices
cd infrastructure/kubernetes/argocd
./scripts/deploy-microservices.sh
# Select option 1: Deploy Individual Applications

# 2. Wait 2-3 minutes for all services to start

# 3. Verify deployment
./scripts/verify-deployment.sh

# 4. Access API Gateway
curl http://localhost:30805/health
# Should return: "healthy"

# 5. Test backend services
curl http://localhost:30805/api/market-data/health
curl http://localhost:30805/api/analysis/health
curl http://localhost:30805/api/portfolio-manager/health
curl http://localhost:30805/api/predictions/health
```

---

## Manual Deployment Commands

```bash
# Deploy in correct order (respects sync waves)
kubectl apply -f applications/microservices/trii-infrastructure.yaml -n argocd
kubectl apply -f applications/microservices/trii-market-data.yaml -n argocd
kubectl apply -f applications/microservices/trii-analysis-engine.yaml -n argocd
kubectl apply -f applications/microservices/trii-ml-prediction.yaml -n argocd
kubectl apply -f applications/microservices/trii-portfolio-manager.yaml -n argocd
kubectl apply -f applications/microservices/trii-api-gateway.yaml -n argocd
```

---

## Essential Commands

### Check Status

```bash
# All applications
kubectl get applications -n argocd -l app.kubernetes.io/part-of=trii-platform

# Specific application
kubectl get application trii-api-gateway -n argocd

# All pods
kubectl get pods -n trii-dev -o wide

# Services and endpoints
kubectl get svc,endpoints -n trii-dev
```

### View Logs

```bash
# API Gateway
kubectl logs -n trii-dev -l app=api-gateway --tail=100 -f

# Market Data
kubectl logs -n trii-dev -l app=market-data --tail=100 -f

# All services
kubectl logs -n trii-dev --all-containers=true --tail=50
```

### Sync Application

```bash
# Using ArgoCD CLI
argocd app sync trii-api-gateway

# Using kubectl
kubectl patch application trii-api-gateway -n argocd \
  --type merge \
  -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{}}}'

# Sync all applications
argocd app sync -l app.kubernetes.io/part-of=trii-platform
```

### Delete All Applications

```bash
kubectl delete applications -n argocd -l app.kubernetes.io/part-of=trii-platform
```

---

## Port Forwarding

```bash
# API Gateway
kubectl port-forward -n trii-dev svc/api-gateway-service 8080:8080

# ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# PostgreSQL
kubectl port-forward -n trii-dev svc/postgres-service 5432:5432

# Redis
kubectl port-forward -n trii-dev svc/redis-service 6379:6379
```

---

## Troubleshooting One-Liners

```bash
# Check unhealthy pods
kubectl get pods -n trii-dev --field-selector=status.phase!=Running

# Restart API Gateway
kubectl rollout restart deployment api-gateway -n trii-dev

# Force application sync
argocd app sync trii-api-gateway --force

# Get application sync errors
kubectl get application trii-api-gateway -n argocd \
  -o jsonpath='{.status.conditions[?(@.type=="SyncError")].message}'

# Delete stuck application operation
kubectl patch application trii-api-gateway -n argocd \
  --type merge \
  -p '{"operation":null}'
```

---

## Deployment Order (Sync Waves)

```
0 → Infrastructure (postgres, redis, rabbitmq, minio)
1 → Market Data
2 → Analysis Engine + ML Prediction (parallel)
3 → Portfolio Manager
4 → API Gateway
```

---

## Service URLs (Inside Cluster)

```
http://postgres-service:5432
http://redis-service:6379
http://rabbitmq-service:5672
http://minio-service:9000
http://market-data-service:8001
http://analysis-engine-service:8002
http://portfolio-manager-service:8003
http://ml-prediction-service:8004
http://api-gateway-service:8080
```

---

## External Access (NodePort)

```
API Gateway: http://localhost:30805
```

---

## ArgoCD UI Access

```bash
# Get password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Port forward
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open browser
open https://localhost:8080

# Login: admin / <password-from-above>
```

---

## Common Issues

### "Application stuck in Syncing"
```bash
kubectl patch application trii-api-gateway -n argocd --type merge -p '{"operation":null}'
argocd app sync trii-api-gateway
```

### "Pods not starting"
```bash
kubectl describe pod <pod-name> -n trii-dev
kubectl logs <pod-name> -n trii-dev
```

### "Service unreachable"
```bash
kubectl get endpoints -n trii-dev
kubectl get svc -n trii-dev
```

---

## Next Steps

1. **Read Full Documentation**: `README-MICROSERVICES.md`
2. **Run Verification Script**: `./scripts/verify-deployment.sh`
3. **Access ArgoCD UI**: See "ArgoCD UI Access" above
4. **Monitor Applications**: Set up alerts and monitoring

---

**Documentation**: See `README-MICROSERVICES.md` for comprehensive details
