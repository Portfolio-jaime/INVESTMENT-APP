#!/bin/bash

# Script de verificación del despliegue completo de TRII Platform
set -e

echo "🔍 Verificando despliegue de TRII Platform"

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

# Obtener IP del cluster
get_cluster_ip() {
    CLUSTER_IP=$(docker inspect trii-dev-control-plane | grep '"IPAddress":' | tail -1 | cut -d'"' -f4 2>/dev/null || kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "172.18.0.2")
    echo $CLUSTER_IP
}

# Verificar ArgoCD
check_argocd() {
    print_status "Verificando ArgoCD..."
    
    ARGOCD_PODS=$(kubectl get pods -n argocd --no-headers 2>/dev/null | wc -l)
    ARGOCD_READY=$(kubectl get pods -n argocd --no-headers 2>/dev/null | grep Running | wc -l)
    
    if [ "$ARGOCD_PODS" -gt 0 ] && [ "$ARGOCD_READY" -eq "$ARGOCD_PODS" ]; then
        print_success "ArgoCD está funcionando ($ARGOCD_READY/$ARGOCD_PODS pods ready)"
        
        # Obtener contraseña de admin
        ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "No disponible")
        
        echo "   URL: http://argocd.trii-platform.com/"
        echo "   Usuario: admin"
        echo "   Contraseña: $ARGOCD_PASSWORD"
    else
        print_error "ArgoCD no está funcionando correctamente"
        return 1
    fi
}

# Verificar aplicaciones ArgoCD
check_argocd_apps() {
    print_status "Verificando aplicaciones ArgoCD..."
    
    APPS=$(kubectl get applications -n argocd --no-headers 2>/dev/null | wc -l)
    if [ "$APPS" -gt 0 ]; then
        print_success "Aplicaciones ArgoCD creadas ($APPS aplicaciones)"
        kubectl get applications -n argocd --no-headers 2>/dev/null | while read line; do
            APP_NAME=$(echo $line | awk '{print $1}')
            APP_HEALTH=$(echo $line | awk '{print $2}')
            APP_SYNC=$(echo $line | awk '{print $3}')
            echo "   - $APP_NAME: Health=$APP_HEALTH, Sync=$APP_SYNC"
        done
    else
        print_warning "No se encontraron aplicaciones ArgoCD"
    fi
}

# Verificar namespace de la aplicación
check_app_namespace() {
    print_status "Verificando namespace de la aplicación..."
    
    if kubectl get namespace trii-dev > /dev/null 2>&1; then
        print_success "Namespace trii-dev existe"
        
        PODS=$(kubectl get pods -n trii-dev --no-headers 2>/dev/null | wc -l)
        RUNNING=$(kubectl get pods -n trii-dev --no-headers 2>/dev/null | grep Running | wc -l)
        
        echo "   Pods: $RUNNING/$PODS running"
        
        if [ "$PODS" -gt 0 ]; then
            kubectl get pods -n trii-dev --no-headers 2>/dev/null | while read line; do
                POD_NAME=$(echo $line | awk '{print $1}')
                POD_STATUS=$(echo $line | awk '{print $3}')
                echo "   - $POD_NAME: $POD_STATUS"
            done
        fi
    else
        print_warning "Namespace trii-dev no existe aún"
    fi
}

# Verificar servicios
check_services() {
    print_status "Verificando servicios..."
    
    SERVICES=$(kubectl get services -n trii-dev --no-headers 2>/dev/null | wc -l)
    if [ "$SERVICES" -gt 0 ]; then
        print_success "Servicios creados ($SERVICES servicios)"
        kubectl get services -n trii-dev --no-headers 2>/dev/null | while read line; do
            SVC_NAME=$(echo $line | awk '{print $1}')
            SVC_TYPE=$(echo $line | awk '{print $2}')
            SVC_CLUSTER_IP=$(echo $line | awk '{print $3}')
            echo "   - $SVC_NAME ($SVC_TYPE): $SVC_CLUSTER_IP"
        done
    else
        print_warning "No se encontraron servicios"
    fi
}

# Verificar ingress
check_ingress() {
    print_status "Verificando ingress..."
    
    INGRESS_COUNT=$(kubectl get ingress -n trii-dev --no-headers 2>/dev/null | wc -l)
    if [ "$INGRESS_COUNT" -gt 0 ]; then
        print_success "Ingress configurado ($INGRESS_COUNT ingress)"
        kubectl get ingress -n trii-dev --no-headers 2>/dev/null | while read line; do
            ING_NAME=$(echo $line | awk '{print $1}')
            ING_HOSTS=$(echo $line | awk '{print $3}')
            echo "   - $ING_NAME: $ING_HOSTS"
        done
    else
        print_warning "No se encontró configuración de ingress"
    fi
}

