#!/bin/bash

# TRII Platform - ArgoCD Access Setup
# Este script configura el acceso a ArgoCD desde tu PC usando ingress

set -e

echo "🚀 TRII Platform - Configuración de Acceso a ArgoCD"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que ArgoCD esté instalado
check_argocd() {
    print_status "Verificando instalación de ArgoCD..."
    
    if ! kubectl get namespace argocd > /dev/null 2>&1; then
        print_error "Namespace argocd no existe. Instalando ArgoCD..."
        kubectl create namespace argocd
        kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
        
        print_status "Esperando que ArgoCD esté listo..."
        kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd
    fi
    
    print_success "ArgoCD está instalado y listo"
}

# Aplicar ingress
apply_ingress() {
    print_status "Aplicando configuración de ingress..."
    
    kubectl apply -f infrastructure/kubernetes/base/ingress/argocd-simple-ingress.yaml
    
    print_success "Ingress configurado"
}

# Obtener información de acceso
get_access_info() {
    print_status "Obteniendo información de acceso..."
    
    # Obtener IP del cluster
    CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    
    # Obtener puerto del ingress controller
    INGRESS_PORT=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.spec.ports[?(@.name=="http")].port}' 2>/dev/null || echo "80")
    
    # Obtener NodePort como alternativa
    NODE_PORT=$(kubectl get svc -n argocd argocd-server-nodeport -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30080")
    
    # Obtener contraseña de admin
    ADMIN_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "No disponible aún")
    
    # Información de acceso
    echo ""
    echo "=========================================="
    echo "  INFORMACIÓN DE ACCESO A ARGOCD"
    echo "=========================================="
    echo ""
    echo "📍 IP del Cluster: $CLUSTER_IP"
    echo "🚪 Puerto Ingress: $INGRESS_PORT"
    echo "🚪 Puerto NodePort: $NODE_PORT"
    echo ""
    echo "🌐 Opciones de Acceso:"
    echo "   1. Via Ingress: http://argocd.trii-platform.com/"
    echo "   2. Via NodePort: http://$CLUSTER_IP:$NODE_PORT"
    echo ""
    echo "👤 Credenciales:"
    echo "   Usuario: admin"
    echo "   Contraseña: $ADMIN_PASSWORD"
    echo ""
}

# Configurar /etc/hosts
setup_hosts_file() {
    print_status "Configuración para /etc/hosts..."
    
    CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    
    echo ""
    echo "=========================================="
    echo "  CONFIGURACIÓN DE /etc/hosts"
    echo "=========================================="
    echo ""
    echo "Para acceder a ArgoCD desde tu PC usando http://argocd.trii-platform.com/"
    echo "necesitas agregar la siguiente línea a tu archivo /etc/hosts:"
    echo ""
    echo -e "${GREEN}$CLUSTER_IP argocd.trii-platform.com${NC}"
    echo ""
    echo "📝 Comandos para agregar la entrada:"
    echo ""
    echo "# En macOS/Linux:"
    echo "echo '$CLUSTER_IP argocd.trii-platform.com' | sudo tee -a /etc/hosts"
    echo ""
    echo "# En Windows (como Administrador):"
    echo "echo '$CLUSTER_IP argocd.trii-platform.com' >> C:\\Windows\\System32\\drivers\\etc\\hosts"
    echo ""
    print_warning "Nota: Necesitas permisos de administrador para editar el archivo hosts"
}

# Verificar conectividad
test_connectivity() {
    print_status "Probando conectividad..."
    
    CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    NODE_PORT=$(kubectl get svc -n argocd argocd-server-nodeport -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30080")
    
    if curl -s --max-time 5 "http://$CLUSTER_IP:$NODE_PORT" > /dev/null 2>&1; then
        print_success "✅ ArgoCD responde correctamente en el NodePort"
    else
        print_warning "⚠️  ArgoCD puede estar iniciando aún. Inténtalo en unos momentos."
    fi
}

# Mostrar instrucciones finales
show_final_instructions() {
    echo ""
    echo "=========================================="
    echo "  INSTRUCCIONES FINALES"
    echo "=========================================="
    echo ""
    echo "1️⃣  Agregar entrada en /etc/hosts (ver arriba)"
    echo "2️⃣  Abrir navegador en: http://argocd.trii-platform.com/"
    echo "3️⃣  Iniciar sesión con:"
    echo "     Usuario: admin"
    echo "     Contraseña: (mostrada arriba)"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   kubectl get pods -n argocd                 # Verificar pods"
    echo "   kubectl get ingress -n argocd             # Verificar ingress"
    echo "   kubectl logs -n argocd deployment/argocd-server  # Ver logs"
    echo ""
    echo "🔄 Para reiniciar ArgoCD si es necesario:"
    echo "   kubectl rollout restart deployment/argocd-server -n argocd"
    echo ""
}

# Función principal
main() {
    echo "=========================================="
    echo "  TRII Platform - Setup ArgoCD Access"
    echo "=========================================="
    
    check_argocd
    apply_ingress
    sleep 5  # Dar tiempo para que el ingress se configure
    get_access_info
    setup_hosts_file
    test_connectivity
    show_final_instructions
    
    echo ""
    print_success "🎉 Configuración completada!"
    echo ""
}

# Ejecutar función principal
main "$@"
