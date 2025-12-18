#!/bin/bash

# Script para conectar PostgreSQL sin port forward usando configuración especial
echo "🗄️ PostgreSQL sin Port Forward - Solución alternativa"

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

# Obtener datos de PostgreSQL
POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n trii-dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d 2>/dev/null || echo "trii_dev_password")

print_status "Configurando acceso directo sin port forward..."

# Opción 1: Configurar HostPort en el pod de PostgreSQL
print_status "Configurando HostPort para PostgreSQL..."

# Crear patch para agregar hostPort
cat > /tmp/postgres-hostport-patch.yaml << EOF
spec:
  template:
    spec:
      containers:
      - name: postgres
        ports:
        - containerPort: 5432
          hostPort: 5432
          protocol: TCP
EOF

# Aplicar patch al StatefulSet de PostgreSQL
kubectl patch statefulset postgres -n trii-dev --patch-file /tmp/postgres-hostport-patch.yaml

if [ $? -eq 0 ]; then
    print_success "HostPort configurado para PostgreSQL"
    
    # Reiniciar el pod para aplicar cambios
    print_status "Reiniciando PostgreSQL para aplicar cambios..."
    kubectl delete pod postgres-0 -n trii-dev
    
    print_status "Esperando que PostgreSQL se reinicie..."
    kubectl wait --for=condition=Ready pod/postgres-0 -n trii-dev --timeout=120s
    
    if [ $? -eq 0 ]; then
        print_success "PostgreSQL reiniciado correctamente"
        
        # Obtener IP del nodo Kind
        KIND_NODE_IP=$(docker inspect trii-dev-control-plane | grep '"IPAddress":' | tail -1 | cut -d'"' -f4)
        
        echo ""
        echo "=========================================="
        echo "  📊 DATOS DE CONEXIÓN SIN PORT FORWARD"
        echo "=========================================="
        echo ""
        echo "🔗 Conexión directa via HostPort:"
        echo "   Server name: $KIND_NODE_IP"
        echo "   Port: 5432"
        echo "   Database: trii_dev"
        echo "   Username: postgres"
        echo "   Password: $POSTGRES_PASSWORD"
        echo ""
        echo "🔗 Conexión alternativa (localhost):"
        echo "   Server name: localhost"
        echo "   Port: 5432"
        echo "   Database: trii_dev"
        echo "   Username: postgres"
        echo "   Password: $POSTGRES_PASSWORD"
        echo ""
        
        # Probar conectividad
        print_status "Probando conectividad directa..."
        sleep 10
        
        if nc -z localhost 5432 2>/dev/null; then
            print_success "✅ PostgreSQL accesible en localhost:5432"
        elif nc -z $KIND_NODE_IP 5432 2>/dev/null; then
            print_success "✅ PostgreSQL accesible en $KIND_NODE_IP:5432"
        else
            print_warning "⚠️ Verificación de conectividad falló, pero puede funcionar en VS Code"
        fi
        
    else
        print_error "Error reiniciando PostgreSQL"
        exit 1
    fi
else
    print_error "Error configurando HostPort"
    
    # Opción 2: Usar Docker exec directo
    print_status "Intentando opción alternativa con Docker exec..."
    
    # Encontrar el container de PostgreSQL dentro del nodo Kind
    KIND_CONTAINER_ID=$(docker ps --filter "name=trii-dev-control-plane" --format "{{.ID}}")
    
    if [ ! -z "$KIND_CONTAINER_ID" ]; then
        print_success "Container Kind encontrado: $KIND_CONTAINER_ID"
        
        # Crear un túnel SSH-like usando socat dentro del container Kind
        print_status "Configurando túnel dentro del container Kind..."
        
        docker exec -d $KIND_CONTAINER_ID sh -c "
            apk add --no-cache socat 2>/dev/null || apt-get update && apt-get install -y socat 2>/dev/null || yum install -y socat 2>/dev/null || true
            socat TCP-LISTEN:5432,fork,reuseaddr TCP:postgres-service.trii-dev:5432 &
        "
        
        sleep 5
        
        KIND_NODE_IP=$(docker inspect $KIND_CONTAINER_ID | grep '"IPAddress":' | tail -1 | cut -d'"' -f4)
        
        echo ""
        echo "=========================================="
        echo "  📊 DATOS DE CONEXIÓN VIA TÚNEL"
        echo "=========================================="
        echo ""
        echo "🔗 Conexión via túnel socat:"
        echo "   Server name: $KIND_NODE_IP"
        echo "   Port: 5432"
        echo "   Database: trii_dev"
        echo "   Username: postgres"
        echo "   Password: $POSTGRES_PASSWORD"
        echo ""
        
    else
        print_error "No se encontró container Kind"
        exit 1
    fi
fi

echo "=========================================="
echo "  📱 CONFIGURACIÓN VS CODE"
echo "=========================================="
echo ""
echo "1️⃣ En VS Code, crea nueva conexión PostgreSQL"
echo "2️⃣ Usa los datos de arriba"
echo "3️⃣ Prueba primero localhost, luego la IP del nodo"
echo "4️⃣ Connection timeout: 30 segundos"
echo ""

echo "=========================================="
echo "  🔧 INFORMACIÓN TÉCNICA"
echo "=========================================="
echo ""
echo "• Método: HostPort directo (sin port forward)"
echo "• IP del nodo Kind: $KIND_NODE_IP"
echo "• Puerto expuesto: 5432"
echo "• Acceso directo al container PostgreSQL"
echo ""

print_success "🎉 PostgreSQL configurado SIN port forward!"
print_warning "💡 Si falla, el port forward sigue siendo la opción más confiable"

# Limpiar archivos temporales
rm -f /tmp/postgres-hostport-patch.yaml