# Generar información de acceso
generate_access_info() {
    CLUSTER_IP=$(get_cluster_ip)
    
    echo ""
    echo "=========================================="
    echo "  🌐 INFORMACIÓN DE ACCESO"
    echo "=========================================="
    echo ""
    echo "📍 IP del Cluster: $CLUSTER_IP"
    echo ""
    echo "🎛️  ArgoCD (Gestión GitOps):"
    echo "   http://argocd.trii-platform.com/"
    echo "   Usuario: admin | Contraseña: (ver arriba)"
    echo ""
    echo "🖥️  Aplicación Principal:"
    echo "   http://app.trii-platform.com/"
    echo ""
    echo "🔧 APIs:"
    echo "   http://api.trii-platform.com/api/market-data"
    echo "   http://api.trii-platform.com/api/analysis-engine"
    echo "   http://api.trii-platform.com/api/portfolio-manager"
    echo "   http://api.trii-platform.com/api/ml-prediction"
    echo "   http://api.trii-platform.com/docs"
    echo ""
    echo "📊 Monitoreo:"
    echo "   http://grafana.trii-platform.com/"
    echo ""
    echo "🚪 Acceso directo via NodePort:"
    echo "   Frontend: http://$CLUSTER_IP:30300"
    echo "   Market Data: http://$CLUSTER_IP:30801"
    echo "   Analysis Engine: http://$CLUSTER_IP:30802"
    echo "   Portfolio Manager: http://$CLUSTER_IP:30803"
    echo "   ML Prediction: http://$CLUSTER_IP:30804"
    echo ""
}

# Generar configuración de /etc/hosts
generate_hosts_config() {
    CLUSTER_IP=$(get_cluster_ip)
    
    echo "=========================================="
    echo "  📝 CONFIGURACIÓN /etc/hosts"
    echo "=========================================="
    echo ""
    echo "Agrega estas líneas a tu archivo /etc/hosts:"
    echo ""
    echo "$CLUSTER_IP argocd.trii-platform.com"
    echo "$CLUSTER_IP app.trii-platform.com"
    echo "$CLUSTER_IP api.trii-platform.com"
    echo "$CLUSTER_IP grafana.trii-platform.com"
    echo ""
    echo "💻 Comando para agregar automáticamente:"
    echo ""
    cat << EOF
echo "$CLUSTER_IP argocd.trii-platform.com" | sudo tee -a /etc/hosts
echo "$CLUSTER_IP app.trii-platform.com" | sudo tee -a /etc/hosts
echo "$CLUSTER_IP api.trii-platform.com" | sudo tee -a /etc/hosts
echo "$CLUSTER_IP grafana.trii-platform.com" | sudo tee -a /etc/hosts
EOF
    echo ""
}

# Mostrar comandos útiles
show_useful_commands() {
    echo "=========================================="
    echo "  🔧 COMANDOS ÚTILES"
    echo "=========================================="
    echo ""
    echo "Verificar estado general:"
    echo "  kubectl get all -n trii-dev"
    echo "  kubectl get applications -n argocd"
    echo ""
    echo "Ver logs de servicios:"
    echo "  kubectl logs -n trii-dev deployment/market-data-service"
    echo "  kubectl logs -n trii-dev deployment/analysis-engine-service"
    echo ""
    echo "Sincronizar aplicaciones ArgoCD:"
    echo "  kubectl patch app trii-platform -n argocd --type='merge' -p='{\"operation\":{\"sync\":{\"revision\":\"HEAD\"}}}'"
    echo ""
    echo "Reiniciar servicios:"
    echo "  kubectl rollout restart deployment/market-data-service -n trii-dev"
    echo ""
    echo "Ver estado de ArgoCD:"
    echo "  kubectl get pods -n argocd"
    echo ""
}

# Función principal
main() {
    echo "=========================================="
    echo "  🚀 VERIFICACIÓN TRII PLATFORM"
    echo "=========================================="
    
    check_argocd
    echo ""
    check_argocd_apps
    echo ""
    check_app_namespace
    echo ""
    check_services
    echo ""
    check_ingress
    
    generate_access_info
    generate_hosts_config
    show_useful_commands
    
    echo ""
    print_success "🎉 Verificación completada!"
    echo ""
    print_warning "💡 Recuerda agregar las entradas a /etc/hosts para acceder desde tu navegador"
    echo ""
}

# Ejecutar función principal
main "$@"
