#!/bin/bash

# Script específico para conectar PostgreSQL desde VS Code en cluster Kind
echo "🗄️ PostgreSQL para VS Code en Kind - Solución definitiva"

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

# Verificar que estamos en Kind
print_status "Verificando cluster Kind..."
CLUSTER_NAME=$(kubectl config current-context)
if [[ "$CLUSTER_NAME" == *"kind"* ]]; then
    print_success "Cluster Kind detectado: $CLUSTER_NAME"
else
    print_warning "Puede no ser un cluster Kind: $CLUSTER_NAME"
fi

# Obtener datos de PostgreSQL
POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n trii-dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d 2>/dev/null || echo "trii_dev_password")

# Verificar PostgreSQL
POSTGRES_POD=$(kubectl get pods -n trii-dev -l app=postgres --no-headers 2>/dev/null | awk '{print $1}' | head -1)
if [ -z "$POSTGRES_POD" ]; then
    print_error "PostgreSQL no encontrado"
    exit 1
fi

POSTGRES_STATUS=$(kubectl get pod $POSTGRES_POD -n trii-dev --no-headers | awk '{print $3}')
if [ "$POSTGRES_STATUS" != "Running" ]; then
    print_error "PostgreSQL no está running: $POSTGRES_STATUS"
    exit 1
fi

print_success "PostgreSQL funcionando: $POSTGRES_POD"

# Limpiar puertos locales
print_status "Limpiando puertos locales..."
lsof -ti :5432 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti :5433 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2

# Opción 1: Port forward directo al pod
print_status "Configurando port forward directo al pod PostgreSQL..."
kubectl port-forward -n trii-dev $POSTGRES_POD 5432:5432 > /tmp/postgres-pod-forward.log 2>&1 &
POD_FORWARD_PID=$!
echo "$POD_FORWARD_PID" > /tmp/postgres-pod-forward.pid

# Opción 2: Port forward al servicio en puerto 5433
print_status "Configurando port forward alternativo al servicio..."
kubectl port-forward -n trii-dev svc/postgres-service 5433:5432 > /tmp/postgres-svc-forward.log 2>&1 &
SVC_FORWARD_PID=$!
echo "$SVC_FORWARD_PID" > /tmp/postgres-svc-forward.pid

# Esperar establecimiento de conexiones
sleep 5

# Verificar port forwards
POD_FORWARD_OK=false
SVC_FORWARD_OK=false

if kill -0 $POD_FORWARD_PID 2>/dev/null; then
    if nc -z localhost 5432 2>/dev/null; then
        print_success "✅ Port forward al pod funcionando en puerto 5432"
        POD_FORWARD_OK=true
    else
        print_warning "Port forward al pod iniciado pero puerto no accesible"
    fi
else
    print_error "Port forward al pod falló"
fi

if kill -0 $SVC_FORWARD_PID 2>/dev/null; then
    if nc -z localhost 5433 2>/dev/null; then
        print_success "✅ Port forward al servicio funcionando en puerto 5433"
        SVC_FORWARD_OK=true
    else
        print_warning "Port forward al servicio iniciado pero puerto no accesible"
    fi
else
    print_warning "Port forward al servicio falló"
fi

echo ""
echo "=========================================="
echo "  📊 DATOS DE CONEXIÓN VS CODE"
echo "=========================================="
echo ""

if [ "$POD_FORWARD_OK" = true ]; then
    echo "🔗 OPCIÓN PRINCIPAL (Puerto 5432):"
    echo "   Server name: localhost"
    echo "   Port: 5432"
    echo "   Database: trii_dev"
    echo "   Username: postgres"
    echo "   Password: $POSTGRES_PASSWORD"
    echo "   Connection timeout: 30"
    echo ""
fi

if [ "$SVC_FORWARD_OK" = true ]; then
    echo "🔗 OPCIÓN ALTERNATIVA (Puerto 5433):"
    echo "   Server name: localhost"
    echo "   Port: 5433"
    echo "   Database: trii_dev"
    echo "   Username: postgres"
    echo "   Password: $POSTGRES_PASSWORD"
    echo "   Connection timeout: 30"
    echo ""
fi

# Si ninguno funciona, mostrar diagnóstico
if [ "$POD_FORWARD_OK" = false ] && [ "$SVC_FORWARD_OK" = false ]; then
    print_error "Ningún port forward funcionó"
    echo ""
    echo "Diagnóstico:"
    echo "- Logs pod forward:"
    cat /tmp/postgres-pod-forward.log 2>/dev/null || echo "  No disponible"
    echo "- Logs service forward:"
    cat /tmp/postgres-svc-forward.log 2>/dev/null || echo "  No disponible"
    exit 1
fi

echo "=========================================="
echo "  📱 CONFIGURACIÓN VS CODE"
echo "=========================================="
echo ""
echo "1️⃣ En VS Code, crea nueva conexión PostgreSQL"
echo "2️⃣ Usa los datos de arriba (prueba puerto 5432 primero)"
echo "3️⃣ Aumenta Connection timeout a 30 segundos"
echo "4️⃣ Asegúrate que Authentication Type sea 'Password'"
echo "5️⃣ Haz clic en 'Test Connection' antes de guardar"
echo ""

echo "=========================================="
echo "  🔧 COMANDOS DE CONTROL"
echo "=========================================="
echo ""
echo "# Para detener port forwards:"
echo "kill \$(cat /tmp/postgres-pod-forward.pid 2>/dev/null) 2>/dev/null"
echo "kill \$(cat /tmp/postgres-svc-forward.pid 2>/dev/null) 2>/dev/null"
echo ""
echo "# Para ver procesos de port forward:"
echo "ps aux | grep 'kubectl port-forward'"
echo ""
echo "# Para reiniciar este script:"
echo "bash scripts/postgres-kind-vscode.sh"
echo ""

# Función de limpieza
cleanup() {
    print_status "Cerrando port forwards..."
    kill $POD_FORWARD_PID 2>/dev/null || true
    kill $SVC_FORWARD_PID 2>/dev/null || true
    rm -f /tmp/postgres-*-forward.pid 2>/dev/null || true
    exit 0
}

# Registrar limpieza al salir
trap cleanup INT TERM

print_success "🎉 Port forwards configurados para Kind!"
print_warning "💡 MANTÉN esta terminal abierta mientras uses VS Code"
print_warning "💡 Si la conexión falla, aumenta el timeout a 30 segundos"

echo ""
print_status "Presiona Ctrl+C para detener los port forwards"

# Mantener ambos port forwards ejecutándose
if [ "$POD_FORWARD_OK" = true ] && [ "$SVC_FORWARD_OK" = true ]; then
    print_status "Ambos port forwards activos - puertos 5432 y 5433"
    wait $POD_FORWARD_PID $SVC_FORWARD_PID
elif [ "$POD_FORWARD_OK" = true ]; then
    print_status "Port forward activo en puerto 5432"
    wait $POD_FORWARD_PID
elif [ "$SVC_FORWARD_OK" = true ]; then
    print_status "Port forward activo en puerto 5433"
    wait $SVC_FORWARD_PID
fi
