#!/bin/bash

# Script para recrear el cluster Kind con configuración corregida para ingress en puerto 80
# Incluye backup y restore de configuraciones importantes

set -e

echo "🚀 Recreando cluster Kind con configuración corregida para ingress puerto 80"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
CLUSTER_NAME="trii-dev"
BACKUP_DIR="/tmp/trii-cluster-backup-$(date +%Y%m%d-%H%M%S)"
CONFIG_FILE="infrastructure/kubernetes/kind/cluster-config.yaml"

echo -e "${BLUE}📋 Información del proceso:${NC}"
echo "   - Cluster: $CLUSTER_NAME"
echo "   - Backup: $BACKUP_DIR" 
echo "   - Config: $CONFIG_FILE"
echo ""

# Función para verificar si el cluster existe
check_cluster_exists() {
    if kind get clusters | grep -q "$CLUSTER_NAME"; then
        return 0
    else
        return 1
    fi
}

# Crear directorio de backup
echo -e "${YELLOW}📦 Creando backup de configuraciones...${NC}"
mkdir -p "$BACKUP_DIR"

# Backup de configuraciones de ArgoCD si el cluster existe
if check_cluster_exists; then
    echo "   ✅ Cluster existente encontrado, creando backup..."
    
    # Backup ArgoCD initial admin secret
    kubectl get secret argocd-initial-admin-secret -n argocd -o yaml > "$BACKUP_DIR/argocd-admin-secret.yaml" 2>/dev/null || echo "   ⚠️  No se pudo hacer backup del secret de ArgoCD"
    
    # Backup de aplicaciones ArgoCD
    kubectl get applications -n argocd -o yaml > "$BACKUP_DIR/argocd-applications.yaml" 2>/dev/null || echo "   ⚠️  No se pudo hacer backup de aplicaciones ArgoCD"
    
    # Backup de proyectos ArgoCD
    kubectl get appprojects -n argocd -o yaml > "$BACKUP_DIR/argocd-projects.yaml" 2>/dev/null || echo "   ⚠️  No se pudo hacer backup de proyectos ArgoCD"
    
    # Backup de persistent volumes (si los hay)
    kubectl get pv -o yaml > "$BACKUP_DIR/persistent-volumes.yaml" 2>/dev/null || echo "   ⚠️  No hay persistent volumes para backup"
    
    echo "   ✅ Backup completado en: $BACKUP_DIR"
else
    echo "   ℹ️  No hay cluster existente, no se requiere backup"
fi

# Confirmar antes de proceder
echo ""
echo -e "${RED}⚠️  ADVERTENCIA: Esto eliminará el cluster actual y todos sus datos${NC}"
echo -e "${YELLOW}¿Continuar con la recreación del cluster? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Detener port-forward si está corriendo
echo ""
echo -e "${BLUE}🔌 Deteniendo port-forwards activos...${NC}"
pkill -f "kubectl port-forward.*ingress-nginx" || echo "   ℹ️  No hay port-forwards activos"

# Eliminar cluster existente
if check_cluster_exists; then
    echo -e "${RED}🗑️  Eliminando cluster existente...${NC}"
    kind delete cluster --name "$CLUSTER_NAME"
    echo "   ✅ Cluster eliminado"
else
    echo "   ℹ️  No hay cluster para eliminar"
fi

# Crear nuevo cluster
echo ""
echo -e "${GREEN}🏗️  Creando nuevo cluster con configuración corregida...${NC}"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: Archivo de configuración no encontrado: $CONFIG_FILE"
    exit 1
fi

echo "   📝 Usando configuración: $CONFIG_FILE"
kind create cluster --config "$CONFIG_FILE"
echo "   ✅ Cluster creado exitosamente"

# Verificar que el cluster está funcionando
echo ""
echo -e "${BLUE}🔍 Verificando estado del cluster...${NC}"
kubectl cluster-info
kubectl get nodes
echo "   ✅ Cluster funcionando correctamente"

# Instalar ArgoCD
echo ""
echo -e "${GREEN}🎯 Instalando ArgoCD...${NC}"
echo "   📥 Descargando manifiestos de ArgoCD..."
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "   ⏳ Esperando que ArgoCD esté listo..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
echo "   ✅ ArgoCD instalado y funcionando"

# Instalar nginx-ingress
echo ""
echo -e "${GREEN}🌐 Instalando nginx-ingress controller...${NC}"
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo "   ⏳ Esperando que nginx-ingress esté listo..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
echo "   ✅ nginx-ingress instalado y funcionando"

# Instalar MetalLB
echo ""
echo -e "${GREEN}⚖️  Instalando MetalLB...${NC}"
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.12/config/manifests/metallb-native.yaml

echo "   ⏳ Esperando que MetalLB esté listo..."
kubectl wait --namespace metallb-system \
  --for=condition=ready pod \
  --selector=app=metallb \
  --timeout=90s

