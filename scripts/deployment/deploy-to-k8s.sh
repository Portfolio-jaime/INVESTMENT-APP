#!/bin/bash
set -e

echo "🚀 Desplegando aplicación TRII a Kubernetes..."

# Verificar que kubectl esté configurado
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "❌ kubectl no está configurado o el cluster no está disponible"
    echo "   Asegúrate de tener un cluster corriendo y kubectl configurado"
    exit 1
fi

# Aplicar configuración base
echo "📦 Aplicando configuración base..."
kubectl apply -k infrastructure/kubernetes/base/

# Esperar a que los deployments estén listos
echo "⏳ Esperando a que los deployments estén listos..."

# Lista de deployments a esperar
DEPLOYMENTS=(
    "market-data"
    "analysis-engine"
    "portfolio-manager"
    "ml-prediction"
)

for deployment in "${DEPLOYMENTS[@]}"; do
    echo "   Esperando ${deployment}..."
    kubectl wait --for=condition=available --timeout=300s deployment/${deployment} -n trii-dev
done

echo ""
echo "✅ Despliegue completado exitosamente!"
echo ""
echo "📊 Estado de los servicios:"
kubectl get pods -n trii-dev
echo ""
echo "🌐 Servicios disponibles:"
kubectl get services -n trii-dev
echo ""
echo "🔍 Verifica los logs con:"
echo "   kubectl logs -f deployment/market-data -n trii-dev"
