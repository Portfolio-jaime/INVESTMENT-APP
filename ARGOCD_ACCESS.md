# Acceso a ArgoCD - Guía Completa

## ✅ Estado Actual del Cluster

### Cluster Kind
- **Cluster**: `trii-dev` 
- **Estado**: ✅ Funcionando correctamente
- **Nodo**: `trii-dev-control-plane`

### ArgoCD
- **Estado**: ✅ Desplegado y funcionando
- **Namespace**: `argocd`
- **Servicios**: Todos los componentes corriendo

## 🌐 Acceso Web a ArgoCD

### Método 1: Ingress (RECOMENDADO) ✅
```bash
# Ejecutar script automatizado
./scripts/open-argocd-ingress.sh

# O manualmente:
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8888:80 &

# Luego acceder a:
URL: http://argocd.trii-platform.com:8888/
Usuario: admin
Contraseña: LIsUOESBjKh2P5Ro
```

### Método 2: NodePort (Alternativo)
```bash
# Acceso directo via NodePort
URL: http://localhost:8080
Usuario: admin
Contraseña: LIsUOESBjKh2P5Ro
```

### Método 3: Port Forward directo (Respaldo)
```bash
# Si los otros métodos fallan
kubectl port-forward svc/argocd-server -n argocd 8080:80

# Luego acceder a:
URL: http://localhost:8080
```

## 🔧 Configuración del Cluster Kind

### Puertos Expuestos
```
Puerto Local → Puerto Cluster
8080        → 30080 (ArgoCD NodePort)
80          → 80 (Ingress HTTP)
443         → 443 (Ingress HTTPS)
8001        → 8001 (API Gateway)
```

### Verificar Estado
```bash
# Verificar cluster
kubectl get nodes

# Verificar ArgoCD
kubectl get pods -n argocd
kubectl get svc -n argocd
kubectl get ingress -n argocd

# Verificar aplicaciones
kubectl get applications -n argocd
```

## 📁 Estructura de Archivos Limpia

### Archivos de Configuración ArgoCD
- `infrastructure/kubernetes/argocd/ingress/argocd-ingress.yaml` - Configuración principal de ingress
- `infrastructure/kubernetes/argocd/applications/` - Aplicaciones ArgoCD
- `infrastructure/kubernetes/argocd/projects/` - Proyectos ArgoCD

### Archivos Eliminados (Duplicados)
- ~~`infrastructure/kubernetes/base/ingress/argocd-ingress.yaml`~~ ❌ Eliminado
- ~~`infrastructure/kubernetes/base/ingress/argocd-simple-ingress.yaml`~~ ❌ Eliminado

### Script de Acceso Automatizado
- `scripts/open-argocd-ingress.sh` - ✅ Script para abrir ArgoCD via ingress automáticamente

## 🚀 Aplicaciones Disponibles

### Estado de Aplicaciones ArgoCD
```bash
kubectl get applications -n argocd
```

### Microservicios Desplegados
- ✅ `trii-analysis-engine` - Healthy
- ✅ `trii-api-gateway` - Healthy  
- ✅ `trii-desktop-client` - Healthy
- ✅ `trii-infrastructure` - Healthy
- ✅ `trii-market-data` - Healthy
- ✅ `trii-ml-prediction` - Healthy (Problema resuelto)
- ✅ `trii-portfolio-manager` - Healthy
- ✅ `trii-monitoring` - Synced & Healthy

## 🔍 Solución de Problemas

### Problema Resuelto: ml-prediction ImagePullBackOff
- **Causa**: Imagen incompatible con arquitectura ARM64
- **Solución**: Construida imagen local compatible y cargada en Kind
- **Estado**: ✅ Resuelto - Pod funcionando correctamente

### Si ArgoCD no responde:
1. Verificar que el cluster Kind esté ejecutándose
2. Verificar que los pods de ArgoCD estén corriendo
3. Usar port-forward como alternativa
4. Verificar los logs: `kubectl logs -n argocd deploy/argocd-server`

## 📋 Comandos Útiles

```bash
# Obtener contraseña de ArgoCD
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Reiniciar ArgoCD server si es necesario
kubectl rollout restart deployment argocd-server -n argocd

# Ver logs de ArgoCD
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server

# Sincronizar todas las aplicaciones
kubectl patch application -n argocd --type merge --patch '{"operation":{"sync":{"syncStrategy":{"hook":{}}}}}' --all
```

---
**Fecha de actualización**: Enero 5, 2026  
**Estado**: ✅ Cluster funcionando correctamente - Archivos duplicados eliminados
