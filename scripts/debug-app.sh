#!/bin/bash

# Script de debug para la aplicación TRII Platform
set -e

echo "🔍 Debug de TRII Platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para revisar logs de un deployment
check_deployment_logs() {
    local deployment=$1
    print_status "Revisando logs de $deployment..."
    
    # Verificar si el deployment existe
    if kubectl get deployment -n trii-dev $deployment > /dev/null 2>&1; then
        # Verificar estado del deployment
        REPLICAS=$(kubectl get deployment -n trii-dev $deployment -o jsonpath='{.status.replicas}')
        READY=$(kubectl get deployment -n trii-dev $deployment -o jsonpath='{.status.readyReplicas}')
        
        if [ "$READY" = "$REPLICAS" ]; then
            print_success "$deployment está funcionando ($READY/$REPLICAS replicas ready)"
        else
            print_error "$deployment tiene problemas ($READY/$REPLICAS replicas ready)"
        fi
        
        # Mostrar logs recientes
        echo "   Logs recientes:"
        kubectl logs -n trii-dev deployment/$deployment --tail=5 2>/dev/null | sed 's/^/   /'
        
        # Verificar eventos del pod
        POD=$(kubectl get pods -n trii-dev -l app=${deployment} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        if [ ! -z "$POD" ]; then
            EVENTS=$(kubectl get events -n trii-dev --field-selector involvedObject.name=$POD --no-headers 2>/dev/null | tail -3)
            if [ ! -z "$EVENTS" ]; then
                echo "   Eventos recientes:"
                echo "$EVENTS" | sed 's/^/   /'
            fi
        fi
    else
        print_error "$deployment no existe"
    fi
    echo ""
}

# Función para verificar conectividad entre servicios
test_service_connectivity() {
    local service=$1
    local port=$2
    print_status "Probando conectividad a $service:$port..."
    
    # Crear un pod temporal para testing
    kubectl run test-pod --rm -i --tty --restart=Never --image=nicolaka/netshoot -n trii-dev -- sh -c "curl -m 5 $service:$port/health || curl -m 5 $service:$port || echo 'No response'" 2>/dev/null || print_warning "No se pudo probar conectividad"
}

# Verificar estado de base de datos
check_database() {
    print_status "Verificando base de datos PostgreSQL..."
    
    # Revisar logs de PostgreSQL
    POSTGRES_POD=$(kubectl get pods -n trii-dev -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ ! -z "$POSTGRES_POD" ]; then
        print_status "Pod PostgreSQL: $POSTGRES_POD"
        kubectl logs -n trii-dev $POSTGRES_POD --tail=10 2>/dev/null | grep -E "(ready|error|FATAL)" | sed 's/^/   /' || echo "   No logs disponibles"
        
        # Probar conexión a PostgreSQL
        print_status "Probando conexión a PostgreSQL..."
        kubectl exec -n trii-dev $POSTGRES_POD -- psql -U postgres -c "SELECT version();" 2>/dev/null | sed 's/^/   /' || print_warning "No se pudo conectar a PostgreSQL"
    else
        print_error "No se encontró pod de PostgreSQL"
    fi
    echo ""
}

# Verificar servicios de infraestructura
check_infrastructure() {
    print_status "Verificando servicios de infraestructura..."
    
    # Redis
    REDIS_POD=$(kubectl get pods -n trii-dev -l app=redis -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ ! -z "$REDIS_POD" ]; then
        print_status "Redis:"
        kubectl exec -n trii-dev $REDIS_POD -- redis-cli ping 2>/dev/null | sed 's/^/   /' || print_warning "Redis no responde"
    fi
    
    # RabbitMQ
    RABBITMQ_POD=$(kubectl get pods -n trii-dev -l app=rabbitmq -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ ! -z "$RABBITMQ_POD" ]; then
        print_status "RabbitMQ:"
        kubectl exec -n trii-dev $RABBITMQ_POD -- rabbitmqctl status 2>/dev/null | grep -E "(Status|Node)" | sed 's/^/   /' || print_warning "RabbitMQ no responde"
    fi
    
    # MinIO
    MINIO_POD=$(kubectl get pods -n trii-dev -l app=minio -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ ! -z "$MINIO_POD" ]; then
        print_status "MinIO:"
        kubectl logs -n trii-dev $MINIO_POD --tail=3 2>/dev/null | sed 's/^/   /' || print_warning "No se pueden obtener logs de MinIO"
    fi
    echo ""
}

# Probar endpoints HTTP
test_http_endpoints() {
    print_status "Probando endpoints HTTP..."
    
    CLUSTER_IP=$(docker inspect trii-dev-control-plane | grep '"IPAddress":' | tail -1 | cut -d'"' -f4 2>/dev/null || echo "172.18.0.2")
    
    # Probar NodePorts directos
    print_status "Probando NodePorts directos:"
    
    for service_port in "market-data:30801" "analysis-engine:30802" "portfolio-manager:30803" "ml-prediction:30804"; do
        service=$(echo $service_port | cut -d: -f1)
        port=$(echo $service_port | cut -d: -f2)
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://$CLUSTER_IP:$port/health" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            print_success "$service responde correctamente (HTTP $HTTP_CODE)"
        elif [ "$HTTP_CODE" = "000" ]; then
            print_error "$service no responde (timeout/error de conexión)"
        else
            print_warning "$service responde con código HTTP $HTTP_CODE"
        fi
    done
    echo ""
}

# Verificar configuración de secrets y configmaps
check_configuration() {
    print_status "Verificando configuración..."
    
    # ConfigMaps
    CONFIGMAPS=$(kubectl get configmaps -n trii-dev --no-headers | wc -l)
    print_status "ConfigMaps encontrados: $CONFIGMAPS"
    kubectl get configmaps -n trii-dev --no-headers | sed 's/^/   /'
    
    # Secrets
    SECRETS=$(kubectl get secrets -n trii-dev --no-headers | wc -l)
    print_status "Secrets encontrados: $SECRETS"
    kubectl get secrets -n trii-dev --no-headers | sed 's/^/   /'
    
    echo ""
}

# Mostrar resumen de problemas
show_problem_summary() {
    print_status "Resumen de problemas comunes y soluciones:"
    echo ""
    echo "🔧 Soluciones comunes:"
    echo ""
    echo "1. Si las imágenes Docker no se pueden descargar:"
    echo "   kubectl describe pod <pod-name> -n trii-dev"
    echo ""
    echo "2. Si hay problemas de conectividad a la base de datos:"
    echo "   kubectl exec -n trii-dev <postgres-pod> -- psql -U postgres -c \"\\l\""
    echo ""
    echo "3. Para reiniciar un servicio específico:"
    echo "   kubectl rollout restart deployment/<deployment-name> -n trii-dev"
    echo ""
    echo "4. Para ver logs en tiempo real:"
    echo "   kubectl logs -f deployment/<deployment-name> -n trii-dev"
    echo ""
    echo "5. Para verificar variables de entorno:"
    echo "   kubectl exec -n trii-dev <pod-name> -- env | grep POSTGRES"
    echo ""
    echo "6. Para probar conectividad interna:"
    echo "   kubectl run tmp-shell --rm -i --tty --image busybox -n trii-dev -- /bin/sh"
    echo ""
}

# Función principal
main() {
    echo "=========================================="
    echo "  🔍 DEBUG TRII PLATFORM"
    echo "=========================================="
    
    check_database
    check_infrastructure
    
    # Revisar deployments de la aplicación
    for deployment in market-data analysis-engine portfolio-manager ml-prediction; do
        check_deployment_logs $deployment
    done
    
    check_configuration
    test_http_endpoints
    show_problem_summary
    
    print_success "🎉 Debug completado!"
    echo ""
}

# Ejecutar función principal
main "$@"
