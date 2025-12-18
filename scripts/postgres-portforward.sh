#!/bin/bash

echo "=== Setting up PostgreSQL Port Forward ==="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check kubectl
if ! command -v kubectl >/dev/null 2>&1; then
    print_error "kubectl is required but not installed"
    exit 1
fi

# Find PostgreSQL service or pod
print_status "Looking for PostgreSQL service..."
PG_SERVICE=$(kubectl get svc --all-namespaces | grep -i postgres | head -1)

if [ -n "$PG_SERVICE" ]; then
    NAMESPACE=$(echo "$PG_SERVICE" | awk '{print $1}')
    SERVICE_NAME=$(echo "$PG_SERVICE" | awk '{print $2}')
    print_success "Found PostgreSQL service: $SERVICE_NAME in namespace: $NAMESPACE"
    
    # Kill existing port-forwards
    print_status "Stopping any existing port-forward processes..."
    pkill -f "kubectl.*port-forward.*5433" || true
    sleep 2
    
    print_status "Starting port-forward from localhost:5433 to $SERVICE_NAME:5432..."
    echo ""
    echo "🔗 Connection details for VS Code:"
    echo "   Host: localhost"
    echo "   Port: 5433"
    echo "   Database: trii_dev"
    echo "   Username: postgres"
    echo "   Password: postgres"
    echo ""
    echo "⚠️  Keep this terminal open while using VS Code"
    echo "   Press Ctrl+C to disconnect"
    echo ""
    
    kubectl port-forward -n "$NAMESPACE" "svc/$SERVICE_NAME" 5433:5432
else
    print_error "No PostgreSQL service found"
    echo "Available services:"
    kubectl get svc --all-namespaces
    exit 1
fi
