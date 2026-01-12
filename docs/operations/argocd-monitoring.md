# Documentación de ArgoCD para Stack de Monitoreo

## 🚢 Configuración de ArgoCD para Monitoreo

### 📊 Aplicaciones de ArgoCD Creadas

#### 1. **Monitoring Stack Application**
```yaml
# Ubicación: infrastructure/argocd/applications/monitoring-stack.yaml
Nombre: monitoring-stack
Namespace: argocd
Proyecto: default
Path: infrastructure/helm/monitoring-stack
```

**Componentes incluidos:**
- ✅ Prometheus + Grafana (kube-prometheus-stack)
- ✅ Loki Stack para logging
- ✅ Jaeger para distributed tracing
- ✅ AlertManager para alertas
- ✅ ServiceMonitors para métricas de servicios TRII

#### 2. **Business Dashboards Application**
```yaml
# Ubicación: infrastructure/argocd/applications/monitoring-stack.yaml
Nombre: business-dashboards  
Namespace: argocd
Path: infrastructure/k8s-manifests/monitoring
```

**Dashboards desplegados:**
- 📈 Business Intelligence Dashboard
- 🤖 ML Performance Dashboard  
- 🛡️ Security & Compliance Dashboard

### 🔐 Credenciales Configuradas

#### **Grafana Credentials**
```bash
# Secret: grafana-admin-credentials
Usuario: admin
Password: trii2026!

# Para cambiar la contraseña:
kubectl patch secret grafana-admin-credentials -n trii-monitoring \
  -p='{"data":{"admin-password":"'$(echo -n "nueva-password" | base64)'"}}'
```

#### **Prometheus Credentials**
```bash
# Secret: prometheus-credentials  
Usuario: admin
Password: prometheus2026!
```

#### **Monitoring Basic Auth**
```bash
# Secret: monitoring-basic-auth
Usuario: admin
Password: monitoring2026!
```

### 🎯 URLs de Acceso

#### **Grafana Dashboards**
- 🏠 **Home**: http://trii-grafana.local
- 📊 **Business Intelligence**: http://trii-grafana.local/d/business-intelligence
- 🤖 **ML Performance**: http://trii-grafana.local/d/ml-performance
- 🛡️ **Security & Compliance**: http://trii-grafana.local/d/security-compliance

#### **ArgoCD Applications**
- 🚢 **TRII Platform**: https://argocd.local/applications/trii-platform
- 📊 **Monitoring Stack**: https://argocd.local/applications/monitoring-stack
- 📈 **Business Dashboards**: https://argocd.local/applications/business-dashboards

#### **Monitoring Services**
- 📈 **Prometheus**: http://trii-prometheus.local
- 🚨 **AlertManager**: http://trii-alertmanager.local

### 🚀 Comandos de Deployment

#### **Deploy Monitoring Stack via ArgoCD**
```bash
# 1. Crear la aplicación de monitoreo
kubectl apply -f infrastructure/argocd/applications/monitoring-stack.yaml

# 2. Verificar el deployment
argocd app get monitoring-stack

# 3. Sincronizar manualmente (si es necesario)
argocd app sync monitoring-stack

# 4. Verificar el estado de los pods
kubectl get pods -n trii-monitoring
```

#### **Deploy Business Dashboards**
```bash
# Los dashboards se despliegan automáticamente con la aplicación monitoring-stack
kubectl get configmaps -n trii-monitoring -l grafana_dashboard=1
```

### 📊 Estructura de Archivos

```
infrastructure/
├── argocd/
│   └── applications/
│       └── monitoring-stack.yaml          # ArgoCD app para monitoreo
├── helm/
│   └── monitoring-stack/
│       ├── Chart.yaml                     # Helm chart de monitoreo
│       ├── values.yaml                    # Valores por defecto  
│       └── values-production.yaml         # Valores de producción
└── k8s-manifests/
    └── monitoring/
        ├── secrets.yaml                   # Credenciales de Grafana
        ├── alertmanager-config.yaml       # Configuración de alertas
        └── business-dashboards.yaml       # Dashboards de negocio
```

