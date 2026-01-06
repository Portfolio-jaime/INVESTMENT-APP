#!/bin/bash

# TRII Platform - Kind Cluster Creation Script
# Optimized for local development with Colombian market focus

set -e

CLUSTER_NAME="trii-platform"
CONFIG_FILE="../kind-config.yaml"

echo "🚀 Creating Kind cluster for TRII Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if kind is installed
if ! command -v kind &> /dev/null; then
    echo "❌ Kind is not installed. Please install Kind: https://kind.sigs.k8s.io/docs/user/quick-start/"
    exit 1
fi

# Check if cluster already exists
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "⚠️  Cluster '${CLUSTER_NAME}' already exists. Deleting it first..."
    kind delete cluster --name "${CLUSTER_NAME}"
fi

# Create the cluster
echo "📦 Creating Kind cluster with configuration..."
kind create cluster --config "${CONFIG_FILE}" --name "${CLUSTER_NAME}"

# Wait for cluster to be ready
echo "⏳ Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Verify cluster
echo "✅ Cluster created successfully!"
kubectl get nodes
kubectl get pods -A

echo "🎉 TRII Platform Kind cluster is ready for development!"
echo "💡 Next steps:"
echo "   - Run ./install-argocd.sh to install ArgoCD"
echo "   - Run ./deploy-services.sh to deploy microservices"