#!/bin/bash

# TRII Platform - ArgoCD Installation Script
# Sets up GitOps deployment for Colombian market-focused microservices

set -e

ARGOCD_NAMESPACE="argocd"
ARGOCD_VERSION="stable"

echo "🚀 Installing ArgoCD for TRII Platform GitOps..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not configured. Please ensure kubectl is set up for your Kind cluster."
    exit 1
fi

# Check if ArgoCD CLI is installed, install if not
if ! command -v argocd &> /dev/null; then
    echo "📦 Installing ArgoCD CLI..."
    if command -v brew &> /dev/null; then
        brew install argocd
    else
        echo "⚠️  Homebrew not found. Please install ArgoCD CLI manually: https://argo-cd.readthedocs.io/en/stable/cli_installation/"
        echo "   Or install Homebrew and re-run this script."
        exit 1
    fi
fi

# Create ArgoCD namespace
echo "📁 Creating ArgoCD namespace..."
kubectl create namespace "${ARGOCD_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
echo "📦 Installing ArgoCD ${ARGOCD_VERSION}..."
kubectl apply -n "${ARGOCD_NAMESPACE}" -f "https://raw.githubusercontent.com/argoproj/argo-cd/${ARGOCD_VERSION}/manifests/install.yaml"

# Wait for ArgoCD to be ready
echo "⏳ Waiting for ArgoCD components to be ready..."
kubectl wait --for=condition=Ready pod --all -n "${ARGOCD_NAMESPACE}" --timeout=300s

# Create ingress for ArgoCD
echo "🌐 Creating ingress for ArgoCD..."
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: ${ARGOCD_NAMESPACE}
  annotations:
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
spec:
  ingressClassName: nginx
  rules:
  - host: argocd.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 443
EOF

# Get initial admin password
ARGOCD_PASSWORD=$(kubectl -n "${ARGOCD_NAMESPACE}" get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo "✅ ArgoCD installed successfully!"
echo "🔑 ArgoCD Admin Credentials:"
echo "   Username: admin"
echo "   Password: ${ARGOCD_PASSWORD}"
echo ""
echo "🌐 Access ArgoCD UI:"
echo "   Option 1 - Port forward:"
echo "   kubectl port-forward svc/argocd-server -n ${ARGOCD_NAMESPACE} 8080:443"
echo "   Then visit: https://localhost:8080"
echo ""
echo "   Option 2 - Ingress (add to /etc/hosts: 127.0.0.1 argocd.local):"
echo "   Visit: https://argocd.local"
echo ""
echo "💡 Next steps:"
echo "   - Login to ArgoCD UI with the credentials above"
echo "   - Run ./deploy-services.sh to deploy TRII microservices via ArgoCD"
echo ""
echo "📝 Note: For Colombian market development, ensure your Git repository is configured for ArgoCD applications."