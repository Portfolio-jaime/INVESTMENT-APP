#!/bin/bash

# Script para arreglar el acceso al puerto 80 del ingress
# Explica por qué el puerto 8888 es necesario y ofrece alternativas

echo "🔍 Diagnóstico del problema del puerto 80"
echo "=========================================="

echo ""
echo "❓ ¿Por qué antes funcionaba sin puerto?"
echo "   - Probablemente el ingress controller tenía hostPort configurado"
echo "   - O había un proxy/load balancer configurado en el puerto 80"
echo "   - Kind necesita configuración específica para mapear puertos del ingress"

echo ""
echo "🔧 Estado actual del cluster:"
echo "   - Puerto 80 mapeado en Kind: ✅ (pero no funciona)"
echo "   - LoadBalancer IP: 172.18.255.200 (no accesible desde localhost)"
echo "   - NodePort ingress: 31560 (no mapeado a localhost)"
echo "   - Port-forward funcionando: ✅ (puerto 8888)"

echo ""
echo "💡 Soluciones disponibles:"
echo ""

echo "1. 🎯 ACTUAL (Funcional): Port-forward al puerto 8888"
echo "   URL: http://argocd.trii-platform.com:8888/"
echo "   Comando: ./scripts/open-argocd-ingress.sh"

echo ""
echo "2. 🔧 ARREGLO PERMANENTE: Reconfigurar cluster Kind"
echo "   - Requiere recrear el cluster con hostPort para ingress"
echo "   - Archivo: infrastructure/kubernetes/kind/cluster-config.yaml"
echo "   - Añadir hostPort 80 al ingress controller"

echo ""
echo "3. ⚡ ALTERNATIVA: Usar NodePort directo"
echo "   URL: http://localhost:8080 (ArgoCD NodePort)"
echo "   - Funciona sin ingress"
echo "   - No usa nombre de dominio"

echo ""
echo "📋 Para usar el puerto 80 sin port-forward, necesitarías:"
cat << 'EOF'

# Modificar infrastructure/kubernetes/kind/cluster-config.yaml
# Añadir al final de extraPortMappings:

    # Ingress Controller
    - containerPort: 31560
      hostPort: 80
      protocol: TCP

# Luego recrear el cluster:
kind delete cluster --name trii-dev
kind create cluster --config infrastructure/kubernetes/kind/cluster-config.yaml

EOF

echo "⚠️  IMPORTANTE: Esto requiere recrear todo el cluster"
echo ""
echo "✅ RECOMENDACIÓN: La solución actual con puerto 8888 es la más práctica"
echo "   - Funciona inmediatamente"
echo "   - No requiere recrear el cluster"
echo "   - Usa el hostname correcto del ingress"
echo ""
echo "🚀 Para abrir ArgoCD ahora: ./scripts/open-argocd-ingress.sh"
