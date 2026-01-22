#!/bin/bash
set -euo pipefail
echo "Bootstrapping ArgoCD applications..."
kubectl apply -f argocd/bootstrap/root-app.yaml
echo "✅ Applications bootstrapped"
echo "Check ArgoCD UI: http://localhost:8080"
echo "Or run: kubectl get applications -n argocd"