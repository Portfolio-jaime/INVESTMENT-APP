# TRII Platform - ArgoCD Configuration

## 📋 Descripción

Esta configuración implementa ArgoCD para GitOps en la plataforma TRII Investment App, proporcionando despliegue continuo y gestión de aplicaciones en Kubernetes.

## 🏗️ Estructura del Proyecto

```
argocd/
├── README.md                    # Esta documentación
├── install.sh                  # Script de instalación principal
├── applications/                # Definiciones de aplicaciones
│   ├── monitoring.yaml          # Apps de monitoreo
│   ├── trii-platform.yaml      # Aplicación principal (dev, staging, prod)
│   ├── monitoring-application.yaml
│   └── trii-dev.yaml
├── config/                      # Configuraciones de ArgoCD
│   └── rbac.yaml               # RBAC y políticas de acceso
├── projects/                    # Proyectos de ArgoCD
│   └── trii-platform-project.yaml
├── ingress/                     # Configuración de acceso web
│   └── argocd-ingress.yaml
└── monitoring/                  # Monitoreo y alertas
    └── servicemonitor.yaml
```

## 🚀 Instalación y Configuración

### Prerequisitos

```bash
# Verificar herramientas necesarias
kubectl version --client
kind version  # Solo para desarrollo local
docker version
```

### Instalación Rápida

```bash
# Instalar ArgoCD completo
./infrastructure/kubernetes/argocd/install.sh

# O usar el script completo con cluster local
./scripts/complete-argocd-setup.sh
```

### Instalación Manual

1. **Crear namespace y instalar ArgoCD**:
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

2. **Aplicar configuraciones personalizadas**:
```bash
kubectl apply -f infrastructure/kubernetes/argocd/config/
kubectl apply -f infrastructure/kubernetes/argocd/projects/
kubectl apply -f infrastructure/kubernetes/argocd/applications/
kubectl apply -f infrastructure/kubernetes/argocd/ingress/
kubectl apply -f infrastructure/kubernetes/argocd/monitoring/
```

3. **Obtener password inicial**:
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

## 🌐 Acceso a ArgoCD

### URLs de Acceso

- **Producción**: https://argocd.trii-platform.com
- **Desarrollo**: http://argocd-dev.trii-platform.com
- **Local (NodePort)**: http://localhost:30080

### Credenciales

- **Usuario**: admin
- **Contraseña**: Obtenida del secret inicial (ver comando arriba)

### Configuración DNS Local

Para desarrollo local, agregar a `/etc/hosts`:
```bash
# Obtener IP del cluster
CLUSTER_IP=$(docker inspect trii-dev-control-plane | grep '"IPAddress":' | tail -1 | cut -d'"' -f4)
echo "$CLUSTER_IP argocd.trii-platform.com" | sudo tee -a /etc/hosts
```

## 📱 Aplicaciones Configuradas

### 1. TRII Platform (Principal)

| Ambiente | Namespace | Sync Policy | Branch/Tag |
|----------|-----------|-------------|------------|
| Development | `trii-dev` | Automated | `HEAD` |
| Staging | `trii-staging` | Automated | `HEAD` |
| Production | `trii-prod` | Manual | `tags/v1.0.0` |

### 2. Monitoreo

- **Prometheus**: Métricas y alertas
- **Grafana**: Dashboards y visualización
- **Loki**: Agregación de logs
- **AlertManager**: Gestión de alertas

### 3. Infraestructura

- **cert-manager**: Gestión de certificados SSL
- **ingress-nginx**: Controlador de ingress
- **ArgoCD**: Auto-gestión y monitoreo

## 🔐 RBAC y Seguridad

### Roles Definidos

1. **Admin**:
   - Acceso completo a todas las aplicaciones
   - Gestión de proyectos y configuraciones
   - Usuarios: `alice@trii-platform.com`

2. **Developer**:
   - Ver y sincronizar aplicaciones
   - Acceso a logs y métricas
   - Sin permisos de eliminación en staging/prod
   - Usuarios: `bob@trii-platform.com`

3. **ReadOnly**:
   - Solo lectura
   - Ver estado y logs
   - Usuarios: `charlie@trii-platform.com`

### Configuración de Usuarios

```bash
# Crear cuenta de usuario
argocd account update-password --account developer

# Asignar roles (desde UI o CLI)
argocd proj role add-policy trii-platform developer -p "p, proj:trii-platform:developer, applications, sync, trii-platform/*, allow"
```

## 📊 Monitoreo y Alertas

### Métricas Disponibles

