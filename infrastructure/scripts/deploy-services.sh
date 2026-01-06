#!/bin/bash

# TRII Platform - Deploy Services via ArgoCD
# Deploys all microservices to the Kind cluster using ArgoCD applications

set -e

ARGOCD_NAMESPACE="argocd"
SERVICES=(
    "market-data"
    "analysis-engine"
    "ml-prediction"
    "portfolio-manager"
    "broker-integration"
    "auth-service"
    "notification-service"
)

echo "🚀 Deploying TRII Platform microservices via ArgoCD..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not configured. Please ensure kubectl is set up for your Kind cluster."
    exit 1
fi

# Check if ArgoCD is installed
if ! kubectl get namespace "${ARGOCD_NAMESPACE}" &> /dev/null; then
    echo "❌ ArgoCD namespace '${ARGOCD_NAMESPACE}' not found. Please run ./install-argocd.sh first."
    exit 1
fi

# Create trii-platform namespace if it doesn't exist
echo "📁 Ensuring trii-platform namespace exists..."
kubectl create namespace trii-platform --dry-run=client -o yaml | kubectl apply -f -

# Deploy each service
for service in "${SERVICES[@]}"; do
    echo "📦 Deploying ${service}..."
    kubectl apply -f "../argocd/${service}-app.yaml"
done

echo "⏳ Waiting for ArgoCD applications to sync..."
# Wait a bit for ArgoCD to process
sleep 10

# Check sync status
echo "📊 Checking deployment status..."
kubectl get applications -n "${ARGOCD_NAMESPACE}"

echo "✅ TRII Platform microservices deployment initiated!"
echo "💡 Monitor deployment progress in ArgoCD UI:"
echo "   kubectl port-forward svc/argocd-server -n ${ARGOCD_NAMESPACE} 8080:443"
echo "   Then visit: https://localhost:8080"
echo ""
echo "🔍 Check service status:"
echo "   kubectl get pods -n trii-platform"
echo "   kubectl get services -n trii-platform"