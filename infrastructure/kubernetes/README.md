# 🚀 Migración a Kubernetes - TRII Investment Platform

## 📋 Resumen Ejecutivo

Esta guía documenta la migración completa de la plataforma TRII Investment de Docker Compose a Kubernetes utilizando:

- **Kind** (Kubernetes in Docker) para desarrollo local
- **ArgoCD** para GitOps y despliegues continuos
- **Kustomize** para gestión de manifiestos
- **PostgreSQL + TimescaleDB** para persistencia de datos
- **Redis** para cache distribuido

## 🎯 Estado Actual

✅ **Fase 1: Preparación** - COMPLETADA
- ✅ Estructura de directorios Kubernetes creada
- ✅ Configuración Kind cluster lista
- ✅ Scripts de gestión implementados
- ✅ Manifiestos base de Kubernetes creados
- ✅ ArgoCD configurado
- ✅ Application ArgoCD lista

## 📁 Estructura de Directorios

```
infrastructure/kubernetes/
├── README.md                              # Esta guía
├── kind/
│   └── cluster-config.yaml               # Configuración Kind cluster
├── base/                                 # Manifiestos base
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── kustomization.yaml
│   ├── postgres/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml               # Script init DB
│   ├── redis/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   └── market-data/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── ingress.yaml
├── overlays/                             # Overlays por ambiente
│   └── dev/
│       ├── kustomization.yaml
│       └── replicas-patch.yaml
└── argocd/                               # ArgoCD applications
    └── applications/
        └── trii-dev.yaml
```

## 🛠️ Requisitos Previos

### Herramientas Necesarias

```bash
# macOS
brew install kind kubectl kustomize argocd

# Linux
# Instalar kubectl, kind, kustomize y argocd-cli

# Verificar instalaciones
kind version
kubectl version --client
kustomize version
argocd version
```

### Recursos del Sistema

- **CPU**: Mínimo 8 cores
- **RAM**: Mínimo 16 GB
- **Disco**: Mínimo 50 GB disponible
- **Docker**: Versión 24.0+

## 🚀 Guía de Inicio Rápido

### 1. Crear Cluster Kind

```bash
# Crear cluster con configuración personalizada
./scripts/kind/create-cluster.sh
```

Este comando:
- ✅ Crea cluster Kind con 4 nodos
- ✅ Instala NGINX Ingress Controller
- ✅ Crea namespaces necesarios
- ✅ Configura etiquetas

### 2. Instalar ArgoCD

```bash
# Instalar ArgoCD en el cluster
./scripts/argocd/install.sh
```

### 3. Configurar Acceso

```bash
# Obtener password inicial de ArgoCD
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Acceder a ArgoCD UI
open https://localhost:8080
# Usuario: admin
# Password: [password-obtenido]
```

### 4. Crear Application ArgoCD

```bash
# Aplicar la Application ArgoCD
kubectl apply -f infrastructure/kubernetes/argocd/applications/trii-dev.yaml
```

### 5. Verificar Despliegue

```bash
# Ver estado de ArgoCD
kubectl get applications -n argocd

# Ver pods desplegados
kubectl get pods -n trii-dev

# Ver servicios
kubectl get services -n trii-dev

# Ver ingresses
kubectl get ingress -n trii-dev
```

## 🔧 Configuración Detallada

### Variables de Entorno

Las variables sensibles están configuradas en `infrastructure/kubernetes/overlays/dev/kustomization.yaml`:

```yaml
secretGenerator:
  - name: app-secrets
    literals:
      - POSTGRES_PASSWORD=trii_dev_password
      - REDIS_PASSWORD=trii_dev_password
      - ALPHA_VANTAGE_API_KEY=DMRJBMVCSWVOKFMO
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### URLs de Servicio

| Servicio | URL Local | Puerto |
|----------|-----------|--------|
| Market Data API | http://market-data.local | 80 |
| ArgoCD UI | https://localhost:8080 | 8080 |
| PostgreSQL | localhost:5433 | 5433 |
| Redis | localhost:6379 | 6379 |

### Health Checks

```bash
# Health check Market Data Service
curl http://market-data.local/health

# Ver logs del servicio
kubectl logs -f deployment/market-data -n trii-dev

# Ver métricas de ArgoCD
kubectl get applications -n argocd
```

## 🔄 Flujo de Trabajo GitOps

### Desarrollo Diario

1. **Realizar cambios** en código o manifiestos
2. **Commit y push** a rama develop
3. **ArgoCD detecta cambios** automáticamente
4. **Sync automático** aplica cambios al cluster
5. **Verificar** estado en ArgoCD UI

### Rollback

```bash
# Ver historial de sync
argocd app history trii-dev

# Rollback a versión anterior
argocd app rollback trii-dev

# Ver estado
argocd app get trii-dev
```

## 📊 Monitoreo y Troubleshooting

### Comandos Útiles

```bash
# Ver estado general del cluster
kubectl cluster-info

# Ver recursos por namespace
kubectl get all -n trii-dev

# Ver logs de un pod específico
kubectl logs <pod-name> -n trii-dev

# Conectar a PostgreSQL
kubectl exec -it <postgres-pod> -n trii-dev -- psql -U postgres -d trii_dev

