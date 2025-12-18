#!/bin/bash

# TRII Platform - ArgoCD Local Access
# Access ArgoCD directly through ingress without port forwarding

set -e

echo "🚀 TRII Platform - ArgoCD Local Access"

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

# Get cluster IP and port
get_cluster_access() {
    print_status "Detecting cluster access method..."

    # Try to get the ingress controller IP/port
    INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
    INGRESS_PORT=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.spec.ports[0].port}' 2>/dev/null || echo "")

    if [ -n "$INGRESS_IP" ] && [ -n "$INGRESS_PORT" ]; then
        ACCESS_URL="http://$INGRESS_IP:$INGRESS_PORT/argocd"
        print_success "Using ClusterIP: $ACCESS_URL"
    else
        # Try NodePort service
        NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "localhost")
        NODE_PORT=$(kubectl get svc -n argocd argocd-server-nodeport -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")

        if [ -n "$NODE_PORT" ]; then
            ACCESS_URL="http://$NODE_IP:$NODE_PORT"
            print_success "Using NodePort: $ACCESS_URL"
        else
            # Fallback to port forwarding
            print_warning "No direct ingress access found. Using port forwarding..."
            kubectl port-forward -n argocd svc/argocd-server 8080:80 &
            sleep 3
            ACCESS_URL="http://localhost:8080"
            print_success "Port forwarding active: $ACCESS_URL"
        fi
    fi
}

# Get ArgoCD admin password
get_argocd_password() {
    print_status "Getting ArgoCD admin password..."
    ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "Not available")
}

# Show access information
show_access_info() {
    echo ""
    echo "🌐 ArgoCD Access Information:"
    echo "============================"
    echo ""
    echo "🔗 URL: $ACCESS_URL"
    echo "👤 User: admin"
    echo "🔑 Password: $ARGOCD_PASSWORD"
    echo ""
    echo "📱 Mobile/Desktop Access:"
    echo "   If using Docker Desktop/KinD/Minikube:"
    echo "   Replace localhost with your cluster IP"
    echo ""
    echo "🔍 Check status:"
    echo "   kubectl get ingress -n argocd"
    echo "   kubectl get pods -n argocd"
    echo ""
    echo "📚 Useful commands:"
    echo "   argocd login $ACCESS_URL"
    echo "   argocd app list"
    echo "   argocd app sync trii-platform"
}

# Test connectivity
test_connectivity() {
    print_status "Testing connectivity..."

    # Simple curl test (timeout 5 seconds)
    if curl -s --max-time 5 "$ACCESS_URL" > /dev/null 2>&1; then
        print_success "✅ ArgoCD is accessible!"
    else
        print_warning "⚠️  ArgoCD may not be fully ready yet"
        print_warning "   Try again in a few moments"
    fi
}

# Main function
main() {
    echo "=========================================="
    echo "  TRII Platform - ArgoCD Local Access"
    echo "=========================================="

    get_cluster_access
    get_argocd_password
    test_connectivity
    show_access_info

    echo ""
    print_success "ArgoCD access configured! 🎉"
    echo ""
    echo "💡 Tip: Add this to your /etc/hosts if needed:"
    echo "   127.0.0.1 argocd.local"
    echo ""
}

# Run main function
main "$@"
