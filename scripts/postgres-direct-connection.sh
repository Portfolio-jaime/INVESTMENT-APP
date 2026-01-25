#!/bin/bash

# Script para conexión directa a PostgreSQL vía NodePort
echo "🗄️ Conexión directa a PostgreSQL vía NodePort"

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
POSTGRES_PORT="30432"
POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n trii-dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d 2>/dev/null || echo "trii_dev_password")

# Verificar que PostgreSQL esté funcionando
print_status "Verificando PostgreSQL..."
POSTGRES_POD=$(kubectl get pods -n trii-dev -l app=postgres --no-headers 2>/dev/null | awk '{print $1}' | head -1)
if [ ! -z "$POSTGRES_POD" ]; then
    POSTGRES_STATUS=$(kubectl get pod $POSTGRES_POD -n trii-dev --no-headers | awk '{print $3}')
    if [ "$POSTGRES_STATUS" = "Running" ]; then
        print_success "PostgreSQL está funcionando: $POSTGRES_POD"
    else
        print_warning "PostgreSQL estado: $POSTGRES_STATUS"
    fi
fi

# Verificar servicios
print_status "Verificando servicios NodePort..."
kubectl get svc postgres-nodeport -n trii-dev 2>/dev/null && print_success "Servicio NodePort configurado" || print_warning "Servicio NodePort no encontrado"

echo ""
echo "=========================================="
echo "  📊 DATOS DE CONEXIÓN POSTGRESQL"
echo "=========================================="
echo ""
echo "🌐 Conexión directa vía NodePort:"
echo "   Host: $CLUSTER_IP"
echo "   Puerto: $POSTGRES_PORT"
echo "   Base de datos: trii_dev"
echo "   Usuario: postgres"
echo "   Contraseña: $POSTGRES_PASSWORD"
echo ""
echo "🔗 URL de conexión completa:"
echo "   postgresql://postgres:$POSTGRES_PASSWORD@$CLUSTER_IP:$POSTGRES_PORT/trii_dev"
echo ""

echo "=========================================="
echo "  ⚙️ CONFIGURACIÓN VS CODE POSTGRESQL"
echo "=========================================="
echo ""
echo "Configura estos datos en VS Code PostgreSQL:"
echo ""
echo "📝 Datos de conexión:"
echo "   Host: $CLUSTER_IP"
echo "   Port: $POSTGRES_PORT"  
echo "   Database: trii_dev"
echo "   Username: postgres"
echo "   Password: $POSTGRES_PASSWORD"
echo ""

echo "=========================================="
echo "  🔧 PRUEBAS DE CONECTIVIDAD"
echo "=========================================="
echo ""

# Probar conectividad al puerto
print_status "Probando conectividad al puerto $POSTGRES_PORT..."
if nc -z $CLUSTER_IP $POSTGRES_PORT 2>/dev/null; then
    print_success "✅ Puerto $POSTGRES_PORT está accesible en $CLUSTER_IP"
else
    print_warning "⚠️ Puerto $POSTGRES_PORT no responde. Puede estar iniciando aún."
fi

# Mostrar comando de prueba
echo ""
echo "🧪 Para probar la conexión manualmente:"
echo "   nc -z $CLUSTER_IP $POSTGRES_PORT"
echo ""
echo "🔌 Para conectarse con psql:"
echo "   PGPASSWORD=$POSTGRES_PASSWORD psql -h $CLUSTER_IP -p $POSTGRES_PORT -U postgres -d trii_dev"
echo ""

echo "=========================================="
echo "  📱 INSTRUCCIONES PARA VS CODE"
echo "=========================================="
echo ""
echo "1️⃣ Abre VS Code"
echo "2️⃣ Instala la extensión 'PostgreSQL' si no la tienes"
echo "3️⃣ Crea nueva conexión con estos datos:"
echo "   • Host: $CLUSTER_IP"
echo "   • Puerto: $POSTGRES_PORT"
echo "   • Database: trii_dev" 
echo "   • Username: postgres"
echo "   • Password: $POSTGRES_PASSWORD"
echo "4️⃣ ¡Conecta y disfruta!"
echo ""

print_success "🎉 Conexión directa configurada!"
print_warning "💡 No necesitas port forward, la conexión es directa al cluster"

echo ""
echo "=========================================="
echo "  🔄 COMANDOS DE CONTROL"
echo "=========================================="
echo ""
echo "# Verificar estado de PostgreSQL:"
echo "kubectl get pods -n trii-dev | grep postgres"
echo ""
echo "# Verificar servicios:"
echo "kubectl get svc -n trii-dev | grep postgres"
echo ""
echo "# Reiniciar PostgreSQL si es necesario:"
echo "kubectl rollout restart statefulset/postgres -n trii-dev"
echo ""
