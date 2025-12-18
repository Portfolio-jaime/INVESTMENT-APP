#!/bin/bash

echo "🔗 CONECTANDO A POSTGRESQL..."
echo "============================="

# Matar port-forwards existentes
echo "🛑 Parando port-forwards existentes..."
pkill -f "kubectl.*port-forward.*postgres" 2>/dev/null || true
pkill -f "kubectl.*port-forward.*5433" 2>/dev/null || true

# Esperar un poco
sleep 2

# Verificar que PostgreSQL esté corriendo
echo "🔍 Verificando PostgreSQL..."
if kubectl get pod -n trii-dev postgres-0 | grep -q "Running"; then
    echo "✅ PostgreSQL pod está corriendo"
else
    echo "❌ PostgreSQL pod no está corriendo"
    kubectl get pods -n trii-dev | grep postgres
    exit 1
fi

# Iniciar port-forward
echo "🚀 Iniciando port-forward..."
echo ""
echo "📋 Datos de conexión VS Code:"
echo "   Host: localhost"
echo "   Port: 5433"
echo "   Database: trii_dev"
echo "   Username: postgres"
echo "   Password: postgres"
echo ""
echo "⚠️  MANTÉN ESTA TERMINAL ABIERTA"
echo "   Presiona Ctrl+C para desconectar"
echo ""

# Port-forward con múltiples intentos
kubectl port-forward -n trii-dev statefulset/postgres 5433:5432 --address=0.0.0.0