# Configurar MetalLB
echo "   ⚙️  Configurando MetalLB..."
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: trii-pool
  namespace: metallb-system
spec:
  addresses:
  - 172.18.255.200-172.18.255.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: empty
  namespace: metallb-system
EOF
echo "   ✅ MetalLB configurado"

# Aplicar configuraciones base de Kubernetes
echo ""
echo -e "${GREEN}⚙️  Aplicando configuraciones base de Kubernetes...${NC}"
if [ -d "infrastructure/kubernetes/base" ]; then
    kubectl apply -k infrastructure/kubernetes/base
    echo "   ✅ Configuraciones base aplicadas"
else
    echo "   ⚠️  No se encontró directorio base, aplicar manualmente después"
fi

# Aplicar configuraciones de ArgoCD
echo ""
echo -e "${GREEN}🎯 Aplicando configuraciones de ArgoCD...${NC}"
if [ -d "infrastructure/kubernetes/argocd" ]; then
    # Aplicar proyectos primero
    if [ -d "infrastructure/kubernetes/argocd/projects" ]; then
        kubectl apply -f infrastructure/kubernetes/argocd/projects/
    fi
    
    # Aplicar aplicaciones
    if [ -d "infrastructure/kubernetes/argocd/applications" ]; then
        kubectl apply -f infrastructure/kubernetes/argocd/applications/
    fi
    
    # Aplicar ingress
    if [ -d "infrastructure/kubernetes/argocd/ingress" ]; then
        kubectl apply -f infrastructure/kubernetes/argocd/ingress/
    fi
    
    echo "   ✅ Configuraciones de ArgoCD aplicadas"
else
    echo "   ⚠️  No se encontró directorio argocd, aplicar manualmente después"
fi

# Obtener credenciales de ArgoCD
echo ""
echo -e "${GREEN}🔑 Obteniendo credenciales de ArgoCD...${NC}"
echo "   ⏳ Esperando que el secret esté disponible..."
sleep 10

ARGOCD_PASSWORD=""
for i in {1..30}; do
    ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d 2>/dev/null || echo "")
    if [ -n "$ARGOCD_PASSWORD" ]; then
        break
    fi
    echo "   ⏳ Intentando obtener password... ($i/30)"
    sleep 2
done

# Verificar puerto 80
echo ""
echo -e "${BLUE}🔍 Verificando configuración del puerto 80...${NC}"
sleep 5  # Esperar que el ingress se configure

# Probar conexión
echo "   🧪 Probando conexión al puerto 80..."
if curl -s -I --connect-timeout 5 http://localhost -H "Host: argocd.trii-platform.com" >/dev/null 2>&1; then
    echo "   ✅ Puerto 80 respondiendo correctamente"
    INGRESS_STATUS="✅ FUNCIONANDO"
else
    echo "   ⚠️  Puerto 80 no responde aún (puede necesitar unos minutos más)"
    INGRESS_STATUS="⏳ CONFIGURÁNDOSE"
fi

# Resumen final
echo ""
echo -e "${GREEN}🎉 ¡Recreación del cluster completada!${NC}"
echo "=================================================================="
echo ""
echo -e "${BLUE}📊 ESTADO DEL CLUSTER:${NC}"
echo "   • Cluster Kind: ✅ $CLUSTER_NAME"
echo "   • ArgoCD: ✅ Instalado"
echo "   • nginx-ingress: ✅ Instalado"
echo "   • MetalLB: ✅ Configurado"
echo "   • Puerto 80: $INGRESS_STATUS"
echo ""
echo -e "${BLUE}🔐 CREDENCIALES DE ACCESO:${NC}"
if [ -n "$ARGOCD_PASSWORD" ]; then
    echo "   • Usuario ArgoCD: admin"
    echo "   • Password ArgoCD: $ARGOCD_PASSWORD"
else
    echo "   • Password ArgoCD: ⚠️  Obtener manualmente con:"
    echo "     kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d"
fi
echo ""
echo -e "${BLUE}🌐 ACCESO WEB:${NC}"
echo "   • ArgoCD (puerto 80): http://argocd.trii-platform.com"
echo "   • ArgoCD (NodePort): http://localhost:8080"
echo ""
echo -e "${BLUE}📁 BACKUP CREADO:${NC}"
echo "   • Ubicación: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASOS:${NC}"
echo "   1. Verificar que todas las aplicaciones estén sincronizadas en ArgoCD"
echo "   2. Probar acceso web: http://argocd.trii-platform.com"
echo "   3. Si el puerto 80 no responde aún, esperar 2-3 minutos"
echo "   4. Hacer commit y push de los cambios a main"
echo ""
echo -e "${GREEN}✅ ¡Listo para usar!${NC}"
