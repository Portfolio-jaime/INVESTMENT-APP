#!/bin/bash

# Script para configurar PostgreSQL para VS Code
echo "🗄️ Configurando PostgreSQL para VS Code"

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

# Verificar que PostgreSQL esté funcionando
check_postgres() {
    print_status "Verificando PostgreSQL..."
    
    POSTGRES_POD=$(kubectl get pods -n trii-dev -l app=postgres --no-headers 2>/dev/null | awk '{print $1}' | head -1)
    
    if [ -z "$POSTGRES_POD" ]; then
        print_error "No se encontró pod de PostgreSQL"
        return 1
    fi
    
    POSTGRES_STATUS=$(kubectl get pod $POSTGRES_POD -n trii-dev --no-headers | awk '{print $3}')
    
    if [ "$POSTGRES_STATUS" != "Running" ]; then
        print_error "PostgreSQL no está funcionando. Estado: $POSTGRES_STATUS"
        return 1
    fi
    
    print_success "PostgreSQL está funcionando: $POSTGRES_POD"
    return 0
}

# Probar conectividad interna
test_postgres_internal() {
    print_status "Probando conectividad interna a PostgreSQL..."
    
    POSTGRES_POD=$(kubectl get pods -n trii-dev -l app=postgres --no-headers | awk '{print $1}' | head -1)
    
    # Probar conexión básica
    TEST_RESULT=$(kubectl exec -n trii-dev $POSTGRES_POD -- psql -U postgres -d trii_dev -c "SELECT 1;" 2>/dev/null || echo "FAILED")
    
    if echo "$TEST_RESULT" | grep -q "1"; then
        print_success "PostgreSQL acepta conexiones correctamente"
        return 0
    else
        print_error "PostgreSQL no acepta conexiones"
        print_status "Intentando diagnosticar..."
        kubectl exec -n trii-dev $POSTGRES_POD -- psql -U postgres -c "SELECT version();" 2>&1 | head -3
        return 1
    fi
}

# Obtener datos de conexión
get_connection_data() {
    print_status "Obteniendo datos de conexión..."
    
    # Obtener contraseña
    POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n trii-dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d 2>/dev/null)
    
    # Verificar que el servicio existe
    SERVICE_EXISTS=$(kubectl get svc postgres-service -n trii-dev --no-headers 2>/dev/null | wc -l)
    
    if [ "$SERVICE_EXISTS" -eq 0 ]; then
        print_error "Servicio postgres-service no existe"
        return 1
    fi
    
    print_success "Datos obtenidos correctamente"
    echo "   Contraseña: $POSTGRES_PASSWORD"
    return 0
}

# Configurar port forward
setup_port_forward() {
    print_status "Configurando port forward..."
    
    # Verificar si ya hay algo usando el puerto 5432
    PORT_IN_USE=$(lsof -i :5432 2>/dev/null || echo "")
    
    if [ ! -z "$PORT_IN_USE" ]; then
        print_warning "Puerto 5432 ya está en uso:"
        echo "$PORT_IN_USE"
        print_status "Terminando procesos en puerto 5432..."
        sudo lsof -ti :5432 | xargs sudo kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Iniciar port forward en background
    print_status "Iniciando port forward a PostgreSQL..."
    kubectl port-forward -n trii-dev svc/postgres-service 5432:5432 > /tmp/postgres-port-forward.log 2>&1 &
    PORT_FORWARD_PID=$!
    
    # Esperar un momento para que se establezca la conexión
    sleep 3
    
    # Verificar que el port forward funciona
    if kill -0 $PORT_FORWARD_PID 2>/dev/null; then
        print_success "Port forward iniciado (PID: $PORT_FORWARD_PID)"
        echo "$PORT_FORWARD_PID" > /tmp/postgres-port-forward.pid
        return 0
    else
        print_error "No se pudo iniciar port forward"
        cat /tmp/postgres-port-forward.log 2>/dev/null || true
        return 1
    fi
}

# Probar conexión local
test_local_connection() {
    print_status "Probando conexión local..."
    
    # Usar psql si está disponible
    if command -v psql &> /dev/null; then
        print_status "Probando con psql local..."
        PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 5432 -U postgres -d trii_dev -c "SELECT 'Connection successful!' as status;" 2>/dev/null
        if [ $? -eq 0 ]; then
            print_success "✅ Conexión local exitosa!"
            return 0
        fi
    fi
    
    # Usar curl como alternativa
    print_status "Probando conectividad del puerto..."
    if nc -z localhost 5432 2>/dev/null; then
        print_success "Puerto 5432 está accesible"
        return 0
    else
        print_error "Puerto 5432 no está accesible"
        return 1
    fi
}

# Mostrar instrucciones para VS Code
show_vscode_instructions() {
    POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n trii-dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d 2>/dev/null)
    
    echo ""
    echo "=========================================="
    echo "  📊 CONFIGURACIÓN PARA VS CODE"
    echo "=========================================="
    echo ""
    echo "1️⃣ Instala la extensión 'PostgreSQL' en VS Code"
    echo ""
    echo "2️⃣ Configuración de conexión:"
    echo "   Host: localhost"
    echo "   Puerto: 5432"
    echo "   Database: trii_dev"
    echo "   Username: postgres"
    echo "   Password: $POSTGRES_PASSWORD"
    echo ""
    echo "3️⃣ URL de conexión completa:"
    echo "   postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/trii_dev"
    echo ""
    echo "=========================================="
    echo "  🔧 COMANDOS DE CONTROL"
    echo "=========================================="
    echo ""
    echo "# Para detener port forward:"
    echo "kill \$(cat /tmp/postgres-port-forward.pid 2>/dev/null) 2>/dev/null"
    echo ""
    echo "# Para reiniciar port forward:"
    echo "bash scripts/setup-postgres-vscode.sh"
    echo ""
    echo "# Para conectarse por terminal:"
    echo "PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 5432 -U postgres -d trii_dev"
    echo ""
}

# Función principal
main() {
    echo "=========================================="
    echo "  🗄️ CONFIGURACIÓN POSTGRESQL VS CODE"
    echo "=========================================="
    
    if ! check_postgres; then
        print_error "PostgreSQL no está disponible. Verifica el despliegue."
        exit 1
    fi
    
    if ! test_postgres_internal; then
        print_error "PostgreSQL no acepta conexiones. Puede estar iniciando aún."
        print_status "Esperando 30 segundos..."
        sleep 30
        if ! test_postgres_internal; then
            print_error "PostgreSQL sigue sin aceptar conexiones"
            exit 1
        fi
    fi
    
    if ! get_connection_data; then
        print_error "No se pudieron obtener los datos de conexión"
        exit 1
    fi
    
    if ! setup_port_forward; then
        print_error "No se pudo configurar port forward"
        exit 1
    fi
    
    sleep 2
    test_local_connection
    
    show_vscode_instructions
    
    print_success "🎉 PostgreSQL configurado para VS Code!"
    print_warning "💡 Mantén esta terminal abierta para mantener la conexión activa"
    
    # Mantener el script ejecutándose
    echo ""
    print_status "Presiona Ctrl+C para detener el port forward"
    wait $PORT_FORWARD_PID
}

# Ejecutar función principal
main "$@"
