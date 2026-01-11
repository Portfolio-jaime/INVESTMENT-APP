# Guía de Deployment - TRII Platform

## 🚢 Estrategia de Deployment

La plataforma TRII utiliza una estrategia de deployment moderna basada en contenedores, Kubernetes y GitOps con ArgoCD.

### 🏗️ Arquitectura de Deployment

```mermaid
graph TB
    subgraph "🔧 Development"
        DEV[Developer]
        LOCAL[Local Environment]
        DOCKER[Docker Compose]
    end

    subgraph "🔄 CI/CD Pipeline"
        GIT[Git Repository]
        GITHUB[GitHub Actions]
        REGISTRY[Container Registry]
        ARGOCD[ArgoCD]
    end

    subgraph "🌍 Environments"
        STAGING[Staging Cluster]
        PROD[Production Cluster]
    end

    subgraph "☁️ Infrastructure"
        K8S[Kubernetes]
        HELM[Helm Charts]
        INGRESS[Ingress Controller]
        MONITORING[Monitoring Stack]
    end

    DEV --> LOCAL
    LOCAL --> DOCKER
    DEV --> GIT
    GIT --> GITHUB
    GITHUB --> REGISTRY
    GITHUB --> ARGOCD
    ARGOCD --> STAGING
    ARGOCD --> PROD
    STAGING --> K8S
    PROD --> K8S
    K8S --> HELM
    K8S --> INGRESS
    K8S --> MONITORING
```

## 🐳 Containerización

### 📦 Docker Images Strategy

Cada microservicio tiene su propio Dockerfile optimizado para producción:

#### 🐍 Python Services (FastAPI)

```dockerfile
# backend/market-data/Dockerfile
FROM python:3.11-slim AS builder

# Install poetry
RUN pip install poetry

# Set poetry config
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=1 \
    POETRY_CACHE_DIR=/opt/poetry-cache

# Copy dependency files
WORKDIR /app
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --without dev && rm -rf $POETRY_CACHE_DIR

# Production stage
FROM python:3.11-slim AS runtime

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder stage
COPY --from=builder /app/.venv /app/.venv

# Make sure scripts in .venv are usable
ENV PATH="/app/.venv/bin:$PATH"

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Copy application code
WORKDIR /app
COPY --chown=app:app . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application with gunicorn
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
```

#### 🌐 Node.js Services

```dockerfile
# backend/gateway/Dockerfile
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS runtime

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]
```

#### ⚛️ Frontend (React)

```dockerfile
# app/frontend/Dockerfile
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage with nginx
FROM nginx:alpine AS runtime

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:80/health || exit 1' > /health-check.sh \
    && chmod +x /health-check.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /health-check.sh

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 🔨 Multi-stage Build Optimization

```yaml
# .dockerignore
node_modules
npm-debug.log*
.git
.gitignore
README.md
Dockerfile
.dockerignore
coverage
.coverage
.pytest_cache
__pycache__
*.pyc
.env.local
.env.development
.DS_Store
tests
docs
*.md
```

## ☸️ Kubernetes Deployment

### 🎛️ Namespace Strategy

```yaml
# infrastructure/k8s-manifests/namespaces/namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: trii-platform
  labels:
    app.kubernetes.io/name: trii-platform
    app.kubernetes.io/version: v2.0.0
    environment: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: trii-staging
  labels:
    app.kubernetes.io/name: trii-platform
    app.kubernetes.io/version: v2.0.0
    environment: staging
---
apiVersion: v1
kind: Namespace
metadata:
  name: trii-monitoring
  labels:
    app.kubernetes.io/name: monitoring
    app.kubernetes.io/version: v1.0.0
