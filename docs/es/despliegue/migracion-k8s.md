# Plan de Migración a Kubernetes con Kind + ArgoCD
## TRII Investment Platform

**Versión**: 1.0  
**Fecha**: 2025-12-17  
**Estado**: Planificación  

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis de la Situación Actual](#análisis-de-la-situación-actual)
3. [Reorganización de Documentación](#reorganización-de-documentación)
4. [Arquitectura Kubernetes](#arquitectura-kubernetes)
5. [Plan de Migración por Fases](#plan-de-migración-por-fases)
6. [Implementación con Kind](#implementación-con-kind)
7. [Configuración de ArgoCD](#configuración-de-argocd)
8. [Estrategia de Despliegue](#estrategia-de-despliegue)
9. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
10. [Plan de Rollback](#plan-de-rollback)
11. [Cronograma](#cronograma)
12. [Recursos Necesarios](#recursos-necesarios)

---

## Resumen Ejecutivo

### Objetivo
Migrar la plataforma TRII Investment de Docker Compose a Kubernetes utilizando:
- **Kind** (Kubernetes in Docker) para desarrollo local
- **ArgoCD** para GitOps y despliegue continuo
- **Reorganización completa** de la documentación

### Beneficios Esperados
- ✅ **Escalabilidad**: Auto-scaling horizontal de servicios
- ✅ **Alta Disponibilidad**: Self-healing y rolling updates
- ✅ **GitOps**: Despliegues declarativos y versionados
- ✅ **Portabilidad**: Fácil migración a cualquier cloud provider
- ✅ **Desarrollo Local**: Entorno idéntico a producción con Kind
- ✅ **Documentación Organizada**: Estructura clara y mantenible

### Duración Estimada
**6 semanas** divididas en 3 fases principales

---

## Análisis de la Situación Actual

### Servicios Existentes

#### Infraestructura Base
```yaml
- PostgreSQL + TimescaleDB (Puerto 5433)
- Redis (Puerto 6379)
- RabbitMQ (Puertos 5672, 15672)
- MinIO (Puertos 9000, 9001)
```

#### Microservicios
```yaml
- market-data (Python/FastAPI - Puerto 8001)
- analysis-engine (Python/FastAPI - Puerto 8002)
- portfolio-manager (Node.js/NestJS - Puerto 8003)
- ml-prediction (Python/FastAPI - Puerto 8004)
```

#### Aplicación Frontend
```yaml
- desktop-client (Electron + React)
```

### Documentación Actual

#### Archivos en Raíz (Desorganizado)
```
✗ README.md
✗ ARCHITECTURE.md
✗ COMO_EMPEZAR.md
✗ DEVOPS_IMPLEMENTATION.md
✗ EXECUTIVE_SUMMARY.md
✗ GETTING_STARTED.md
✗ GUIA_RAPIDA.md
✗ IMPLEMENTACION_COMPLETADA.md
✗ IMPLEMENTATION_ROADMAP.md
✗ INDEX.md
✗ PROJECT_STRUCTURE.md
✗ PROXIMO_PASO.md
✗ QUICK_START.md
✗ RESUMEN_EJECUTIVO.md
✗ RESUMEN_FINAL.md
✗ TECH_STACK_JUSTIFICATION.md
```

**Problemas Identificados**:
- 15+ archivos markdown en la raíz
- Duplicación de contenido (español/inglés)
- Falta de estructura jerárquica
- Difícil navegación y mantenimiento

---

## Reorganización de Documentación

### Nueva Estructura Propuesta

```
docs/
├── README.md                          # Índice principal
├── es/                                # Documentación en español
│   ├── 00-inicio/
│   │   ├── README.md                  # Bienvenida
│   │   ├── guia-rapida.md            # Quick start
│   │   └── como-empezar.md           # Getting started
│   ├── 01-arquitectura/
│   │   ├── README.md                  # Overview
│   │   ├── vision-general.md         # Architecture overview
│   │   ├── decisiones/               # ADRs
│   │   │   ├── 001-stack-tecnologico.md
│   │   │   ├── 002-base-datos.md
│   │   │   └── 003-kubernetes.md
│   │   └── diagramas/                # Architecture diagrams
│   ├── 02-desarrollo/
│   │   ├── README.md
│   │   ├── configuracion-local.md
│   │   ├── estandares-codigo.md
│   │   ├── guia-testing.md
│   │   └── contribuir.md
│   ├── 03-servicios/
│   │   ├── README.md
│   │   ├── market-data.md
│   │   ├── analysis-engine.md
│   │   ├── portfolio-manager.md
│   │   └── ml-prediction.md
│   ├── 04-kubernetes/
│   │   ├── README.md
│   │   ├── arquitectura-k8s.md
│   │   ├── kind-setup.md
│   │   ├── argocd-setup.md
│   │   └── migracion.md
│   ├── 05-despliegue/
│   │   ├── README.md
│   │   ├── desarrollo-local.md
│   │   ├── staging.md
│   │   └── produccion.md
│   ├── 06-operaciones/
│   │   ├── README.md
│   │   ├── monitoreo.md
│   │   ├── logs.md
│   │   ├── backups.md
│   │   └── runbooks/
│   │       ├── incident-response.md
│   │       ├── database-recovery.md
│   │       └── service-restart.md
│   └── 07-api/
│       ├── README.md
│       └── openapi/
│           ├── market-data.yaml
│           ├── analysis-engine.yaml
│           ├── portfolio-manager.yaml
│           └── ml-prediction.yaml
├── en/                                # English documentation
│   └── [same structure as es/]
└── assets/                            # Shared assets
    ├── images/
    ├── diagrams/
    └── videos/
```

### Mapeo de Archivos Actuales a Nueva Estructura

| Archivo Actual | Nueva Ubicación |
|----------------|-----------------|
| [`README.md`](README.md:1) | [`docs/README.md`](docs/README.md:1) + [`docs/es/00-inicio/README.md`](docs/es/00-inicio/README.md:1) |
| [`RESUMEN_EJECUTIVO.md`](RESUMEN_EJECUTIVO.md:1) | [`docs/es/00-inicio/README.md`](docs/es/00-inicio/README.md:1) |
| [`EXECUTIVE_SUMMARY.md`](EXECUTIVE_SUMMARY.md:1) | [`docs/en/00-getting-started/README.md`](docs/en/00-getting-started/README.md:1) |
| [`GUIA_RAPIDA.md`](GUIA_RAPIDA.md:1) | [`docs/es/00-inicio/guia-rapida.md`](docs/es/00-inicio/guia-rapida.md:1) |
| [`QUICK_START.md`](QUICK_START.md:1) | [`docs/en/00-getting-started/quick-start.md`](docs/en/00-getting-started/quick-start.md:1) |
| [`ARCHITECTURE.md`](ARCHITECTURE.md:1) | [`docs/es/01-arquitectura/vision-general.md`](docs/es/01-arquitectura/vision-general.md:1) |
| [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md:1) | [`docs/es/01-arquitectura/estructura-proyecto.md`](docs/es/01-arquitectura/estructura-proyecto.md:1) |
| [`TECH_STACK_JUSTIFICATION.md`](TECH_STACK_JUSTIFICATION.md:1) | [`docs/es/01-arquitectura/decisiones/001-stack-tecnologico.md`](docs/es/01-arquitectura/decisiones/001-stack-tecnologico.md:1) |
| [`DEVOPS_IMPLEMENTATION.md`](DEVOPS_IMPLEMENTATION.md:1) | [`docs/es/05-despliegue/devops.md`](docs/es/05-despliegue/devops.md:1) |
| [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md:1) | [`docs/es/02-desarrollo/roadmap.md`](docs/es/02-desarrollo/roadmap.md:1) |
| Nuevo | [`docs/es/04-kubernetes/`](docs/es/04-kubernetes/:1) (toda la sección) |

---

## Arquitectura Kubernetes

### Diagrama de Arquitectura K8s

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Ingress Controller                           │
│                         (NGINX Ingress)                              │
│                    SSL/TLS Termination + Routing                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   Market     │  │  Analysis    │  │  Portfolio   │
        │   Data       │  │  Engine      │  │  Manager     │
        │   Service    │  │  Service     │  │  Service     │
        │              │  │              │  │              │
        │  Deployment  │  │  Deployment  │  │  Deployment  │
        │  (3 replicas)│  │  (2 replicas)│  │  (2 replicas)│
        │              │  │              │  │              │
        │  Service     │  │  Service     │  │  Service     │
        │  (ClusterIP) │  │  (ClusterIP) │  │  (ClusterIP) │
        └──────────────┘  └──────────────┘  └──────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │              Message Bus Layer                    │
        │                                                   │
        │  ┌──────────────┐         ┌──────────────┐      │
        │  │  RabbitMQ    │         │  Redis       │      │
        │  │  StatefulSet │         │  StatefulSet │      │
        │  │  (3 replicas)│         │  (3 replicas)│      │
        │  └──────────────┘         └──────────────┘      │
        └──────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  PostgreSQL  │  │  TimescaleDB │  │    MinIO     │
        │  StatefulSet │  │  StatefulSet │  │  StatefulSet │
        │  (1 primary  │  │  (1 primary  │  │  (4 replicas)│
        │   2 replicas)│  │   1 replica) │  │              │
        │              │  │              │  │              │
        │  PVC (50GB)  │  │  PVC (100GB) │  │  PVC (200GB) │
        └──────────────┘  └──────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    Monitoring & Observability                        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Prometheus  │  │   Grafana    │  │     Loki     │             │
│  │  StatefulSet │  │  Deployment  │  │  StatefulSet │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         ArgoCD GitOps                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  ArgoCD Server + Application Controller              │          │
│  │  - Sync from Git Repository                          │          │
│  │  - Auto-sync enabled                                 │          │
│  │  - Self-healing enabled                              │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### Namespaces

```yaml
namespaces:
  - trii-dev          # Desarrollo local
  - trii-staging      # Staging
  - trii-production   # Producción
  - trii-monitoring   # Prometheus, Grafana, Loki
  - argocd            # ArgoCD
```

### Recursos por Servicio

#### Market Data Service
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-data
  namespace: trii-dev
spec:
  replicas: 3
  selector:
    matchLabels:
      app: market-data
  template:
    spec:
      containers:
      - name: market-data
        image: trii/market-data:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: connection-string
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8001
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### PostgreSQL StatefulSet
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: trii-dev
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    spec:
      containers:
      - name: postgres
        image: timescale/timescaledb:latest-pg15
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
```

### ConfigMaps y Secrets

```yaml
# ConfigMap para configuración de aplicación
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: trii-dev
data:
  LOG_LEVEL: "info"
  ENVIRONMENT: "development"
  REDIS_HOST: "redis-service"
  RABBITMQ_HOST: "rabbitmq-service"

---
# Secret para credenciales sensibles
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: trii-dev
type: Opaque
stringData:
  POSTGRES_PASSWORD: "changeme"
  REDIS_PASSWORD: "changeme"
  ALPHA_VANTAGE_API_KEY: "demo"
  JWT_SECRET: "changeme"
```

---

## Plan de Migración por Fases

### Fase 1: Preparación (Semana 1-2)

#### Objetivos
- Reorganizar documentación
- Configurar Kind localmente
- Crear manifiestos base de Kubernetes
- Configurar ArgoCD

#### Tareas Detalladas

**Semana 1: Reorganización de Documentación**
- [ ] Crear nueva estructura de carpetas [`docs/`](docs/:1)
- [ ] Migrar contenido existente a nueva estructura
- [ ] Consolidar documentación duplicada
- [ ] Crear índices y navegación
- [ ] Actualizar enlaces internos
- [ ] Revisar y corregir contenido

**Semana 2: Setup de Kind y Manifiestos Base**
- [ ] Instalar Kind en máquina de desarrollo
- [ ] Crear cluster Kind con configuración personalizada
- [ ] Crear manifiestos base para todos los servicios
- [ ] Configurar namespaces
- [ ] Crear ConfigMaps y Secrets
- [ ] Probar despliegue básico

#### Entregables
- ✅ Documentación reorganizada y accesible
- ✅ Cluster Kind funcionando localmente
- ✅ Manifiestos K8s para todos los servicios
- ✅ Scripts de automatización

### Fase 2: Migración de Servicios (Semana 3-4)

#### Objetivos
- Migrar servicios de Docker Compose a Kubernetes
- Configurar networking y service discovery
- Implementar health checks
- Configurar volúmenes persistentes

#### Orden de Migración

**Semana 3: Infraestructura Base**
1. **PostgreSQL + TimescaleDB**
   - StatefulSet con PVC
   - Service para acceso interno
   - Backup strategy
   
2. **Redis**
   - StatefulSet con replicación
   - Service para cache
   
3. **RabbitMQ**
   - StatefulSet con clustering
   - Management UI accesible
   
4. **MinIO**
   - StatefulSet con 4 replicas
   - Distributed mode

**Semana 4: Microservicios**
1. **Market Data Service**
   - Deployment con 3 replicas
   - HPA (Horizontal Pod Autoscaler)
   - Service + Ingress
   
2. **Analysis Engine**
   - Deployment con 2 replicas
   - Resource limits ajustados
   
3. **Portfolio Manager**
   - Deployment con 2 replicas
   - Database migrations job
   
4. **ML Prediction**
   - Deployment con 1 replica (GPU si disponible)
   - Model storage en MinIO

#### Entregables
- ✅ Todos los servicios corriendo en Kubernetes
- ✅ Networking configurado correctamente
- ✅ Health checks funcionando
- ✅ Datos persistentes en PVCs

### Fase 3: GitOps y Automatización (Semana 5-6)

#### Objetivos
- Configurar ArgoCD
- Implementar CI/CD con GitOps
- Configurar monitoreo
- Documentar procesos

#### Tareas Detalladas

**Semana 5: ArgoCD Setup**
- [ ] Instalar ArgoCD en cluster
- [ ] Configurar repositorio Git
- [ ] Crear ArgoCD Applications
- [ ] Configurar auto-sync
- [ ] Implementar sync waves
- [ ] Configurar RBAC

**Semana 6: Monitoreo y Finalización**
- [ ] Desplegar Prometheus
- [ ] Configurar Grafana dashboards
- [ ] Implementar Loki para logs
- [ ] Configurar alertas
- [ ] Crear runbooks
- [ ] Documentar procesos operativos

#### Entregables
- ✅ ArgoCD gestionando todos los despliegues
- ✅ Monitoreo completo funcionando
- ✅ Alertas configuradas
- ✅ Documentación operativa completa

---

## Implementación con Kind

### Instalación de Kind

```bash
# macOS
brew install kind

# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Verificar instalación
kind version
```

### Configuración del Cluster Kind

**Archivo**: [`infrastructure/kubernetes/kind/cluster-config.yaml`](infrastructure/kubernetes/kind/cluster-config.yaml:1)

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: trii-dev
nodes:
  # Control plane
  - role: control-plane
    kubeadmConfigPatches:
    - |
      kind: InitConfiguration
      nodeRegistration:
        kubeletExtraArgs:
          node-labels: "ingress-ready=true"
    extraPortMappings:
    # HTTP
    - containerPort: 80
      hostPort: 80
      protocol: TCP
    # HTTPS
    - containerPort: 443
      hostPort: 443
      protocol: TCP
    # ArgoCD UI
    - containerPort: 30080
      hostPort: 8080
      protocol: TCP
    # Grafana
    - containerPort: 30081
      hostPort: 3000
      protocol: TCP
  
  # Worker nodes
  - role: worker
  - role: worker
  - role: worker

# Networking
networking:
  apiServerAddress: "127.0.0.1"
  apiServerPort: 6443
  podSubnet: "10.244.0.0/16"
  serviceSubnet: "10.96.0.0/12"

# Feature gates
featureGates:
  EphemeralContainers: true
```

### Scripts de Gestión

**Archivo**: [`scripts/kind/create-cluster.sh`](scripts/kind/create-cluster.sh:1)

```bash
#!/bin/bash
set -e

echo "🚀 Creando cluster Kind para TRII Platform..."

# Crear cluster
kind create cluster --config infrastructure/kubernetes/kind/cluster-config.yaml

# Esperar a que el cluster esté listo
echo "⏳ Esperando a que el cluster esté listo..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Instalar NGINX Ingress Controller
echo "📦 Instalando NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Esperar a que Ingress esté listo
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# Crear namespaces
echo "📁 Creando namespaces..."
kubectl create namespace trii-dev
kubectl create namespace trii-staging
kubectl create namespace trii-production
kubectl create namespace trii-monitoring
kubectl create namespace argocd

# Etiquetar namespaces
kubectl label namespace trii-dev environment=development
kubectl label namespace trii-staging environment=staging
kubectl label namespace trii-production environment=production

echo "✅ Cluster Kind creado exitosamente!"
echo ""
echo "📊 Información del cluster:"
kubectl cluster-info
echo ""
echo "🔍 Nodos:"
kubectl get nodes
echo ""
echo "📦 Namespaces:"
kubectl get namespaces
```

**Archivo**: [`scripts/kind/delete-cluster.sh`](scripts/kind/delete-cluster.sh:1)

```bash
#!/bin/bash
set -e

echo "🗑️  Eliminando cluster Kind..."
kind delete cluster --name trii-dev
echo "✅ Cluster eliminado exitosamente!"
```

---

## Configuración de ArgoCD

### Instalación de ArgoCD

**Archivo**: [`scripts/argocd/install.sh`](scripts/argocd/install.sh:1)

```bash
#!/bin/bash
set -e

echo "🚀 Instalando ArgoCD..."

# Instalar ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Esperar a que ArgoCD esté listo
echo "⏳ Esperando a que ArgoCD esté listo..."
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Exponer ArgoCD UI
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "nodePort": 30080}]}}'

# Obtener password inicial
echo ""
echo "✅ ArgoCD instalado exitosamente!"
echo ""
echo "🔐 Password inicial de admin:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""
echo ""
echo "🌐 Acceder a ArgoCD UI:"
echo "   URL: https://localhost:8080"
echo "   Usuario: admin"
echo ""
echo "💡 Cambiar password:"
echo "   argocd account update-password"
```

### Configuración de ArgoCD Applications

**Archivo**: [`infrastructure/kubernetes/argocd/applications/trii-dev.yaml`](infrastructure/kubernetes/argocd/applications/trii-dev.yaml:1)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: trii-dev
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  
  source:
    repoURL: https://github.com/your-org/investment-app.git
    targetRevision: develop
    path: infrastructure/kubernetes/overlays/dev
  
  destination:
    server: https://kubernetes.default.svc
    namespace: trii-dev
  
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
  
  # Health assessment
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
```

### Estructura de Kustomize

```
infrastructure/kubernetes/
├── base/                              # Manifiestos base
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── postgres/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── pvc.yaml
│   ├── redis/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   ├── rabbitmq/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   ├── market-data/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── ingress.yaml
│   ├── analysis-engine/
│   ├── portfolio-manager/
│   └── ml-prediction/
│
├── overlays/                          # Overlays por ambiente
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   ├── configmap-patch.yaml
│   │   └── replicas-patch.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
│
└── argocd/                            # ArgoCD applications
    ├── applications/
    │   ├── trii-dev.yaml
    │   ├── trii-staging.yaml
    │   └── trii-production.yaml
    └── projects/
        └── trii-project.yaml
```

**Archivo**: [`infrastructure/kubernetes/base/kustomization.yaml`](infrastructure/kubernetes/base/kustomization.yaml:1)

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - configmap.yaml
  - secrets.yaml
  - postgres/statefulset.yaml
  - postgres/service.yaml
  - redis/statefulset.yaml
  - redis/service.yaml
  - rabbitmq/statefulset.yaml
  - rabbitmq/service.yaml
  - market-data/deployment.yaml
  - market-data/service.yaml
  - market-data/hpa.yaml
  - market-data/ingress.yaml
  - analysis-engine/deployment.yaml
  - analysis-engine/service.yaml
  - portfolio-manager/deployment.yaml
  - portfolio-manager/service.yaml
  - ml-prediction/deployment.yaml
  - ml-prediction/service.yaml

commonLabels:
  app.kubernetes.io/name: trii-platform
  app.kubernetes.io/managed-by: argocd

images:
  - name: trii/market-data
    newTag: latest
  - name: trii/analysis-engine
    newTag: latest
  - name: trii/portfolio-manager
    newTag: latest
  - name: trii/ml-prediction
    newTag: latest
```

**Archivo**: [`infrastructure/kubernetes/overlays/dev/kustomization.yaml`](infrastructure/kubernetes/overlays/dev/kustomization.yaml:1)

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: trii-dev

bases:
  - ../../base

patchesStrategicMerge:
  - configmap-patch.yaml
  - replicas-patch.yaml

commonLabels:
  environment: development

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - LOG_LEVEL=debug
      - ENVIRONMENT=development

secretGenerator:
  - name: app-secrets
    behavior: merge
    literals:
      - POSTGRES_PASSWORD=dev_password
      - REDIS_PASSWORD=dev_password

replicas:
  - name: market-data
    count: 1
  - name: analysis-engine
    count: 1
  - name: portfolio-manager
    count: 1
  - name: ml-prediction
    count: 1
```

---

## Estrategia de Despliegue

### GitOps Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 1. git push
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Git Repository                            │
│  infrastructure/kubernetes/overlays/dev/                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 2. ArgoCD detects change
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ArgoCD Controller                         │
│  - Compares desired state (Git) vs actual state (K8s)       │
│  - Generates sync plan                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 3. Auto-sync (if enabled)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
│  - Applies manifests                                         │
│  - Rolling update                                            │
│  - Health checks                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ 4. Status update
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ArgoCD UI / CLI                           │
│  - Sync status: Synced / OutOfSync                          │
│  - Health status: Healthy / Degraded                        │
│  - Rollback if needed                                        │
└─────────────────────────────────────────────────────────────┘
```

### Sync Waves

Orden de despliegue usando sync waves:

```yaml
# Wave 0: Namespaces y configuración base
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "0"

# Wave 1: Secrets y ConfigMaps
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"

# Wave 2: Bases de datos (StatefulSets)
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "2"

# Wave 3: Servicios de infraestructura (Redis, RabbitMQ)
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "3"

# Wave 4: Microservicios
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "4"

# Wave 5: Ingress
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "5"
```

### Rolling Updates

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-data
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Máximo 1 pod adicional durante update
      maxUnavailable: 0  # Siempre mantener disponibilidad
  minReadySeconds: 10
  progressDeadlineSeconds: 600
```

---

## Monitoreo y Observabilidad

### Stack de Monitoreo

#### Prometheus

**Archivo**: [`infrastructure/kubernetes/monitoring/prometheus/deployment.yaml`](infrastructure/kubernetes/monitoring/prometheus/deployment.yaml:1)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: prometheus
  namespace: trii-monitoring
spec:
  serviceName: prometheus
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      serviceAccountName: prometheus
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--storage.tsdb.retention.time=30d'
        ports:
        - containerPort: 9090
          name: web
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
  volumeClaimTemplates:
  - metadata:
      name: storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
```

#### Grafana Dashboards

Dashboards pre-configurados:
1. **Cluster Overview**: CPU, memoria, disco por nodo
2. **Services Overview**: Latencia, throughput, errores
3. **Database Performance**: Queries, connections, cache hit rate
4. **Business Metrics**: Usuarios activos, portfolios, predicciones

#### Loki para Logs

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: loki
  namespace: trii-monitoring
spec:
  serviceName: loki
  replicas: 1
  selector:
    matchLabels:
      app: loki
  template:
    spec:
      containers:
      - name: loki
        image: grafana/loki:latest
        args:
          - -config.file=/etc/loki/loki.yaml
        ports:
        - containerPort: 3100
          name: http
        volumeMounts:
        - name: config
          mountPath: /etc/loki
        - name: storage
          mountPath: /loki
```

### Alertas Críticas

```yaml
groups:
  - name: trii_alerts
    interval: 30s
    rules:
      - alert: ServiceDown
        expr: up{job="kubernetes-pods"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.pod }} is down"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on {{ $labels.service }}"
```

---

## Plan de Rollback

### Estrategia de Rollback

#### Rollback Automático (ArgoCD)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  syncPolicy:
    automated:
      selfHeal: true  # Auto-rollback si el estado diverge
```

#### Rollback Manual

```bash
# Ver historial de revisiones
kubectl rollout history deployment/market-data -n trii-dev

# Rollback a revisión anterior
kubectl rollout undo deployment/market-data -n trii-dev

# Rollback a revisión específica
kubectl rollout undo deployment/market-data -n trii-dev --to-revision=3

# Verificar estado
kubectl rollout status deployment/market-data -n trii-dev
```

#### Rollback con ArgoCD

```bash
# Ver historial de sync
argocd app history trii-dev

# Rollback a revisión anterior
argocd app rollback trii-dev

# Rollback a revisión específica
argocd app rollback trii-dev 5
```

### Procedimiento de Emergencia

1. **Detectar problema** (alertas, monitoreo)
2. **Evaluar impacto** (usuarios afectados, servicios caídos)
3. **Decidir rollback** (si el problema es crítico)
4. **Ejecutar rollback** (ArgoCD o kubectl)
5. **Verificar recuperación** (health checks, métricas)
6. **Comunicar** (equipo, usuarios si aplica)
7. **Post-mortem** (análisis de causa raíz)

---

## Cronograma

### Gantt Chart

```
Semana 1: Reorganización Documentación
├─ Días 1-2: Crear estructura de carpetas
├─ Días 3-4: Migrar contenido
└─ Día 5: Revisión y correcciones

Semana 2: Setup Kind y Manifiestos
├─ Días 1-2: Instalar Kind, crear cluster
├─ Días 3-4: Crear manifiestos base
└─ Día 5: Pruebas iniciales

Semana 3: Migración Infraestructura
├─ Días 1-2: PostgreSQL + TimescaleDB
├─ Día 3: Redis
├─ Día 4: RabbitMQ
└─ Día 5: MinIO

Semana 4: Migración Microservicios
├─ Día 1: Market Data Service
├─ Día 2: Analysis Engine
├─ Día 3: Portfolio Manager
├─ Día 4: ML Prediction
└─ Día 5: Testing integración

Semana 5: ArgoCD y GitOps
├─ Días 1-2: Instalar y configurar ArgoCD
├─ Días 3-4: Crear Applications, configurar sync
└─ Día 5: Testing GitOps workflow

Semana 6: Monitoreo y Finalización
├─ Días 1-2: Prometheus + Grafana
├─ Día 3: Loki + alertas
├─ Día 4: Documentación operativa
└─ Día 5: Revisión final y entrega
```

### Hitos Clave

| Hito | Fecha | Criterio de Éxito |
|------|-------|-------------------|
| Documentación reorganizada | Fin Semana 1 | Estructura clara, contenido migrado |
| Cluster Kind funcionando | Fin Semana 2 | Todos los servicios desplegados |
| Infraestructura migrada | Fin Semana 3 | Bases de datos operativas |
| Microservicios migrados | Fin Semana 4 | Todos los servicios funcionando |
| ArgoCD configurado | Fin Semana 5 | GitOps workflow operativo |
| Monitoreo completo | Fin Semana 6 | Dashboards y alertas activas |

---

## Recursos Necesarios

### Equipo

| Rol | Dedicación | Responsabilidades |
|-----|------------|-------------------|
| DevOps Engineer | 100% | Kubernetes, ArgoCD, infraestructura |
| Backend Developer | 50% | Ajustes en servicios, health checks |
| Technical Writer | 25% | Documentación |

### Herramientas

| Herramienta | Versión | Propósito |
|-------------|---------|-----------|
| Kind | 0.20+ | Cluster local |
| kubectl | 1.28+ | CLI Kubernetes |
| ArgoCD | 2.9+ | GitOps |
| Kustomize | 5.0+ | Gestión manifiestos |
| Helm | 3.13+ | Package manager (opcional) |

### Infraestructura

#### Desarrollo Local (Kind)
```yaml
Requisitos mínimos:
  CPU: 8 cores
  RAM: 16 GB
  Disco: 100 GB SSD
  Docker: 24.0+
```

#### Staging/Production
```yaml
Cluster Kubernetes:
  Nodos: 3-5
  CPU por nodo: 4 cores
  RAM por nodo: 16 GB
  Disco por nodo: 200 GB SSD
```

---

## Próximos Pasos

### Acción Inmediata

1. **Revisar este plan** con el equipo
2. **Aprobar presupuesto** y recursos
3. **Asignar responsables** para cada fase
4. **Crear repositorio Git** para manifiestos K8s
5. **Iniciar Fase 1** (Reorganización documentación)

### Comandos para Empezar

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd investment-app

# 2. Crear rama para migración
git checkout -b feature/kubernetes-migration

# 3. Instalar herramientas
brew install kind kubectl kustomize argocd

# 4. Crear cluster Kind
./scripts/kind/create-cluster.sh

# 5. Verificar cluster
kubectl cluster-info
kubectl get nodes

# 6. Seguir con Fase 1...
```

---

## Preguntas Frecuentes

### ¿Por qué Kind y no Minikube?
Kind es más rápido, usa Docker nativo, y es más similar a clusters de producción.

### ¿Necesitamos Helm?
No es obligatorio. Usaremos Kustomize que es más simple y nativo de Kubernetes.

### ¿Qué pasa con Docker Compose?
Se mantendrá como opción para desarrollo rápido, pero Kubernetes será el estándar.

### ¿Cómo afecta al desarrollo diario?
Mínimamente. Los desarrolladores pueden seguir usando Docker Compose localmente.

### ¿Cuánto cuesta la infraestructura?
Desarrollo: $0 (local con Kind)
Staging: ~$200/mes
Producción: ~$500-800/mes

---

## Conclusión

Este plan proporciona una ruta clara y estructurada para:

1. ✅ **Organizar la documentación** en una estructura mantenible
2. ✅ **Migrar a Kubernetes** de forma gradual y segura
3. ✅ **Implementar GitOps** con ArgoCD
4. ✅ **Mantener alta disponibilidad** durante la migración
5. ✅ **Establecer mejores prácticas** de DevOps

**Beneficios esperados**:
- Escalabilidad automática
- Despliegues más rápidos y seguros
- Mejor observabilidad
- Infraestructura como código
- Portabilidad entre clouds

**Siguiente paso**: Revisar y aprobar este plan para iniciar la Fase 1.

---

**Versión del Documento**: 1.0  
**Última Actualización**: 2025-12-17  
**Mantenido por**: Equipo DevOps TRII Platform  
**Contacto**: devops@trii-platform.com
