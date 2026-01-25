#!/bin/bash

# Script para acceder a PostgreSQL desde VS Code
echo "🗄️  Datos de conexión PostgreSQL para VS Code"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status() {
    echo -e "${BLUE}[STATUS]${NC} $1"
}

# Obtener contraseña
POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n trii-dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d 2>/dev/null || echo "trii_dev_password")

# Obtener IP del cluster
CLUSTER_IP=$(docker inspect trii-dev-control-plane | grep '"IPAddress":' | tail -1 | cut -d'"' -f4 2>/dev/null || echo "172.18.0.2")

# Verificar si PostgreSQL está funcionando
print_status "Verificando estado de PostgreSQL..."
POSTGRES_POD=$(kubectl get pods -n trii-dev -l app=postgres --no-headers 2>/dev/null | awk '{print $1}' | head -1)

if [ ! -z "$POSTGRES_POD" ]; then
    POSTGRES_STATUS=$(kubectl get pod $POSTGRES_POD -n trii-dev --no-headers | awk '{print $3}')
    if [ "$POSTGRES_STATUS" = "Running" ]; then
        print_success "PostgreSQL está funcionando"
    else
        print_warning "PostgreSQL está en estado: $POSTGRES_STATUS"
    fi
else
    print_warning "No se encontró pod de PostgreSQL"
fi

echo ""
echo "=========================================="
echo "  📊 DATOS DE CONEXIÓN POSTGRESQL"
echo "=========================================="
echo ""

echo "🔗 Opción 1: Conexión directa via NodePort"
echo "   Host: $CLUSTER_IP"
echo "   Puerto: 30432 (si está configurado) o 5432"
echo "   Base de datos: trii_dev"
echo "   Usuario: postgres"
echo "   Contraseña: $POSTGRES_PASSWORD"
echo ""

echo "🔗 Opción 2: Port Forward (Recomendado)"
echo "   1. Ejecuta en terminal: kubectl port-forward -n trii-dev svc/postgres-service 5432:5432"
echo "   2. Usa estos datos en VS Code:"
echo "      Host: localhost"
echo "      Puerto: 5432"
echo "      Base de datos: trii_dev"
echo "      Usuario: postgres"
echo "      Contraseña: $POSTGRES_PASSWORD"
echo ""

echo "🔗 Opción 3: Conexión interna del cluster"
echo "   Host: postgres-service.trii-dev.svc.cluster.local"
echo "   Puerto: 5432"
echo "   Base de datos: trii_dev"
echo "   Usuario: postgres"
echo "   Contraseña: $POSTGRES_PASSWORD"
echo ""

echo "=========================================="
echo "  ⚙️  CONFIGURACIÓN VS CODE POSTGRESQL"
echo "=========================================="
echo ""
echo "1️⃣  Instala la extensión 'PostgreSQL' en VS Code"
echo ""
echo "2️⃣  Configuración de conexión:"
echo '   {
     "host": "localhost",
     "port": 5432,
     "database": "trii_dev",
     "username": "postgres",
     "password": "'$POSTGRES_PASSWORD'"
   }'
echo ""

echo "3️⃣  Para iniciar port forward automáticamente:"
echo "   kubectl port-forward -n trii-dev svc/postgres-service 5432:5432"
echo ""

echo "=========================================="
echo "  🔧 COMANDOS ÚTILES"
echo "=========================================="
echo ""
echo "# Conectarse directamente por terminal:"
echo "kubectl exec -it -n trii-dev $POSTGRES_POD -- psql -U postgres -d trii_dev"
echo ""
echo "# Ver tablas existentes:"
echo "kubectl exec -it -n trii-dev $POSTGRES_POD -- psql -U postgres -d trii_dev -c '\\dt'"
echo ""
echo "# Port forward en background:"
echo "kubectl port-forward -n trii-dev svc/postgres-service 5432:5432 &"
echo ""

# Función para iniciar port forward
start_port_forward() {
    print_status "Iniciando port forward..."
    echo "Presiona Ctrl+C para detener"
    kubectl port-forward -n trii-dev svc/postgres-service 5432:5432
}

# Verificar si se quiere iniciar port forward
if [ "$1" = "--start-forward" ]; then
    start_port_forward
fi

print_success "✅ Información de PostgreSQL lista para VS Code!"
echo ""
print_warning "💡 Para conexión fácil, ejecuta: bash scripts/postgres-access.sh --start-forward"
