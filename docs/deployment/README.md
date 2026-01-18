# TRII Platform - Deployment Guide

## Overview

This guide covers the deployment of the TRII Investment Decision Support Platform across different environments: development, staging, and production.

## Prerequisites

### System Requirements
- **Kubernetes**: 1.24+ cluster
- **Helm**: 3.8+ for package management
- **Docker**: 20.10+ for container builds
- **kubectl**: Configured for cluster access
- **ArgoCD**: 2.4+ for GitOps deployments

### Infrastructure Requirements
- **PostgreSQL**: 15+ with TimescaleDB extension
- **Redis**: 6+ for caching
- **RabbitMQ**: 3.9+ for message queuing
- **MinIO**: S3-compatible object storage (optional)

### Network Requirements
- **Ingress Controller**: NGINX or Traefik
- **TLS Certificates**: Valid certificates for HTTPS
- **DNS**: Configured domain names
- **Firewall**: Open required ports (80, 443, 22)

## Deployment Environments

### Development Environment
**Purpose**: Local development and testing
**Infrastructure**: Docker Compose or local Kubernetes (k3d, minikube)

### Staging Environment
**Purpose**: Pre-production testing and validation
**Infrastructure**: Shared Kubernetes cluster with resource limits

### Production Environment
**Purpose**: Live system serving end users
**Infrastructure**: Dedicated Kubernetes cluster with high availability

## Quick Start Deployment

### Using Docker Compose (Development)

1. **Clone the repository**:
```bash
git clone https://github.com/your-org/investment-app.git
cd investment-app
```

2. **Start infrastructure services**:
```bash
docker-compose up -d postgres redis rabbitmq
```

3. **Initialize database**:
```bash
docker exec -i trii-postgres psql -U postgres -d trii < database/init/init_db.sql
```

4. **Start microservices**:
```bash
docker-compose up -d market-data analysis-engine portfolio-manager ml-prediction
```

5. **Start desktop client**:
```bash
pnpm install
pnpm dev
```

### Using Kubernetes (Production)

1. **Install ArgoCD**:
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

2. **Deploy infrastructure base**:
```bash
kubectl apply -f infrastructure/kubernetes/base/
```

3. **Configure ArgoCD applications**:
```bash
kubectl apply -f infrastructure/argocd/
```

4. **Monitor deployment**:
```bash
kubectl get applications -n argocd
```

## Detailed Deployment Steps

### 1. Infrastructure Setup

#### PostgreSQL Deployment
```yaml
# infrastructure/kubernetes/base/postgres-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: "trii"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-data
        persistentVolumeClaim:
          claimName: postgres-pvc
```

#### Redis Deployment
```yaml
# infrastructure/kubernetes/base/redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-data
          mountPath: /data
      volumes:
      - name: redis-data
        persistentVolumeClaim:
          claimName: redis-pvc
```

#### RabbitMQ Deployment
```yaml
# infrastructure/kubernetes/base/rabbitmq-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rabbitmq
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: rabbitmq
        image: rabbitmq:3-management-alpine
        env:
        - name: RABBITMQ_DEFAULT_USER
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secret
              key: username
        - name: RABBITMQ_DEFAULT_PASS
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secret
              key: password
        ports:
        - containerPort: 5672
        - containerPort: 15672
        volumeMounts:
        - name: rabbitmq-data
          mountPath: /var/lib/rabbitmq
      volumes:
      - name: rabbitmq-data
        persistentVolumeClaim:
          claimName: rabbitmq-pvc
```

### 2. Service Deployment

#### Using Helm Charts
Each microservice has a Helm chart for deployment:

```bash
# Deploy market-data service
helm upgrade --install market-data ./infrastructure/helm/market-data \
  --namespace trii \
  --set image.tag=v1.0.0 \
  --set database.host=postgres.trii.svc.cluster.local
```

#### ArgoCD GitOps Deployment
ArgoCD applications automatically deploy from Git:

```yaml
# infrastructure/argocd/market-data-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: market-data
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/investment-app
    path: infrastructure/helm/market-data
    targetRevision: HEAD
  destination:
    server: https://kubernetes.default.svc
    namespace: trii
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### 3. Configuration Management

#### Environment Variables
```yaml
# ConfigMap for shared configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: trii-config
data:
  LOG_LEVEL: "INFO"
  TZ: "America/Bogota"
  METRICS_ENABLED: "true"
```

#### Secrets Management
```yaml
# Secret for database credentials
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
data:
  username: <base64-encoded>
  password: <base64-encoded>
```

#### Using Sealed Secrets (Production)
```yaml
# SealedSecret for encrypted secrets
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: trii-secrets
spec:
  encryptedData:
    database-password: <encrypted-password>
