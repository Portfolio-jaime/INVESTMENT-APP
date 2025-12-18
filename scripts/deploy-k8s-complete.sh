#!/bin/bash

# TRII Platform - Complete Kubernetes Deployment Script
# This script deploys all Kubernetes components in the correct order

set -e

echo "🚀 Deploying TRII Platform to Kubernetes..."

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install it first."
        exit 1
    fi

    if ! command -v helm &> /dev/null; then
        print_error "Helm is not installed. Please install it first."
        exit 1
    fi

    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# Install cert-manager
install_cert_manager() {
    print_status "Installing cert-manager..."

    # Add Jetstack Helm repository
    helm repo add jetstack https://charts.jetstack.io --force-update
    helm repo update

    # Install cert-manager
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.13.3 \
        --set installCRDs=true \
        --wait

    print_success "cert-manager installed"
}

# Install NGINX Ingress Controller
install_ingress_nginx() {
    print_status "Installing NGINX Ingress Controller..."

    # Add ingress-nginx Helm repository
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx --force-update
    helm repo update

    # Install ingress-nginx (without ServiceMonitor - will be added later)
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --version 4.10.1 \
        --set controller.service.type=LoadBalancer \
        --set controller.metrics.enabled=true \
        --wait

    print_success "NGINX Ingress Controller installed"
}

# Install ArgoCD
install_argocd() {
    print_status "Installing ArgoCD..."

    # Create argocd namespace
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

    # Install ArgoCD
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

    # Wait for ArgoCD to be ready
    print_status "Waiting for ArgoCD to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-repo-server -n argocd
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-dex-server -n argocd

    # Configure ArgoCD RBAC
    kubectl apply -f infrastructure/kubernetes/argocd/config/rbac.yaml

    print_success "ArgoCD installed and configured"
}

# Install monitoring stack
install_monitoring() {
    print_status "Installing monitoring stack..."

    # Apply monitoring manifests
    kubectl apply -f infrastructure/kubernetes/base/monitoring/

    # Wait for Prometheus
    kubectl wait --for=condition=available --timeout=300s statefulset/prometheus -n monitoring

    # Wait for Grafana
    kubectl wait --for=condition=available --timeout=300s deployment/grafana -n monitoring

    print_success "Monitoring stack installed"
}

# Configure ingress
configure_ingress() {
    print_status "Configuring ingress..."

    # Apply ingress configuration
    kubectl apply -f infrastructure/kubernetes/base/ingress/ingress.yaml

    print_success "Ingress configured"
}

# Deploy TRII Platform applications
deploy_applications() {
    print_status "Deploying TRII Platform applications..."

    # Apply application configurations
    kubectl apply -f infrastructure/kubernetes/argocd/applications/

    print_success "Applications deployed"
}

# Print access information
print_access_info() {
    print_success "🎉 TRII Platform deployment completed!"
    echo ""
    echo "Access Information:"
    echo "=================="
    echo ""
    echo "🌐 Applications:"
    echo "- Frontend: https://app.trii-platform.com"
    echo "- API Gateway: https://api.trii-platform.com"
    echo "- ArgoCD: https://argocd.trii-platform.com"
    echo "- Grafana: https://grafana.trii-platform.com"
    echo ""
    echo "🔐 Credentials:"
    echo "- ArgoCD: admin / (check logs: kubectl logs deployment/argocd-server -n argocd)"
    echo "- Grafana: admin / admin"
    echo ""
    echo "📊 Monitoring:"
    echo "- Prometheus: http://prometheus.monitoring.svc.cluster.local:9090"
    echo "- Grafana: https://grafana.trii-platform.com"
    echo ""
    echo "Next Steps:"
    echo "1. Configure DNS records for *.trii-platform.com domains"
    echo "2. Access ArgoCD and sync applications"
    echo "3. Configure Grafana dashboards"
    echo "4. Test application functionality"
    echo "5. Set up backup and disaster recovery"
}

# Get ArgoCD admin password
get_argocd_password() {
    print_status "Getting ArgoCD admin password..."
    ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
    echo ""
    echo "🔑 ArgoCD Admin Password: $ARGOCD_PASSWORD"
    echo "Please save this password securely!"
}

# Main deployment
main() {
    echo "=========================================="
    echo "  TRII Platform - Complete K8s Deployment"
    echo "=========================================="

    check_prerequisites
    install_cert_manager
    install_ingress_nginx
    install_argocd
    get_argocd_password
    install_monitoring
    configure_ingress
    deploy_applications
    print_access_info

    echo ""
    print_success "Deployment completed successfully! 🎉"
}

# Run main function
main "$@"