# Ver eventos del cluster
kubectl get events -n trii-dev --sort-by=.metadata.creationTimestamp

# Ver uso de recursos
kubectl top nodes
kubectl top pods -n trii-dev
```

### Problemas Comunes

#### ArgoCD no sync automáticamente
```bash
# Verificar estado de la application
argocd app get trii-dev

# Forzar sync manual
argocd app sync trii-dev

# Ver logs de ArgoCD
kubectl logs -f <argocd-repo-server-pod> -n argocd
```

#### Pods no inician
```bash
# Ver eventos del pod
kubectl describe pod <pod-name> -n trii-dev

# Ver logs detallados
kubectl logs <pod-name> -n trii-dev --previous
```

#### Ingress no funciona
```bash
# Verificar NGINX Ingress Controller
kubectl get pods -n ingress-nginx

# Ver configuración de ingress
kubectl describe ingress market-data-ingress -n trii-dev

# Agregar entrada a /etc/hosts
echo "127.0.0.1 market-data.local" | sudo tee -a /etc/hosts
```

## 🧪 Testing

### Pruebas de Funcionalidad

```bash
# Test Market Data API
curl -s http://market-data.local/api/v1/market-data/search?query=apple | jq .

curl -s http://market-data.local/api/v1/market-data/quotes/AAPL | jq .

# Test base de datos
kubectl exec -it <postgres-pod> -n trii-dev -- psql -U postgres -d trii_dev -c "SELECT COUNT(*) FROM quotes;"
```

### Pruebas de Carga

```bash
# Instalar hey para pruebas de carga
# brew install hey

# Prueba de carga básica
hey -n 100 -c 10 http://market-data.local/health

# Prueba de carga API
hey -n 50 -c 5 http://market-data.local/api/v1/market-data/quotes/AAPL
```

## 🔒 Seguridad

### Mejores Prácticas Implementadas

- ✅ **Secrets en lugar de ConfigMaps** para datos sensibles
- ✅ **RBAC** configurado en ArgoCD
- ✅ **Network Policies** (por implementar)
- ✅ **Pod Security Standards** aplicados
- ✅ **Image scanning** recomendado

### Secret Management

Los secrets están versionados en Git de forma encriptada. Para producción:

1. Usar **Sealed Secrets** o **External Secrets Operator**
2. Integrar con **HashiCorp Vault** o **AWS Secrets Manager**
3. Implementar rotación automática de secrets

## 📈 Escalado y Optimización

### Configuración de Recursos

```yaml
# En deployment.yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: market-data-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: market-data
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Optimizaciones de Base de Datos

- ✅ **TimescaleDB** para series temporales
- ✅ **Índices optimizados** en campos frecuentes
- ✅ **Connection pooling** configurado
- ✅ **PVC de 50GB** para PostgreSQL

## 🔄 Próximos Pasos

### Fase 2: Migración Completa
- [ ] Migrar Analysis Engine
- [ ] Migrar Portfolio Manager
- [ ] Migrar ML Prediction Service
- [ ] Configurar Service Mesh (Istio/Linkerd)

### Fase 3: Observabilidad
- [ ] Desplegar Prometheus
- [ ] Configurar Grafana dashboards
- [ ] Implementar Loki para logs centralizados
- [ ] Configurar alertas

### Fase 4: Producción
- [ ] Configurar CI/CD completo
- [ ] Implementar blue-green deployments
- [ ] Configurar backups automáticos
- [ ] Implementar disaster recovery

## 📞 Soporte

### Documentación Relacionada

- [`IMPLEMENTACION_COMPLETADA.md`](../../../IMPLEMENTACION_COMPLETADA.md) - Plan original de implementación
- [`VERIFICACION_IMPLEMENTACION.md`](../../../VERIFICACION_IMPLEMENTACION.md) - Verificación Docker Compose
- [`PLAN_MIGRACION_KUBERNETES.md`](../../../PLAN_MIGRACION_KUBERNETES.md) - Plan completo de migración

### Canales de Comunicación

- **Issues en GitHub** para bugs y mejoras
- **Slack/Discord** para soporte técnico
- **Wiki** para documentación detallada

---

## 🎉 Checklist de Migración

### ✅ Completado
- [x] Estructura de directorios Kubernetes
- [x] Configuración Kind cluster
- [x] Scripts de automatización
- [x] Manifiestos base PostgreSQL + TimescaleDB
- [x] Manifiestos base Redis
- [x] Manifiestos base Market Data Service
- [x] Configuración ArgoCD
- [x] Overlays para desarrollo
- [x] Ingress y networking
- [x] Health checks y probes
- [x] ConfigMaps y Secrets
- [x] Kustomize configuration

### 🔄 Próximas Tareas
- [ ] Testing end-to-end
- [ ] Migración de servicios restantes
- [ ] Configuración de monitoreo
- [ ] Documentación de operaciones

---

**Estado**: ✅ **MIGRACIÓN KUBERNETES LISTA PARA TESTING**

**Fecha**: Diciembre 17, 2025  
**Versión**: 1.0  
**Próximo Milestone**: Testing completo y migración de servicios restantes