- **Application Health**: Estado de salud de aplicaciones
- **Sync Status**: Estado de sincronización
- **Repository Operations**: Operaciones Git
- **Performance**: Latencia y throughput

### Alertas Configuradas

1. **ArgoCDAppHealthDegraded**: Aplicación no saludable > 15min
2. **ArgoCDAppSyncFailed**: Fallo en sincronización
3. **ArgoCDServerDown**: Servidor ArgoCD caído
4. **ArgoCDRepoServerDown**: Repository server caído

### Dashboard Grafana

Accede al dashboard en: `http://grafana.trii-platform.com/d/argocd`

## 🛠️ Comandos Útiles

### Gestión de Aplicaciones

```bash
# Listar aplicaciones
argocd app list

# Ver detalles de una aplicación
argocd app get trii-platform

# Sincronizar aplicación
argocd app sync trii-platform

# Ver logs de aplicación
argocd app logs trii-platform

# Ver estado de sync
argocd app wait trii-platform --health
```

### Gestión de Repositorios

```bash
# Listar repositorios
argocd repo list

# Añadir repositorio privado
argocd repo add https://github.com/Portfolio-jaime/INVESTMENT-APP.git --username <user> --password <token>

# Probar conexión a repositorio
argocd repo get https://github.com/Portfolio-jaime/INVESTMENT-APP.git
```

### Gestión de Clusters

```bash
# Listar clusters
argocd cluster list

# Añadir cluster
argocd cluster add <context-name>

# Ver información de cluster
argocd cluster get https://kubernetes.default.svc
```

### Debugging

```bash
# Ver eventos de aplicación
kubectl get events -n argocd --sort-by='.lastTimestamp'

# Ver logs del servidor ArgoCD
kubectl logs -n argocd deployment/argocd-server

# Ver logs del repository server
kubectl logs -n argocd deployment/argocd-repo-server

# Verificar estado de pods
kubectl get pods -n argocd
```

## 🔄 Workflows Comunes

### Desplegar Nueva Versión

1. **Desarrollo**:
   - Push a rama `main`
   - ArgoCD sincroniza automáticamente en 3min

2. **Staging**:
   - Push a rama `main`
   - ArgoCD sincroniza automáticamente
   - Verificar en staging environment

3. **Producción**:
   - Crear tag: `git tag v1.0.1`
   - Push tag: `git push origin v1.0.1`
   - Actualizar aplicación prod manualmente
   - Sincronizar desde UI o CLI

### Rollback

```bash
# Ver historia de despliegues
argocd app history trii-platform

# Rollback a revisión anterior
argocd app rollback trii-platform <revision-id>

# Rollback automático desde UI
```

### Configurar Webhook

```bash
# GitHub webhook URL
https://argocd.trii-platform.com/api/webhook

# Payload URL configuration in GitHub:
# - URL: https://argocd.trii-platform.com/api/webhook
# - Content type: application/json
# - Events: Push events, Pull request events
```

## 🚨 Solución de Problemas

### Aplicación en Estado "OutOfSync"

```bash
# Verificar diferencias
argocd app diff trii-platform

# Forzar sincronización
argocd app sync trii-platform --force

# Sincronizar con prune
argocd app sync trii-platform --prune
```

### Error de Conexión a Repositorio

```bash
# Verificar credenciales
argocd repo get https://github.com/Portfolio-jaime/INVESTMENT-APP.git

# Actualizar credenciales
argocd repo add https://github.com/Portfolio-jaime/INVESTMENT-APP.git --upsert --username <user> --password <token>
```

### Aplicación en Estado "Degraded"

```bash
# Ver recursos con problemas
argocd app get trii-platform --show-details

# Ver logs de pods específicos
kubectl logs -n trii-dev deployment/portfolio-manager

# Verificar eventos
kubectl get events -n trii-dev --sort-by='.lastTimestamp'
```

## 📞 Soporte

Para soporte adicional:

1. **Documentación**: Consulta los archivos en `docs/`
2. **Scripts**: Usa scripts en `scripts/` para tareas comunes
3. **Logs**: Revisa logs de ArgoCD y aplicaciones
4. **Monitoreo**: Verifica alertas en Grafana/Prometheus

## 🔗 Enlaces Útiles

- [ArgoCD Official Docs](https://argoproj.github.io/argo-cd/)
- [Kustomize Guide](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/)
- [TRII Platform Architecture](../../../docs/es/01-arquitectura/)

---
**Última actualización**: Diciembre 2025
**Versión**: 1.0.0
**Mantenedor**: TRII Platform Team
