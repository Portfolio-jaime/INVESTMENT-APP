#!/bin/bash

# Script para arreglar aplicaciones ArgoCD en estado desconocido
set -e

echo "🔧 Reparando aplicaciones ArgoCD en estado desconocido..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Eliminar secret de repositorio problemático
print_info "Eliminando credenciales de repositorio problemáticas..."
kubectl delete secret argocd-repo-creds -n argocd --ignore-not-found=true

# 2. Como el repositorio parece ser público ahora, vamos a probarlo sin credenciales
print_info "Creando nueva configuración de repositorio público..."

# Crear repositorio sin credenciales para repositorio público
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: repo-https-github-portfolio-investment-app
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
type: Opaque
stringData:
  type: git
  url: https://github.com/Portfolio-jaime/INVESTMENT-APP.git
EOF

print_success "Configuración de repositorio creada"

# 3. Limpiar deployments problemáticos
print_info "Limpiando deployments con selector inmutable..."
kubectl delete deployment market-data -n trii-dev --ignore-not-found=true
kubectl delete deployment analysis-engine -n trii-dev --ignore-not-found=true
kubectl delete deployment ml-prediction -n trii-dev --ignore-not-found=true
kubectl delete deployment portfolio-manager -n trii-dev --ignore-not-found=true

# También limpiar en otros namespaces si existen
kubectl delete deployment market-data -n trii-staging --ignore-not-found=true 2>/dev/null || true
kubectl delete deployment market-data -n trii-prod --ignore-not-found=true 2>/dev/null || true

print_success "Deployments problemáticos eliminados"

# 4. Reiniciar componentes de ArgoCD
print_info "Reiniciando componentes de ArgoCD..."
kubectl rollout restart deployment/argocd-repo-server -n argocd
kubectl rollout restart deployment/argocd-application-controller -n argocd
kubectl rollout restart deployment/argocd-server -n argocd

print_info "Esperando que los componentes se reinicien..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-repo-server -n argocd
kubectl wait --for=condition=available --timeout=300s deployment/argocd-application-controller -n argocd
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

print_success "Componentes de ArgoCD reiniciados"

# 5. Forzar refresh de aplicaciones
print_info "Forzando refresh de aplicaciones..."

# Hacer hard refresh de cada aplicación
for app in trii-platform trii-platform-staging trii-platform-prod trii-monitoring; do
    print_info "Refresheando aplicación: $app"
    kubectl patch application $app -n argocd --type='merge' -p='{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}' 2>/dev/null || true
done

# 6. Esperar y verificar estado
print_info "Esperando 60 segundos para que ArgoCD procese los cambios..."
sleep 60

print_info "Estado actual de las aplicaciones:"
kubectl get applications -n argocd -o wide

# 7. Verificar si hay errores específicos
print_info "Verificando errores en aplicaciones..."
for app in trii-platform trii-platform-staging trii-platform-prod trii-monitoring; do
    echo ""
    print_info "=== Aplicación: $app ==="
    
    # Obtener estado de sync
    SYNC_STATUS=$(kubectl get application $app -n argocd -o jsonpath='{.status.sync.status}' 2>/dev/null || echo "Unknown")
    HEALTH_STATUS=$(kubectl get application $app -n argocd -o jsonpath='{.status.health.status}' 2>/dev/null || echo "Unknown")
    
    echo "Sync Status: $SYNC_STATUS"
    echo "Health Status: $HEALTH_STATUS"
    
    # Verificar si hay condiciones de error
    CONDITIONS=$(kubectl get application $app -n argocd -o jsonpath='{.status.conditions[?(@.type=="ComparisonError")].message}' 2>/dev/null || echo "")
    if [ ! -z "$CONDITIONS" ]; then
        print_warning "Error encontrado: $CONDITIONS"
    fi
done

echo ""
print_success "🎉 Script de reparación completado"
print_info "Si las aplicaciones siguen en estado 'Unknown', puede ser necesario:"
print_info "1. Verificar que el repositorio sea accesible públicamente"
print_info "2. Configurar credenciales Git si el repositorio es privado"
print_info "3. Verificar que las rutas de las aplicaciones sean correctas"
print_info "4. Usar 'kubectl describe application <nombre>' para más detalles"

echo ""
print_info "Para sincronizar manualmente una aplicación:"
print_info "kubectl patch application <nombre> -n argocd --type='merge' -p='{\"operation\":{\"sync\":{}}}'"
