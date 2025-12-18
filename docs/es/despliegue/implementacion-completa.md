# 🚀 Implementación Completa de TRII Platform en Kubernetes

Esta guía te acompaña paso a paso en la implementación completa de TRII Platform en un clúster de Kubernetes.

## 📋 Prerrequisitos

### 🔧 Software Requerido

```bash
# Verificar versiones mínimas
kubectl version --client --output=yaml | grep gitVersion
# Debe ser v1.25+

helm version --short
# Debe ser v3.10+

# Opcional pero recomendado
kind --version  # Para desarrollo local
```

### ☸️ Clúster de Kubernetes

Necesitas uno de estos:

1. **Kind** (desarrollo local):
   ```bash
   kind create cluster --config infrastructure/kubernetes/kind/cluster-config.yaml
   ```

2. **Minikube**:
   ```bash
   minikube start --cpus 4 --memory 8192
   ```

3. **Clúster cloud** (AWS EKS, GCP GKE, Azure AKS)

### 🌐 Dominios DNS

Configura estos registros DNS apuntando a tu LoadBalancer:

```
api.trii-platform.com     → [LoadBalancer-IP]
app.trii-platform.com     → [LoadBalancer-IP]
argocd.trii-platform.com  → [LoadBalancer-IP]
grafana.trii-platform.com → [LoadBalancer-IP]
```

---

## ⚡ Despliegue Automático (Recomendado)

### Opción 1: Script Completo

```bash
# Hacer ejecutable el script
chmod +x scripts/deploy-k8s-complete.sh

# Ejecutar despliegue completo
./scripts/deploy-k8s-complete.sh
```

**Tiempo estimado**: 15-20 minutos

### Opción 2: Paso a Paso Manual

#### Paso 1: Instalar cert-manager

```bash
# Agregar repositorio Helm
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Instalar cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.3 \
  --set installCRDs=true \
  --wait

# Verificar
kubectl get pods -n cert-manager
```

#### Paso 2: Instalar NGINX Ingress Controller

```bash
# Agregar repositorio
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Instalar
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --version 4.9.6 \
  --set controller.service.type=LoadBalancer \
  --set controller.metrics.enabled=true \
  --set controller.metrics.serviceMonitor.enabled=true \
  --set controller.metrics.serviceMonitor.additionalLabels.release="prometheus" \
  --wait

# Obtener IP del LoadBalancer
kubectl get svc -n ingress-nginx
# Anota la EXTERNAL-IP para configurar DNS
```

#### Paso 3: Instalar ArgoCD

```bash
# Usar el script dedicado
./infrastructure/kubernetes/argocd/install.sh

# O instalar manualmente
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Esperar a que esté listo
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd

# Obtener contraseña de admin
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

#### Paso 4: Configurar Monitoreo

```bash
# Aplicar configuración de monitoreo
kubectl apply -f infrastructure/kubernetes/base/monitoring/

# Verificar que Prometheus y Grafana estén corriendo
kubectl get pods -n monitoring
```

#### Paso 5: Configurar Ingress

```bash
# Aplicar configuración de ingress
kubectl apply -f infrastructure/kubernetes/base/ingress/ingress.yaml

# Verificar certificados
kubectl get certificates -n trii-dev
```

#### Paso 6: Desplegar Aplicaciones

```bash
# Aplicar configuraciones de aplicaciones
kubectl apply -f infrastructure/kubernetes/argocd/applications/

# Verificar aplicaciones en ArgoCD
kubectl get applications -n argocd
```

---

## 🔍 Verificación del Despliegue

### Estado de Componentes

```bash
# Verificar todos los namespaces
kubectl get namespaces

# Verificar pods por namespace
kubectl get pods -n trii-dev
kubectl get pods -n argocd
kubectl get pods -n monitoring
kubectl get pods -n cert-manager
kubectl get pods -n ingress-nginx

# Verificar servicios
kubectl get svc -n trii-dev
kubectl get svc -n monitoring

