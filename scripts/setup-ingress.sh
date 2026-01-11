#!/bin/bash

# Install nginx ingress controller for Kind cluster
echo "🚀 Installing nginx ingress controller for Kind..."

# Apply nginx ingress controller manifests
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for the ingress controller to be ready
echo "⏳ Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

echo "✅ Nginx ingress controller installed successfully!"

# Verify installation
kubectl get pods -n ingress-nginx

echo "📝 Note: You can now access ingress resources on localhost:80"
echo "   Add 'trii-frontend.local' to your /etc/hosts file pointing to 127.0.0.1"