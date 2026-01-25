#!/bin/bash

# TRII Platform - Local Access Script
# This script helps access services in a local Kubernetes cluster

set -e

echo "🚀 TRII Platform - Local Access Setup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Get ArgoCD admin password
get_argocd_password() {
    print_status "Getting ArgoCD admin password..."
    ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "Not available")
    echo ""
    echo "🔑 ArgoCD Admin Password: $ARGOCD_PASSWORD"
}

# Setup port forwarding for local access
setup_port_forwarding() {
    print_status "Setting up port forwarding..."

    # Kill existing port forwards
    pkill -f "kubectl port-forward" 2>/dev/null || true

    # ArgoCD
    print_status "Setting up ArgoCD port forwarding (port 8080)..."
    kubectl port-forward -n argocd svc/argocd-server 8080:80 &
    sleep 2

    # Grafana
    print_status "Setting up Grafana port forwarding (port 3001)..."
    kubectl port-forward -n monitoring svc/grafana 3001:3000 &
    sleep 2

    # Prometheus
    print_status "Setting up Prometheus port forwarding (port 9090)..."
    kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
    sleep 2

    print_success "Port forwarding setup complete"
}

# Show access URLs
show_access_urls() {
    echo ""
    echo "🌐 Local Access URLs:"
    echo "===================="
    echo ""
    echo "🔄 ArgoCD (GitOps):"
    echo "   URL: http://localhost:8080"
    echo "   User: admin"
    echo "   Password: $ARGOCD_PASSWORD"
    echo ""
    echo "📊 Grafana (Monitoring):"
    echo "   URL: http://localhost:3001"
    echo "   User: admin"
    echo "   Password: admin"
    echo ""
    echo "📈 Prometheus (Metrics):"
    echo "   URL: http://localhost:9090"
    echo ""
    echo "🔍 Check service status:"
    echo "   kubectl get pods --all-namespaces"
    echo ""
    echo "🛑 Stop port forwarding:"
    echo "   pkill -f 'kubectl port-forward'"
    echo ""
}

# Check cluster status
check_cluster_status() {
    print_status "Checking cluster status..."

    # Check if kubectl can connect
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check ArgoCD
    if kubectl get pods -n argocd &> /dev/null; then
        ARGOCD_PODS=$(kubectl get pods -n argocd --no-headers | wc -l)
        print_success "ArgoCD: $ARGOCD_PODS pods running"
    else
        print_warning "ArgoCD not found"
    fi

    # Check monitoring
    if kubectl get pods -n monitoring &> /dev/null; then
        MONITORING_PODS=$(kubectl get pods -n monitoring --no-headers | wc -l)
        print_success "Monitoring: $MONITORING_PODS pods running"
    else
        print_warning "Monitoring not found"
    fi

    # Check ingress
    if kubectl get pods -n ingress-nginx &> /dev/null; then
        INGRESS_PODS=$(kubectl get pods -n ingress-nginx --no-headers | wc -l)
        print_success "Ingress: $INGRESS_PODS pods running"
    else
        print_warning "Ingress not found"
    fi

    print_success "Cluster check complete"
}

# Main function
main() {
    echo "=========================================="
    echo "  TRII Platform - Local Access"
    echo "=========================================="

    check_cluster_status
    get_argocd_password
    setup_port_forwarding
    show_access_urls

    echo ""
    print_success "Local access setup complete! 🎉"
    echo ""
    print_warning "Port forwarding is running in background."
    print_warning "Press Ctrl+C to stop all port forwarding."
    echo ""

    # Keep script running to maintain port forwarding
    echo "Keeping port forwarding active... (Ctrl+C to stop)"
    trap 'echo ""; print_status "Stopping port forwarding..."; pkill -f "kubectl port-forward"; exit 0' INT
    wait
}

# Run main function
main "$@"