# Verificar ingress
kubectl get ingress -n trii-dev
```

### Health Checks

```bash
# Verificar health de servicios
curl -k https://api.trii-platform.com/api/market-data/health
curl -k https://api.trii-platform.com/api/analysis-engine/health
curl -k https://api.trii-platform.com/api/portfolio-manager/health
curl -k https://api.trii-platform.com/api/ml-prediction/health

# Verificar ArgoCD
curl -k https://argocd.trii-platform.com/login

# Verificar Grafana
curl -k https://grafana.trii-platform.com/
```

### Logs de Troubleshooting

```bash
# Logs de aplicaciones TRII
kubectl logs -f deployment/market-data -n trii-dev
kubectl logs -f deployment/analysis-engine -n trii-dev

# Logs de ArgoCD
kubectl logs -f deployment/argocd-server -n argocd

# Logs de monitoreo
kubectl logs -f statefulset/prometheus -n monitoring
kubectl logs -f deployment/grafana -n monitoring

# Logs de ingress
kubectl logs -f deployment/ingress-nginx-controller -n ingress-nginx
```

---

## 🔐 Acceso a Aplicaciones

### ArgoCD (GitOps)

```bash
# URL
https://argocd.trii-platform.com

# Credenciales
Usuario: admin
Contraseña: [ver logs o script de instalación]

# CLI
argocd login argocd.trii-platform.com
```

### Grafana (Monitoreo)

```bash
# URL
https://grafana.trii-platform.com

# Credenciales
Usuario: admin
Contraseña: admin
```

### Aplicación TRII

```bash
# Frontend
https://app.trii-platform.com

# APIs
https://api.trii-platform.com/api/market-data/docs
https://api.trii-platform.com/api/analysis-engine/docs
https://api.trii-platform.com/api/portfolio-manager/docs
https://api.trii-platform.com/api/ml-prediction/docs
```

---

## 📊 Monitoreo y Dashboards

### Configurar Grafana

1. **Acceder a Grafana**:
   - URL: https://grafana.trii-platform.com
   - Usuario: admin
   - Contraseña: admin

2. **Agregar Data Source**:
   - Type: Prometheus
   - URL: http://prometheus.monitoring.svc.cluster.local:9090
   - Access: Server (default)

3. **Importar Dashboards**:
   - Kubernetes cluster monitoring
   - TRII Platform services
   - Node Exporter
   - Container metrics

### Métricas Disponibles

- **Kubernetes**: CPU, memoria, red, disco por namespace/pod
- **TRII Services**: Latencia, throughput, errores por endpoint
- **Base de Datos**: Conexiones, queries lentas, locks
- **Mensajería**: RabbitMQ queues, messages, consumers

---

## 🔄 Gestión con ArgoCD

### Sincronizar Aplicaciones

```bash
# Ver estado de aplicaciones
argocd app list

# Sincronizar aplicación
argocd app sync trii-platform

# Ver logs de sincronización
argocd app logs trii-platform

# Ver diferencias
argocd app diff trii-platform
```

### Gestión de Aplicaciones

```bash
# Crear aplicación
argocd app create trii-platform-staging \
  --repo https://github.com/trii-platform/investment-app \
  --path infrastructure/kubernetes/overlays/staging \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace trii-staging

# Eliminar aplicación
argocd app delete trii-platform-staging
```

---

## 🚨 Solución de Problemas

### Problema: Certificados no se emiten

```bash
# Verificar estado de certificados
kubectl describe certificate trii-platform-tls -n trii-dev

# Verificar cert-manager
kubectl get pods -n cert-manager

# Revisar logs
kubectl logs deployment/cert-manager -n cert-manager
```

### Problema: Ingress no funciona

```bash
# Verificar ingress
kubectl describe ingress trii-platform-ingress -n trii-dev

# Verificar controller
kubectl get pods -n ingress-nginx

# Revisar logs
kubectl logs deployment/ingress-nginx-controller -n ingress-nginx
```

### Problema: Aplicaciones no sincronizan

```bash
# Ver estado detallado
argocd app get trii-platform

# Forzar sincronización
argocd app sync trii-platform --force