```

### 4. Networking Configuration

#### Ingress Configuration
```yaml
# NGINX Ingress for API Gateway
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: trii-api-gateway
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.trii-platform.com
    secretName: trii-tls
  rules:
  - host: api.trii-platform.com
    http:
      paths:
      - path: /market-data
        pathType: Prefix
        backend:
          service:
            name: market-data
            port:
              number: 80
      - path: /analysis
        pathType: Prefix
        backend:
          service:
            name: analysis-engine
            port:
              number: 80
```

#### Network Policies
```yaml
# Restrict pod-to-pod communication
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: trii-network-policy
spec:
  podSelector:
    matchLabels:
      app: market-data
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

### 5. Monitoring Setup

#### Prometheus Installation
```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace
```

#### Grafana Installation
```bash
# Install Grafana
helm install grafana stable/grafana \
  --namespace monitoring \
  --set adminPassword='admin'
```

#### Loki for Logging
```bash
# Install Loki stack
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=true
```

### 6. CI/CD Integration

#### GitHub Actions Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Configure kubectl
      uses: azure/setup-kubectl@v3
      with:
        cluster-url: ${{ secrets.K8S_CLUSTER_URL }}
        cluster-certificate: ${{ secrets.K8S_CERTIFICATE }}
    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f infrastructure/kubernetes/
```

#### ArgoCD Image Updates
Automatic image updates via CI/CD:

```yaml
# Update image tag in ArgoCD
- name: Update ArgoCD Application
  run: |
    sed -i 's/tag: ".*"/tag: "${{ github.sha }}"/' infrastructure/argocd/market-data-app.yaml
    git add infrastructure/argocd/market-data-app.yaml
    git commit -m "Update market-data image tag"
    git push
```

## Environment-Specific Configurations

### Development Environment
- **Resource limits**: Minimal CPU/memory
- **Replicas**: Single replica for all services
- **Persistence**: HostPath volumes
- **Monitoring**: Basic Prometheus setup

### Staging Environment
- **Resource limits**: Moderate CPU/memory
- **Replicas**: 2-3 replicas for critical services
- **Persistence**: SSD storage
- **Monitoring**: Full observability stack

### Production Environment
- **Resource limits**: High CPU/memory allocation
- **Replicas**: 3+ replicas with auto-scaling
- **Persistence**: High-performance SSD with backups
- **Monitoring**: Enterprise monitoring with alerting

## Scaling Configuration

### Horizontal Pod Autoscaling
```yaml
# HPA for market-data service
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: market-data-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: market-data
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Vertical Pod Autoscaling
```yaml
# VPA for resource optimization
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: market-data-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: market-data
  updatePolicy:
    updateMode: "Auto"
```

## Backup and Recovery

### Database Backup
```yaml
# PostgreSQL backup cron job
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15
            command:
            - pg_dump
            - -h
            - postgres
            - -U
            - postgres
            - trii
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
```

### Disaster Recovery
1. **Backup restoration** procedures
2. **Failover configuration** for high availability
3. **Data consistency** verification
4. **Service restoration** priority order

## Security Hardening

### Pod Security Standards
```yaml
# Security context for pods
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault
```

### Network Security
- **Service mesh** with Istio for mTLS
- **Network policies** for traffic control
- **Secrets encryption** at rest
- **RBAC** for access control

## Troubleshooting Deployment Issues

### Common Issues

#### Pod Pending
```bash
# Check pod status
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp

# Check resource availability
kubectl describe nodes
```

#### Service Unavailable
```bash
# Check service endpoints
kubectl get endpoints <service-name>

# Check service configuration
kubectl describe service <service-name>

# Test connectivity
kubectl exec -it <pod-name> -- curl <service-url>
```

#### Image Pull Errors
```bash
# Check image exists
docker pull <image-name>

# Check registry credentials
kubectl get secrets

# Check image pull policy
kubectl describe pod <pod-name>
```

### Logs and Debugging
```bash
# View pod logs
kubectl logs <pod-name> -f

# Debug container
kubectl exec -it <pod-name> -- /bin/bash

# Port forward for local access
kubectl port-forward <pod-name> 8080:80
```

## Performance Optimization

### Resource Optimization
- **Right-sizing containers** based on usage patterns
- **Resource requests and limits** configuration
- **Horizontal and vertical scaling** policies
- **Cache optimization** for improved performance

### Database Optimization
- **Connection pooling** configuration
- **Query optimization** and indexing
- **Read replicas** for high availability
- **TimescaleDB** chunk optimization

This deployment guide provides comprehensive instructions for deploying the TRII platform across different environments with production-ready configurations.