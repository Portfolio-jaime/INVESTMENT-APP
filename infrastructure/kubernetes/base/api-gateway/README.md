# API Gateway for TRII Platform

This directory contains Kubernetes manifests for the nginx-based API Gateway that routes requests to backend microservices.

## Architecture

The API Gateway acts as a single entry point for all API requests, routing them to the appropriate backend services:

- **Market Data Service** (`market-data-service:8001`) - `/api/market-data/*` → `/api/v1/market-data/*`
- **Analysis Engine** (`analysis-engine-service:8002`) - `/api/analysis/*` → `/api/v1/*`
- **Portfolio Manager** (`portfolio-manager-service:8003`) - `/api/portfolio-manager/*` → `/api/v1/*`
- **ML Prediction Service** (`ml-prediction-service:8004`) - `/api/predictions/*` → `/api/v1/*`

## Components

### configmap.yaml
Contains the nginx configuration with:
- Upstream service definitions
- Location-based routing rules
- CORS headers configuration
- Proxy settings and timeouts
- Health check endpoint

### deployment.yaml
Defines the API Gateway deployment with:
- 2 replicas for high availability
- Init container for proper volume permissions
- Resource limits and requests
- Liveness and readiness probes
- Security context (non-root user 101)
- emptyDir volumes for nginx cache and runtime

### service.yaml
Provides two service types:
- **ClusterIP** (`api-gateway-service:8080`) - Internal cluster access
- **NodePort** (`api-gateway-nodeport:30805`) - External local development access

### ingress.yaml
Exposes the API Gateway via nginx-ingress:
- Host: `api.trii-platform.local`
- Path: `/api` for subpath-based routing
- CORS enabled
- 50MB body size limit

## Deployment

### Manual Deployment
```bash
# Apply all manifests
kubectl apply -f infrastructure/kubernetes/base/api-gateway/

# Or use kustomize (recommended)
kubectl apply -k infrastructure/kubernetes/base/

# Verify deployment
kubectl get pods -n trii-dev -l app=api-gateway
kubectl get svc -n trii-dev -l app=api-gateway
kubectl get ingress -n trii-dev api-gateway-ingress
```

### ArgoCD Deployment
The API Gateway is included in the base kustomization and will be automatically deployed by ArgoCD when syncing the `trii-dev` application.

## Testing

### Health Check
```bash
# Via ClusterIP (from within cluster)
kubectl run test-curl --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s http://api-gateway-service:8080/health

# Expected: "healthy"
```

### API Routing Tests
```bash
# Test Market Data Service
kubectl run test-curl --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s http://api-gateway-service:8080/api/market-data/quotes/AAPL

# Test Analysis Engine
kubectl run test-curl --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s http://api-gateway-service:8080/api/analysis/indicators/sma?symbol=AAPL

# Test Portfolio Manager
kubectl run test-curl --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s http://api-gateway-service:8080/api/portfolio-manager/portfolios

# Test ML Prediction Service
kubectl run test-curl --image=curlimages/curl:latest --rm -i --restart=Never -- \
  curl -s http://api-gateway-service:8080/api/predictions/forecast?symbol=AAPL
```

### Local Access (Kind Cluster)
```bash
# Port forward to local machine
kubectl port-forward -n trii-dev svc/api-gateway-service 8080:8080

# Test from another terminal
curl http://localhost:8080/health
curl http://localhost:8080/api/market-data/quotes/AAPL
```

## Configuration Updates

To update nginx configuration:

1. Edit `configmap.yaml`
2. Apply the changes:
   ```bash
   kubectl apply -f infrastructure/kubernetes/base/api-gateway/configmap.yaml
   ```
3. Restart the deployment to pick up changes:
   ```bash
   kubectl rollout restart deployment/api-gateway -n trii-dev
   ```

## Monitoring

The API Gateway exposes Prometheus metrics at `/metrics` endpoint:
- Access logs for request tracking
- Upstream health monitoring
- Performance metrics

## Security Features

- Runs as non-root user (UID 101)
- Drops all Linux capabilities except NET_BIND_SERVICE
- Read-only root filesystem for nginx config
- CORS configured with appropriate headers
- Request timeouts to prevent resource exhaustion

## Resource Limits

- **Requests**: 64Mi memory, 100m CPU
- **Limits**: 128Mi memory, 200m CPU

Adjust these based on traffic patterns and monitoring data.

## Troubleshooting

### Pods CrashLoopBackOff
- Check logs: `kubectl logs -n trii-dev -l app=api-gateway`
- Common issue: Permission denied for cache directories (fixed by init container)

### 404 Errors
- Verify backend service is running and accessible
- Check nginx config in ConfigMap
- Test backend service directly
- Review nginx access logs

### Connection Refused
- Verify service endpoints: `kubectl get endpoints -n trii-dev`
- Check pod readiness: `kubectl get pods -n trii-dev -l app=api-gateway`
- Verify service selector matches pod labels
