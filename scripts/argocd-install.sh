#!/bin/bash
set -euo pipefail
echo "Installing ArgoCD..."
kubectl create namespace argocd || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
echo "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
echo "✅ ArgoCD installed successfully"
echo "Get admin password:"
echo "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d"