# Ver eventos
kubectl get events -n argocd
```

### Problema: Métricas no aparecen

```bash
# Verificar Prometheus targets
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
# Acceder: http://localhost:9090/targets

# Verificar service monitors
kubectl get servicemonitor -n monitoring

# Revisar logs de Prometheus
kubectl logs statefulset/prometheus -n monitoring
```

---

## 📈 Escalado y Optimización

### Escalado Horizontal

```bash
# Escalar deployments
kubectl scale deployment market-data --replicas=3 -n trii-dev

# Escalar statefulsets
kubectl scale statefulset postgres --replicas=2 -n trii-dev

# Configurar HPA (Horizontal Pod Autoscaler)
kubectl apply -f infrastructure/kubernetes/base/hpa/
```

### Optimización de Recursos

```bash
# Verificar uso de recursos
kubectl top pods -n trii-dev
kubectl top nodes

# Ajustar límites
kubectl edit deployment market-data -n trii-dev
# Modificar spec.containers[].resources
```

### Backup y Disaster Recovery

```bash
# Backup de base de datos
kubectl exec -it postgres-0 -n trii-dev -- pg_dump -U postgres trii_dev > backup.sql

# Backup de configuraciones
kubectl get all -n trii-dev -o yaml > trii-dev-backup.yaml

# Backup de PV (si es necesario)
# Usar herramientas como Velero o Stash
```

---

## 🔒 Seguridad

### Configuración SSL/TLS

Los certificados se generan automáticamente con Let's Encrypt. Para producción:

```bash
# Usar cluster issuer de producción
kubectl apply -f infrastructure/kubernetes/base/certificates/cluster-issuer-prod.yaml
```

### Network Policies

```bash
# Aplicar network policies
kubectl apply -f infrastructure/kubernetes/base/network-policies/

# Verificar políticas
kubectl get networkpolicies -n trii-dev
```

### RBAC y Autenticación

```bash
# Configurar OIDC/SAML en ArgoCD
kubectl edit configmap argocd-cm -n argocd

# Configurar autenticación en Grafana
# UI: https://grafana.trii-platform.com > Configuration > Authentication
```

---

## 📚 Próximos Pasos

### Configuración Avanzada

1. **Configurar CI/CD**:
   - GitHub Actions workflows
   - Automated testing
   - Security scanning

2. **Implementar Service Mesh**:
   - Istio o Linkerd
   - Traffic management
   - Observability avanzada

3. **Configurar Backup**:
   - Velero para disaster recovery
   - Database backups automatizados
   - Configuration as code backups

4. **Monitoreo Avanzado**:
   - Alertmanager para notificaciones
   - ELK stack para logs centralizados
   - Jaeger para distributed tracing

5. **Optimización**:
   - Resource optimization
   - Cost optimization
   - Performance monitoring

---

## 🆘 Soporte

### Recursos de Ayuda

- [**Documentación Completa**](../README.md)
- [**Issues en GitHub**](https://github.com/trii-platform/investment-app/issues)
- [**Discord Community**](https://discord.gg/trii-platform)

### Comandos Útiles

```bash
# Ver estado general
kubectl get all --all-namespaces

# Ver recursos por namespace
kubectl get all -n trii-dev
kubectl get all -n argocd
kubectl get all -n monitoring

# Ver logs de todos los pods problemáticos
kubectl get pods --all-namespaces | grep -v Running

# Ver eventos recientes
kubectl get events --sort-by=.metadata.creationTimestamp

# Limpiar recursos
kubectl delete namespace trii-dev-argocd monitoring --ignore-not-found=true
```

---

**¡Felicitaciones! 🎉**

Tu plataforma TRII está completamente desplegada en Kubernetes con:

- ✅ **SSL automático** con Let's Encrypt
- ✅ **GitOps** con ArgoCD
- ✅ **Monitoreo completo** con Prometheus + Grafana
- ✅ **Balanceo de carga** con NGINX Ingress
- ✅ **Escalabilidad automática** lista para configurar

¿Necesitas ayuda con algún paso específico?