### 🔧 Configuración de Secrets

#### **Crear Secrets Manualmente**
```bash
# Grafana admin credentials
kubectl create secret generic grafana-admin-credentials \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=trii2026! \
  -n trii-monitoring

# AlertManager configuration
kubectl create secret generic alertmanager-config \
  --from-file=alertmanager.yml=infrastructure/k8s-manifests/monitoring/alertmanager-config.yaml \
  -n trii-monitoring

# Basic auth para interfaces de monitoreo
kubectl create secret generic monitoring-basic-auth \
  --from-literal=auth='admin:$apr1$H0GX0dx0$N5nIG.dQP/unXBpXSeXp30' \
  -n trii-monitoring
```

### 🔄 Sync Policy Configuration

#### **Política de Sincronización Automática**
```yaml
syncPolicy:
  automated:
    prune: true          # Eliminar recursos obsoletos
    selfHeal: true       # Auto-reparación de drift
    allowEmpty: false    # No permitir manifests vacíos
  syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    - PruneLast=true
    - ServerSideApply=true
  retry:
    limit: 5
    backoff:
      duration: 5s
      factor: 2
      maxDuration: 3m
```

### 📈 Monitoring de ArgoCD

#### **Métricas de ArgoCD para Prometheus**
```yaml
# ServiceMonitor para ArgoCD (ya incluido en el stack)
- name: argocd-metrics
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-metrics
  endpoints:
  - port: metrics
    interval: 30s
```

#### **Dashboard de ArgoCD en Grafana**
- 📊 **ArgoCD Overview**: http://trii-grafana.local/d/argocd-overview
- 🚀 **Application Status**: http://trii-grafana.local/d/argocd-applications
- 🔄 **Sync Status**: http://trii-grafana.local/d/argocd-sync

### 🚨 Alertas de ArgoCD

#### **Alertas Configuradas**
```yaml
# Application out of sync
- alert: ArgoApplicationOutOfSync
  expr: argocd_app_info{sync_status!="Synced"} == 1
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "ArgoCD application {{ $labels.name }} is out of sync"

# Application health degraded
- alert: ArgoApplicationUnhealthy
  expr: argocd_app_info{health_status!="Healthy"} == 1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "ArgoCD application {{ $labels.name }} is unhealthy"
```

### 🔍 Troubleshooting

#### **Verificar el estado de las aplicaciones**
```bash
# Listar todas las aplicaciones
argocd app list

# Ver detalles de una aplicación específica
argocd app get monitoring-stack

# Ver logs de sync
argocd app logs monitoring-stack

# Ver eventos de la aplicación
kubectl describe application monitoring-stack -n argocd
```

#### **Problemas comunes y soluciones**

**1. Application stuck in "OutOfSync"**
```bash
# Force refresh
argocd app get monitoring-stack --refresh

# Hard refresh (bypass cache)
argocd app get monitoring-stack --hard-refresh

# Manual sync
argocd app sync monitoring-stack
```

**2. Secrets no encontrados**
```bash
# Verificar que los secrets existen
kubectl get secrets -n trii-monitoring

# Aplicar secrets manualmente si es necesario
kubectl apply -f infrastructure/k8s-manifests/monitoring/secrets.yaml
```

**3. Helm chart issues**
```bash
# Verificar el Helm chart
helm template monitoring-stack infrastructure/helm/monitoring-stack \
  --values infrastructure/helm/monitoring-stack/values-production.yaml

# Dry run del deployment
helm upgrade --install monitoring-stack infrastructure/helm/monitoring-stack \
  --namespace trii-monitoring --dry-run
```

---

## 🎯 Acceso Rápido

**Para acceder al monitoreo completo:**
```bash
./scripts/open-trii.sh
```

**Credenciales por defecto:**
- **Grafana**: admin / trii2026!
- **ArgoCD**: admin / (ver secret)
- **Prometheus**: admin / prometheus2026!

**URLs principales:**
- 📊 **Grafana**: http://trii-grafana.local
- 🚢 **ArgoCD**: https://argocd.local
- 📈 **Prometheus**: http://trii-prometheus.local