```

### 📊 Deployment Manifests

#### 🔄 Market Data Service

```yaml
# infrastructure/k8s-manifests/services/market-data.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-data-service
  namespace: trii-platform
  labels:
    app.kubernetes.io/name: market-data-service
    app.kubernetes.io/version: v2.1.0
    app.kubernetes.io/component: backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: market-data-service
  template:
    metadata:
      labels:
        app.kubernetes.io/name: market-data-service
        app.kubernetes.io/version: v2.1.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: market-data
        image: trii/market-data-service:v2.1.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8000
          name: http
          protocol: TCP
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        - name: LOG_LEVEL
          value: "INFO"
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app.kubernetes.io/name
                  operator: In
                  values:
                  - market-data-service
              topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: market-data-service
  namespace: trii-platform
  labels:
    app.kubernetes.io/name: market-data-service
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8000"
spec:
  type: ClusterIP
  ports:
  - port: 8000
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app.kubernetes.io/name: market-data-service
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: market-data-service
  namespace: trii-platform
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/use-regex: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.trii.co
    secretName: api-tls
  rules:
  - host: api.trii.co
    http:
      paths:
      - path: /market-data(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: market-data-service
            port:
              number: 8000
```

### 🔄 HorizontalPodAutoscaler

```yaml
# infrastructure/k8s-manifests/hpa/market-data-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: market-data-service-hpa
  namespace: trii-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: market-data-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

## 📊 Helm Charts

### 📋 Chart Structure

```
infrastructure/helm/trii-platform/
├── Chart.yaml
├── values.yaml
├── values-staging.yaml
├── values-production.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── serviceaccount.yaml
└── charts/
    ├── postgresql/
    ├── redis/
    └── monitoring/
```

#### 📄 Chart.yaml

```yaml
# infrastructure/helm/trii-platform/Chart.yaml
apiVersion: v2
name: trii-platform
description: A Helm chart for TRII Investment Platform
type: application
version: 2.1.0
appVersion: "2.1.0"

dependencies:
- name: postgresql
  version: "12.0.0"
  repository: "https://charts.bitnami.com/bitnami"
  condition: postgresql.enabled
- name: redis
  version: "17.0.0"
  repository: "https://charts.bitnami.com/bitnami"
  condition: redis.enabled
- name: prometheus
  version: "15.0.0"
  repository: "https://prometheus-community.github.io/helm-charts"
  condition: monitoring.prometheus.enabled
- name: grafana
  version: "6.0.0"
  repository: "https://grafana.github.io/helm-charts"
  condition: monitoring.grafana.enabled

maintainers:
- name: TRII Development Team
  email: dev-team@trii.co
- name: DevOps Team
  email: devops@trii.co

keywords:
- fintech
- investment
- trading
- portfolio management
- machine learning

home: https://trii.co
sources:
- https://github.com/trii-platform/trii-platform
```

#### ⚙️ Values.yaml

```yaml
# infrastructure/helm/trii-platform/values.yaml
global:
  imageRegistry: "trii-registry.azurecr.io"
  imagePullSecrets:
    - name: azure-registry-secret
  environment: production
  domain: trii.co

# Application Configuration
app:
  name: trii-platform
  version: v2.1.0
  
# Service Configuration
services:
  marketData:
    enabled: true
    name: market-data-service
    image:
      repository: trii/market-data-service
      tag: v2.1.0
      pullPolicy: IfNotPresent
    replicaCount: 3
    resources:
      requests:
        memory: 256Mi
        cpu: 200m
      limits:
        memory: 512Mi
        cpu: 500m
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70
      targetMemoryUtilizationPercentage: 80
    service:
      type: ClusterIP
      port: 8000
    ingress:
      enabled: true
      path: /market-data
      annotations:
        nginx.ingress.kubernetes.io/rewrite-target: /$2
        nginx.ingress.kubernetes.io/use-regex: "true"

  mlPrediction:
    enabled: true
    name: ml-prediction-service
    image:
      repository: trii/ml-prediction-service
      tag: v2.1.0
      pullPolicy: IfNotPresent
    replicaCount: 2
    resources:
      requests:
        memory: 512Mi
        cpu: 500m
      limits:
        memory: 2Gi
        cpu: 1000m
    service:
      type: ClusterIP
      port: 8000

  portfolioManager:
    enabled: true
    name: portfolio-manager-service
    image:
      repository: trii/portfolio-manager-service
      tag: v2.1.0
      pullPolicy: IfNotPresent
    replicaCount: 3
    resources:
      requests:
        memory: 256Mi
        cpu: 200m
      limits:
        memory: 512Mi
        cpu: 500m

  gateway:
    enabled: true
    name: api-gateway
    image:
      repository: trii/api-gateway
      tag: v2.1.0
      pullPolicy: IfNotPresent
    replicaCount: 2
    service:
      type: ClusterIP
      port: 3000
    ingress:
      enabled: true
      path: /api
      annotations:
        nginx.ingress.kubernetes.io/rate-limit: "100"

  frontend:
    enabled: true
    name: frontend-app
    image:
      repository: trii/frontend-app
      tag: v2.1.0
      pullPolicy: IfNotPresent
    replicaCount: 2
    service:
      type: ClusterIP
      port: 80
    ingress:
      enabled: true
      path: /
      annotations:
        nginx.ingress.kubernetes.io/ssl-redirect: "true"

# Database Configuration
postgresql:
  enabled: true
  auth:
    existingSecret: database-credentials
    secretKeys:
      adminPasswordKey: postgres-password
      userPasswordKey: password
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: premium-ssd
    resources:
      requests:
        memory: 2Gi
        cpu: 1000m
      limits:
        memory: 4Gi
        cpu: 2000m
    pgHBAConfiguration: |
      host all all 0.0.0.0/0 md5
      host replication all 0.0.0.0/0 md5

# Cache Configuration  
redis:
  enabled: true
  auth:
    existingSecret: redis-credentials
    existingSecretPasswordKey: password
  master:
    persistence:
      enabled: true
      size: 20Gi
    resources:
      requests:
        memory: 512Mi
        cpu: 250m
      limits:
        memory: 1Gi
        cpu: 500m

# Monitoring Configuration
monitoring:
  prometheus:
    enabled: true
    server:
      persistentVolume:
        size: 50Gi
        storageClass: premium-ssd
  
  grafana:
    enabled: true
    persistence:
      enabled: true
      size: 10Gi
    adminPassword: 
      valueFrom:
        secretKeyRef:
          name: grafana-credentials
          key: admin-password

# Ingress Configuration
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
  hosts:
    - host: trii.co
      paths:
        - path: /
          pathType: Prefix
          service: frontend-app
    - host: api.trii.co
      paths:
        - path: /
          pathType: Prefix
          service: api-gateway
  tls:
    - secretName: trii-tls
      hosts:
        - trii.co
        - api.trii.co

# Security
networkPolicy:
  enabled: true
  
podSecurityPolicy:
  enabled: true

serviceAccount:
  create: true
  annotations: {}
  name: ""

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

# Resource Quotas
resourceQuota:
  enabled: true
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "10"
```

## 🔄 GitOps con ArgoCD

### 📊 ArgoCD Application

```yaml
# infrastructure/argocd/applications/trii-platform.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: trii-platform
  namespace: argocd
  labels:
    app.kubernetes.io/name: trii-platform
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: trii
  source:
    repoURL: https://github.com/trii-platform/trii-platform.git
    targetRevision: main
    path: infrastructure/helm/trii-platform
    helm:
      valueFiles:
        - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: trii-platform
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
  ignoreDifferences:
  - group: apps
    kind: Deployment
    managedFieldsManagers:
    - kube-controller-manager
```

### 🎯 ArgoCD Project

```yaml
# infrastructure/argocd/projects/trii-project.yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: trii
  namespace: argocd
spec:
  description: TRII Platform Project
  
  sourceRepos:
  - 'https://github.com/trii-platform/*'
  - 'https://charts.bitnami.com/bitnami'
  - 'https://prometheus-community.github.io/helm-charts'
  - 'https://grafana.github.io/helm-charts'
  
  destinations:
  - namespace: 'trii-*'
    server: https://kubernetes.default.svc
  - namespace: trii-monitoring
    server: https://kubernetes.default.svc
    
  clusterResourceWhitelist:
  - group: ''
    kind: Namespace
  - group: rbac.authorization.k8s.io
    kind: ClusterRole
  - group: rbac.authorization.k8s.io
    kind: ClusterRoleBinding
    
  namespaceResourceWhitelist:
  - group: ''
    kind: Service
  - group: ''
    kind: ConfigMap
  - group: ''
    kind: Secret
  - group: apps
    kind: Deployment
  - group: networking.k8s.io
    kind: Ingress
    
  roles:
  - name: read-only
    description: Read-only privileges to trii project
    policies:
    - p, proj:trii:read-only, applications, get, trii/*, allow
    - p, proj:trii:read-only, applications, sync, trii/*, deny
    groups:
    - trii:developers
    
  - name: admin
    description: Admin privileges to trii project
    policies:
    - p, proj:trii:admin, applications, *, trii/*, allow
    - p, proj:trii:admin, repositories, *, *, allow
    groups:
    - trii:admins
```

## 🚀 CI/CD Pipeline

### 🔧 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: trii-registry.azurecr.io
  CLUSTER_NAME: trii-production
  RESOURCE_GROUP: trii-platform-rg

jobs:
  # Testing Jobs
  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'pnpm'
        
    - name: Install pnpm
      run: npm install -g pnpm
      
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      
    - name: Type check
      run: pnpm run type-check
      
    - name: Lint
      run: pnpm run lint
      
    - name: Unit tests
      run: pnpm run test:unit
      
    - name: E2E tests
      run: pnpm run test:e2e
      
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: frontend-test-results
        path: |
          coverage/
          test-results/

  test-backend:
    name: Test Backend Services
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    strategy:
      matrix:
        service: [market-data, ml-prediction, portfolio-manager, analysis-engine]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        
    - name: Install Poetry
      run: |
        curl -sSL https://install.python-poetry.org | python3 -
        echo "$HOME/.local/bin" >> $GITHUB_PATH
        
    - name: Configure Poetry
      run: |
        cd backend/${{ matrix.service }}
        poetry config virtualenvs.create false
        
    - name: Install dependencies
      run: |
        cd backend/${{ matrix.service }}
        poetry install
        
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test
        REDIS_URL: redis://localhost:6379
      run: |
        cd backend/${{ matrix.service }}
        poetry run pytest -v --cov=app --cov-report=xml
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: backend/${{ matrix.service }}/coverage.xml
        flags: ${{ matrix.service }}

  # Security Scanning
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
        
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  # Build and Push Images
  build-images:
    name: Build and Push Images
    needs: [test-frontend, test-backend, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    strategy:
      matrix:
        service: 
          - name: frontend
            context: app/frontend
          - name: gateway
            context: backend/gateway
          - name: market-data
            context: backend/market-data
          - name: ml-prediction
            context: backend/ml-prediction
          - name: portfolio-manager
            context: backend/portfolio-manager
          - name: analysis-engine
            context: backend/analysis-engine
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
      
    - name: Login to Azure Container Registry
      uses: azure/docker-login@v1
      with:
        login-server: ${{ env.REGISTRY }}
        username: ${{ secrets.AZURE_CLIENT_ID }}
        password: ${{ secrets.AZURE_CLIENT_SECRET }}
        
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/trii/${{ matrix.service.name }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
          
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: ${{ matrix.service.context }}
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        platforms: linux/amd64,linux/arm64

  # Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    needs: build-images
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
        
    - name: Get AKS credentials
      run: |
        az aks get-credentials \
          --resource-group ${{ env.RESOURCE_GROUP }}-staging \
          --name ${{ env.CLUSTER_NAME }}-staging
          
    - name: Deploy with Helm
      run: |
        helm upgrade --install trii-platform \
          infrastructure/helm/trii-platform \
          --namespace trii-staging \
          --create-namespace \
          --values infrastructure/helm/trii-platform/values-staging.yaml \
          --set global.imageTag=${{ github.sha }} \
          --wait --timeout=10m
          
    - name: Run smoke tests
      run: |
        kubectl wait --for=condition=ready pod \
          -l app.kubernetes.io/instance=trii-platform \
          -n trii-staging \
          --timeout=300s
        ./scripts/smoke-tests.sh staging

  # Deploy to Production
  deploy-production:
    name: Deploy to Production
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
        
    - name: Get AKS credentials
      run: |
        az aks get-credentials \
          --resource-group ${{ env.RESOURCE_GROUP }} \
          --name ${{ env.CLUSTER_NAME }}
          
    - name: Update ArgoCD Application
      run: |
        # Update image tags in ArgoCD application
        yq eval '.spec.source.helm.parameters = [
          {"name": "global.imageTag", "value": "'${{ github.sha }}'"},
          {"name": "global.environment", "value": "production"}
        ]' -i infrastructure/argocd/applications/trii-platform.yaml
        
        # Commit and push changes
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add infrastructure/argocd/applications/trii-platform.yaml
        git commit -m "Update production deployment to ${{ github.sha }}"
        git push
        
    - name: Wait for ArgoCD sync
      run: |
        # Wait for ArgoCD to sync the changes
        timeout 600 bash -c 'until kubectl get application trii-platform -n argocd -o jsonpath="{.status.sync.status}" | grep -q "Synced"; do sleep 10; done'
        
    - name: Verify deployment
      run: |
        kubectl wait --for=condition=ready pod \
          -l app.kubernetes.io/instance=trii-platform \
          -n trii-platform \
          --timeout=600s
        ./scripts/deployment-verification.sh production

  # Performance Tests
  performance-test:
    name: Performance Tests
    needs: deploy-staging
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup K6
      run: |
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
        
    - name: Run load tests
      run: |
        k6 run tests/performance/load-test.js \
          --env BASE_URL=https://staging-api.trii.co \
          --out json=performance-results.json
          
    - name: Upload performance results
      uses: actions/upload-artifact@v4
      with:
        name: performance-results
        path: performance-results.json
```

## 🔒 Secrets Management

### 🔐 Azure Key Vault Integration

```yaml
# infrastructure/k8s-manifests/secrets/key-vault-csi.yaml
apiVersion: v1
kind: SecretProviderClass
metadata:
  name: trii-secrets
  namespace: trii-platform
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: "client-id-of-managed-identity"
    keyvaultName: "trii-platform-kv"
    objects: |
      array:
        - |
          objectName: database-url
          objectType: secret
          objectVersion: ""
        - |
          objectName: redis-url
          objectType: secret
          objectVersion: ""
        - |
          objectName: jwt-secret
          objectType: secret
          objectVersion: ""
        - |
          objectName: binance-api-key
          objectType: secret
          objectVersion: ""
    tenantId: "azure-tenant-id"
  secretObjects:
  - secretName: database-credentials
    type: Opaque
    data:
    - objectName: database-url
      key: url
  - secretName: redis-credentials
    type: Opaque
    data:
    - objectName: redis-url
      key: url
  - secretName: jwt-credentials
    type: Opaque
    data:
    - objectName: jwt-secret
      key: secret
```

## 📊 Blue-Green Deployment

### 🔄 Blue-Green Strategy

```yaml
# infrastructure/k8s-manifests/deployments/blue-green-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: market-data-service-active
  namespace: trii-platform
  labels:
    app.kubernetes.io/name: market-data-service
spec:
  selector:
    app.kubernetes.io/name: market-data-service
    version: blue  # This will be switched between blue and green
  ports:
  - port: 8000
    targetPort: 8000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-data-service-blue
  namespace: trii-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: market-data-service
      version: blue
  template:
    metadata:
      labels:
        app.kubernetes.io/name: market-data-service
        version: blue
    spec:
      containers:
      - name: market-data
        image: trii/market-data-service:v2.1.0
        ports:
        - containerPort: 8000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-data-service-green
  namespace: trii-platform
spec:
  replicas: 0  # Initially scaled to 0
  selector:
    matchLabels:
      app.kubernetes.io/name: market-data-service
      version: green
  template:
    metadata:
      labels:
        app.kubernetes.io/name: market-data-service
        version: green
    spec:
      containers:
      - name: market-data
        image: trii/market-data-service:v2.2.0  # New version
        ports:
        - containerPort: 8000
```

### 🔄 Deployment Script

```bash
#!/bin/bash
# scripts/deployment/blue-green-deploy.sh

set -e

SERVICE_NAME="market-data-service"
NAMESPACE="trii-platform"
NEW_VERSION=$1

if [[ -z "$NEW_VERSION" ]]; then
    echo "Usage: $0 <new-version>"
    exit 1
fi

echo "🚀 Starting blue-green deployment for $SERVICE_NAME:$NEW_VERSION"

# Get current active version
CURRENT_VERSION=$(kubectl get service ${SERVICE_NAME}-active -n $NAMESPACE -o jsonpath='{.spec.selector.version}')
echo "📊 Current active version: $CURRENT_VERSION"

# Determine inactive version
if [[ "$CURRENT_VERSION" == "blue" ]]; then
    INACTIVE_VERSION="green"
else
    INACTIVE_VERSION="blue"
fi

echo "📦 Deploying to $INACTIVE_VERSION environment"

# Update inactive deployment with new image
kubectl set image deployment/${SERVICE_NAME}-${INACTIVE_VERSION} \
    -n $NAMESPACE \
    ${SERVICE_NAME}=${REGISTRY}/trii/${SERVICE_NAME}:${NEW_VERSION}

# Scale up inactive deployment
kubectl scale deployment ${SERVICE_NAME}-${INACTIVE_VERSION} \
    -n $NAMESPACE \
    --replicas=3

# Wait for deployment to be ready
echo "⏳ Waiting for $INACTIVE_VERSION deployment to be ready..."
kubectl rollout status deployment/${SERVICE_NAME}-${INACTIVE_VERSION} \
    -n $NAMESPACE \
    --timeout=300s

# Run health checks
echo "🔍 Running health checks..."
INACTIVE_PODS=$(kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=${SERVICE_NAME},version=${INACTIVE_VERSION} -o jsonpath='{.items[*].status.podIP}')

for POD_IP in $INACTIVE_PODS; do
    if ! curl -f http://${POD_IP}:8000/health --max-time 10; then
        echo "❌ Health check failed for pod $POD_IP"
        echo "🔄 Rolling back..."
        kubectl scale deployment ${SERVICE_NAME}-${INACTIVE_VERSION} -n $NAMESPACE --replicas=0
        exit 1
    fi
done

echo "✅ All health checks passed"

# Switch traffic to new version
echo "🔄 Switching traffic to $INACTIVE_VERSION"
kubectl patch service ${SERVICE_NAME}-active \
    -n $NAMESPACE \
    -p '{"spec":{"selector":{"version":"'${INACTIVE_VERSION}'"}}}'

# Wait a moment for traffic to switch
sleep 10

# Run production smoke tests
echo "🧪 Running production smoke tests..."
if ! ./scripts/smoke-tests.sh production; then
    echo "❌ Smoke tests failed, rolling back..."
    # Revert traffic
    kubectl patch service ${SERVICE_NAME}-active \
        -n $NAMESPACE \
        -p '{"spec":{"selector":{"version":"'${CURRENT_VERSION}'"}}}'
    exit 1
fi

echo "✅ Smoke tests passed"

# Scale down old version
echo "📉 Scaling down old version ($CURRENT_VERSION)"
kubectl scale deployment ${SERVICE_NAME}-${CURRENT_VERSION} \
    -n $NAMESPACE \
    --replicas=0

echo "🎉 Blue-green deployment completed successfully!"
echo "🔗 Active version: $INACTIVE_VERSION"
```

## 📈 Monitoring Deployment

### 📊 Deployment Dashboard

```yaml
# infrastructure/k8s-manifests/monitoring/deployment-dashboard.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: deployment-dashboard
  namespace: trii-monitoring
  labels:
    grafana_dashboard: "1"
data:
  deployment-dashboard.json: |
    {
      "dashboard": {
        "title": "TRII Platform Deployments",
        "panels": [
          {
            "title": "Deployment Status",
            "type": "stat",
            "targets": [
              {
                "expr": "kube_deployment_status_replicas_available{namespace=\"trii-platform\"}",
                "legendFormat": "{{deployment}} Available"
              }
            ]
          },
          {
            "title": "Rollout Progress",
            "type": "graph",
            "targets": [
              {
                "expr": "kube_deployment_status_replicas_updated{namespace=\"trii-platform\"}",
                "legendFormat": "{{deployment}} Updated"
              }
            ]
          },
          {
            "title": "Pod Restarts",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(kube_pod_container_status_restarts_total{namespace=\"trii-platform\"}[5m])",
                "legendFormat": "{{pod}} Restarts/min"
              }
            ]
          }
        ]
      }
    }
```

---

## 🚀 Scripts de Deployment

### 📝 Deployment Helper Scripts

```bash
# scripts/deployment/deploy.sh
#!/bin/bash
set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
DRY_RUN=${3:-false}

echo "🚀 Deploying TRII Platform to $ENVIRONMENT"
echo "📦 Version: $VERSION"

# Set context based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
    kubectl config use-context trii-production
    VALUES_FILE="values-production.yaml"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    kubectl config use-context trii-staging
    VALUES_FILE="values-staging.yaml"
else
    echo "❌ Invalid environment: $ENVIRONMENT"
    exit 1
fi

# Dry run option
HELM_ARGS=""
if [[ "$DRY_RUN" == "true" ]]; then
    HELM_ARGS="--dry-run --debug"
fi

# Deploy with Helm
helm upgrade --install trii-platform \
    infrastructure/helm/trii-platform \
    --namespace trii-$ENVIRONMENT \
    --create-namespace \
    --values infrastructure/helm/trii-platform/$VALUES_FILE \
    --set global.imageTag=$VERSION \
    --wait --timeout=10m \
    $HELM_ARGS

if [[ "$DRY_RUN" != "true" ]]; then
    echo "✅ Deployment completed successfully!"
    echo "🔗 Application URL: https://$ENVIRONMENT.trii.co"
    echo "📊 Monitoring: https://$ENVIRONMENT-grafana.trii.co"
fi
```

**🎯 Para deployment rápido:**
```bash
# Development
make k8s-dev

# Staging  
./scripts/deployment/deploy.sh staging v2.1.0

# Production
./scripts/deployment/deploy.sh production v2.1.0
```

**📚 Documentación relacionada:**
- [Monitoring Guide](../operations/monitoring.md)
- [Development Guide](../development/README.md)
- [Architecture Overview](../architecture/README.md)

**📞 Soporte:** devops@trii.co