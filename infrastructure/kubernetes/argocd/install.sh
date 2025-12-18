#!/bin/bash

# TRII Platform - ArgoCD Installation Script
# This script installs and configures ArgoCD for GitOps deployment

set -e

echo "🚀 Installing ArgoCD for TRII Platform..."

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

    if ! command -v argocd &> /dev/null; then
        print_warning "ArgoCD CLI is not installed. Installing..."
        # Install ArgoCD CLI
        curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
        sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
        rm argocd-linux-amd64
        print_success "ArgoCD CLI installed"
    fi

    print_success "Prerequisites check completed"
}

# Create namespace
create_namespace() {
    print_status "Creating argocd namespace..."
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
    print_success "Namespace created"
}

# Install ArgoCD
install_argocd() {
    print_status "Installing ArgoCD..."

    # Install ArgoCD using kubectl
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

    print_success "ArgoCD installed. Waiting for pods to be ready..."

    # Wait for ArgoCD server to be ready
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-repo-server -n argocd
    kubectl wait --for=condition=available --timeout=600s deployment/argocd-dex-server -n argocd

    print_success "ArgoCD is ready!"
}

# Configure ArgoCD
configure_argocd() {
    print_status "Configuring ArgoCD..."

    # Get initial admin password
    ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

    print_success "ArgoCD admin password: $ARGOCD_PASSWORD"
    print_warning "Please save this password securely!"

    # Change admin password (optional)
    echo "To change the admin password, run:"
    echo "argocd login argocd.trii-platform.com"
    echo "argocd account update-password"

    # Configure RBAC (optional)
    kubectl apply -f infrastructure/kubernetes/argocd/config/rbac.yaml

    print_success "ArgoCD configured"
}

# Create applications
create_applications() {
    print_status "Creating ArgoCD applications..."

    # Apply application manifests
    kubectl apply -f infrastructure/kubernetes/argocd/applications/

    print_success "Applications created"
}

# Setup ingress
setup_ingress() {
    print_status "Setting up ingress for ArgoCD..."

    # Apply ingress configuration
    kubectl apply -f infrastructure/kubernetes/base/ingress/ingress.yaml

    print_success "Ingress configured"
}

# Print access information
print_access_info() {
    print_success "🎉 ArgoCD installation completed!"
    echo ""
    echo "Access Information:"
    echo "=================="
    echo "ArgoCD UI: https://argocd.trii-platform.com"
    echo "Username: admin"
    echo "Password: (see above)"
    echo ""
    echo "CLI Access:"
    echo "argocd login argocd.trii-platform.com"
    echo ""
    echo "Applications:"
    echo "- trii-platform: Main application"
    echo "- monitoring: Prometheus & Grafana"
    echo ""
    echo "Next Steps:"
    echo "1. Access ArgoCD UI and sync applications"
    echo "2. Configure Git repository for GitOps"
    echo "3. Set up notifications (Slack/Teams)"
    echo "4. Configure SSO if needed"
}

# Main installation
main() {
    echo "=========================================="
    echo "  TRII Platform - ArgoCD Installation"
    echo "=========================================="

    check_prerequisites
    create_namespace
    install_argocd
    configure_argocd
    create_applications
    setup_ingress
    print_access_info

    echo ""
    print_success "Installation completed successfully! 🚀"
}

# Run main function
main "$@"
