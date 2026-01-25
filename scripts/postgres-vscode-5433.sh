#!/bin/bash

# Script para configurar PostgreSQL en puerto 5433 para VS Code
echo "🗄️ Configurando PostgreSQL en puerto 5433 para VS Code"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Obtener datos de conexión
POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n trii-dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d 2>/dev/null || echo "trii_dev_password")

# Verificar PostgreSQL
print_status "Verificando PostgreSQL..."
POSTGRES_POD=$(kubectl get pods -n trii-dev -l app=postgres --no-headers 2>/dev/null | awk '{print $1}' | head -1)

if [ -z "$POSTGRES_POD" ]; then
    print_error "No se encontró pod de PostgreSQL"
    exit 1
fi

POSTGRES_STATUS=$(kubectl get pod $POSTGRES_POD -n trii-dev --no-headers | awk '{print $3}')
if [ "$POSTGRES_STATUS" != "Running" ]; then
    print_error "PostgreSQL no está funcionando. Estado: $POSTGRES_STATUS"
    exit 1
fi

print_success "PostgreSQL está funcionando: $POSTGRES_POD"

# Verificar y terminar procesos en puerto 5433
print_status "Preparando puerto 5433..."
PORT_IN_USE=$(lsof -i :5433 2>/dev/null || echo "")
if [ ! -z "$PORT_IN_USE" ]; then
    print_warning "Puerto 5433 ya está en uso. Terminando procesos..."
    sudo lsof -ti :5433 | xargs sudo kill -9 2>/dev/null || true
    sleep 2
fi

# Iniciar port forward
print_status "Iniciando port forward a localhost:5433..."
kubectl port-forward -n trii-dev svc/postgres-service 5433:5432 > /tmp/postgres-5433.log 2>&1 &
PORT_FORWARD_PID=$!

# Guardar PID
echo "$PORT_FORWARD_PID" > /tmp/postgres-5433.pid

# Esperar conexión
sleep 3

# Verificar port forward
if kill -0 $PORT_FORWARD_PID 2>/dev/null; then
    print_success "Port forward iniciado (PID: $PORT_FORWARD_PID)"
else
    print_error "No se pudo iniciar port forward"
    cat /tmp/postgres-5433.log 2>/dev/null || true
    exit 1
fi

# Probar conectividad
print_status "Probando conectividad..."
if nc -z localhost 5433 2>/dev/null; then
    print_success "✅ Puerto 5433 está accesible en localhost"
else
    sleep 2
    if nc -z localhost 5433 2>/dev/null; then
        print_success "✅ Puerto 5433 está accesible en localhost (segundo intento)"
    else
        print_warning "⚠️ Puerto 5433 no responde inmediatamente"
    fi
fi

echo ""
echo "=========================================="
echo "  📊 DATOS DE CONEXIÓN VS CODE"
echo "=========================================="
echo ""
echo "🔗 Configuración para VS Code PostgreSQL:"
echo "   Host: localhost"
echo "   Puerto: 5433"
echo "   Database: trii_dev"
echo "   Username: postgres"
echo "   Password: $POSTGRES_PASSWORD"
echo ""
echo "🌐 URL de conexión completa:"
echo "   postgresql://postgres:$POSTGRES_PASSWORD@localhost:5433/trii_dev"
echo ""

echo "=========================================="
echo "  📱 PASOS PARA VS CODE"
echo "=========================================="
echo ""
echo "1️⃣ Abre VS Code"
echo "2️⃣ Instala la extensión 'PostgreSQL'"
echo "3️⃣ Crea nueva conexión:"
echo "   • Host: localhost"
echo "   • Port: 5433"
echo "   • Database: trii_dev"
echo "   • Username: postgres"
echo "   • Password: $POSTGRES_PASSWORD"
echo "4️⃣ ¡Conecta!"
echo ""

echo "=========================================="
echo "  🔧 COMANDOS DE CONTROL"
echo "=========================================="
echo ""
echo "# Para detener port forward:"
echo "kill \$(cat /tmp/postgres-5433.pid 2>/dev/null) 2>/dev/null"
echo ""
echo "# Para probar conexión:"
echo "PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 5433 -U postgres -d trii_dev"
echo ""
echo "# Para verificar puerto:"
echo "nc -z localhost 5433"
echo ""

print_success "🎉 PostgreSQL configurado en puerto 5433!"
print_warning "💡 Mantén esta terminal abierta para mantener la conexión"

# Función para limpiar al salir
cleanup() {
    print_status "Limpiando port forward..."
    kill $PORT_FORWARD_PID 2>/dev/null || true
    rm -f /tmp/postgres-5433.pid 2>/dev/null || true
    exit 0
}

# Registrar función de limpieza
trap cleanup INT TERM

echo ""
print_status "Presiona Ctrl+C para detener el port forward"
print_status "Port forward activo en localhost:5433 -> PostgreSQL"

# Mantener el script ejecutándose
wait $PORT_FORWARD_PID
