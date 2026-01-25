#!/bin/bash
set -e

echo "🚀 Creando cluster Kind para TRII Platform..."

# Crear cluster
kind create cluster --config infrastructure/kubernetes/kind/cluster-config.yaml

# Esperar a que el cluster esté listo
echo "⏳ Esperando a que el cluster esté listo..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Instalar NGINX Ingress Controller
echo "📦 Instalando NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Esperar a que Ingress esté listo
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# Crear namespaces
echo "📁 Creando namespaces..."
kubectl create namespace trii-dev
kubectl create namespace trii-staging
kubectl create namespace trii-production
kubectl create namespace trii-monitoring
kubectl create namespace argocd

# Etiquetar namespaces
kubectl label namespace trii-dev environment=development
kubectl label namespace trii-staging environment=staging
kubectl label namespace trii-production environment=production

echo "✅ Cluster Kind creado exitosamente!"
echo ""
echo "📊 Información del cluster:"
kubectl cluster-info
echo ""
echo "🔍 Nodos:"
kubectl get nodes
echo ""
echo "📦 Namespaces:"
kubectl get namespaces
