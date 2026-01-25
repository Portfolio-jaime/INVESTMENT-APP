#!/bin/bash
set -e

echo "🚀 Instalando ArgoCD..."

# Instalar ArgoCD
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: argocd
EOF
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Esperar a que ArgoCD esté listo
echo "⏳ Esperando a que ArgoCD esté listo..."
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Exponer ArgoCD UI
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort", "ports": [{"port": 443, "nodePort": 30080}]}}'

# Obtener password inicial
echo ""
echo "✅ ArgoCD instalado exitosamente!"
echo ""
echo "🔐 Password inicial de admin:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""
echo ""
echo "🌐 Acceder a ArgoCD UI:"
echo "   URL: https://localhost:8080"
echo "   Usuario: admin"
echo ""
echo "💡 Cambiar password:"
echo "   argocd account update-password"
