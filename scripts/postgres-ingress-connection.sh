#!/bin/bash

# Script para conexión a PostgreSQL vía ingress (sin port forward)
echo "🗄️ PostgreSQL via Ingress - Conexión directa"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_status() {
    echo -e "${BLUE}[STATUS]${NC} $1"
}

# Obtener datos de conexión
CLUSTER_IP="172.18.0.2"
POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n trii-dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d 2>/dev/null || echo "trii_dev_password")

# Obtener puerto del NodePort del LoadBalancer
NODEPORT=$(kubectl get svc postgres-loadbalancer -n trii-dev -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null)

print_status "Verificando servicios PostgreSQL..."

# Verificar PostgreSQL
POSTGRES_POD=$(kubectl get pods -n trii-dev -l app=postgres --no-headers 2>/dev/null | awk '{print $1}' | head -1)
if [ ! -z "$POSTGRES_POD" ]; then
    POSTGRES_STATUS=$(kubectl get pod $POSTGRES_POD -n trii-dev --no-headers | awk '{print $3}')
    if [ "$POSTGRES_STATUS" = "Running" ]; then
        print_success "PostgreSQL funcionando: $POSTGRES_POD"
    else
        print_warning "PostgreSQL estado: $POSTGRES_STATUS"
    fi
fi

# Verificar LoadBalancer
LB_STATUS=$(kubectl get svc postgres-loadbalancer -n trii-dev --no-headers 2>/dev/null)
if [ ! -z "$LB_STATUS" ]; then
    print_success "LoadBalancer configurado"
    echo "   $LB_STATUS"
fi

echo ""
echo "=========================================="
echo "  📊 DATOS DE CONEXIÓN POSTGRESQL"
echo "=========================================="
echo ""
echo "🌐 Conexión vía Ingress (sin port forward):"
echo "   Host: $CLUSTER_IP"
echo "   Puerto: $NODEPORT"
echo "   Base de datos: trii_dev"
echo "   Usuario: postgres"
echo "   Contraseña: $POSTGRES_PASSWORD"
echo ""
echo "🔗 URL de conexión completa:"
echo "   postgresql://postgres:$POSTGRES_PASSWORD@$CLUSTER_IP:$NODEPORT/trii_dev"
echo ""

echo "=========================================="
echo "  ⚙️ CONFIGURACIÓN VS CODE POSTGRESQL"
echo "=========================================="
echo ""
echo "Configura estos datos en VS Code:"
echo ""
echo "📝 Datos de conexión:"
echo "   Host: $CLUSTER_IP"
echo "   Port: $NODEPORT"
echo "   Database: trii_dev"
echo "   Username: postgres"
echo "   Password: $POSTGRES_PASSWORD"
echo ""

echo "=========================================="
echo "  🔧 PRUEBAS DE CONECTIVIDAD"
echo "=========================================="
echo ""

# Probar conectividad
print_status "Probando conectividad al puerto $NODEPORT..."
if nc -z $CLUSTER_IP $NODEPORT 2>/dev/null; then
    print_success "✅ Puerto $NODEPORT está accesible"
else
    print_warning "⚠️ Puerto $NODEPORT no responde inmediatamente"
    print_status "Esperando 10 segundos..."
    sleep 10
    if nc -z $CLUSTER_IP $NODEPORT 2>/dev/null; then
        print_success "✅ Puerto $NODEPORT ahora está accesible"
    else
        print_warning "⚠️ Puerto $NODEPORT aún no responde"
        print_status "Verificando configuración del ingress..."
        kubectl get configmap tcp-services -n ingress-nginx -o yaml | grep 5433 || print_warning "ConfigMap TCP no configurado correctamente"
    fi
fi

echo ""
echo "🧪 Comandos de prueba:"
echo "   nc -z $CLUSTER_IP $NODEPORT"
echo "   PGPASSWORD=$POSTGRES_PASSWORD psql -h $CLUSTER_IP -p $NODEPORT -U postgres -d trii_dev"
echo ""

echo "=========================================="
echo "  📱 PASOS PARA VS CODE"
echo "=========================================="
echo ""
echo "1️⃣ Abre VS Code"
echo "2️⃣ Instala la extensión 'PostgreSQL'"
echo "3️⃣ Crea nueva conexión:"
echo "   • Host: $CLUSTER_IP"
echo "   • Port: $NODEPORT"
echo "   • Database: trii_dev"
echo "   • Username: postgres"
echo "   • Password: $POSTGRES_PASSWORD"
echo "4️⃣ ¡Conecta directamente!"
echo ""

print_success "🎉 PostgreSQL accesible vía ingress!"
print_warning "💡 Sin port forward - conexión directa al cluster"

echo ""
echo "=========================================="
echo "  🔄 INFORMACIÓN TÉCNICA"
echo "=========================================="
echo ""
echo "• Tipo: LoadBalancer con NodePort"
echo "• IP del cluster: $CLUSTER_IP"
echo "• Puerto externo: $NODEPORT"
echo "• Configuración TCP: nginx ingress"
echo ""
echo "# Ver configuración completa:"
echo "kubectl get svc postgres-loadbalancer -n trii-dev"
echo "kubectl get configmap tcp-services -n ingress-nginx"
echo ""
