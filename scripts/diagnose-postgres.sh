#!/bin/bash

echo "=== TRII Investment Platform PostgreSQL Connectivity Diagnostic ==="
echo "Date: $(date)"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 1. Check /etc/hosts entries
echo -e "\n${BLUE}1. Checking /etc/hosts entries${NC}"
echo "================================================"
if grep -q "postgres.trii.local" /etc/hosts; then
    print_success "Found postgres.trii.local in /etc/hosts:"
    grep "postgres.trii.local" /etc/hosts
else
    print_error "postgres.trii.local not found in /etc/hosts"
fi

# 2. Kind Cluster Status
echo -e "\n${BLUE}2. Kind Cluster Status${NC}"
echo "================================================"
if command -v kind >/dev/null 2>&1; then
    print_status "Checking Kind clusters..."
    kind get clusters
else
    print_error "Kind CLI not found"
fi

# 3. Kubernetes Context
echo -e "\n${BLUE}3. Kubernetes Context and Connectivity${NC}"
echo "================================================"
if command -v kubectl >/dev/null 2>&1; then
    print_status "Current kubectl context:"
    kubectl config current-context
    
    print_status "Testing cluster connectivity..."
    if kubectl cluster-info >/dev/null 2>&1; then
        print_success "Cluster connected"
        kubectl cluster-info
    else
        print_error "Cluster connectivity failed"
    fi
else
    print_error "kubectl not found"
fi

# 4. PostgreSQL Services and Pods
echo -e "\n${BLUE}4. PostgreSQL Services and Pods${NC}"
echo "================================================"
if command -v kubectl >/dev/null 2>&1; then
    print_status "Checking PostgreSQL services..."
    kubectl get services --all-namespaces | grep -i postgres || print_warning "No PostgreSQL services found"
    
    print_status "Checking PostgreSQL pods..."
    kubectl get pods --all-namespaces | grep -i postgres || print_warning "No PostgreSQL pods found"
    
    print_status "All services in all namespaces:"
    kubectl get svc --all-namespaces
else
    print_error "kubectl not available"
fi

# 5. TCP Connectivity Tests
echo -e "\n${BLUE}5. TCP Connectivity Tests${NC}"
echo "================================================"
if command -v nc >/dev/null 2>&1; then
    print_status "Testing connection to postgres.trii.local:5432..."
    timeout 3 nc -z postgres.trii.local 5432 && print_success "postgres.trii.local:5432 is reachable" || print_error "postgres.trii.local:5432 is not reachable"
    
    print_status "Testing connection to localhost:5433..."
    timeout 3 nc -z localhost 5433 && print_success "localhost:5433 is reachable" || print_error "localhost:5433 is not reachable"
else
    print_warning "netcat (nc) not available for connectivity testing"
    print_status "Trying alternative connectivity test..."
    timeout 3 bash -c "</dev/tcp/postgres.trii.local/5432" && print_success "postgres.trii.local:5432 is reachable" || print_error "postgres.trii.local:5432 is not reachable"
fi

echo -e "\n${BLUE}=== Diagnostic Complete ===${NC}"
echo "Review the output above for errors and run appropriate fix scripts."
