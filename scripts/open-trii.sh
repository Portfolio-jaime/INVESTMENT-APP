#!/bin/bash

# TRII Platform Browser Launcher
# This script opens the TRII platform services with the correct ports

echo "🚀 Opening TRII Platform services..."

# Check if services are accessible
if curl -s -H "Host: trii-frontend.local" http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
    echo "🌐 Opening Frontend..."
    open "http://trii-frontend.local"
else
    echo "❌ Frontend is not accessible"
fi

if curl -s -k -H "Host: argocd.local" https://localhost > /dev/null 2>&1; then
    echo "✅ ArgoCD is accessible" 
    echo "🔧 Opening ArgoCD..."
    open "https://argocd.local"
else
    echo "❌ ArgoCD is not accessible"
fi

if curl -s -H "Host: trii-grafana.local" http://localhost > /dev/null 2>&1; then
    echo "✅ Grafana is accessible"
    echo "📊 Opening Grafana..."
    open "http://trii-grafana.local"
else
    echo "❌ Grafana is not accessible"
fi

if curl -s -H "Host: trii-prometheus.local" http://localhost > /dev/null 2>&1; then
    echo "✅ Prometheus is accessible"
    echo "📈 Opening Prometheus..."
    open "http://trii-prometheus.local"
else
    echo "❌ Prometheus is not accessible"
fi

echo ""
echo "🎯 TRII Platform URLs:"
echo "  Frontend: http://trii-frontend.local"
echo "  API Gateway: http://trii-gateway.local"  
echo "  Grafana: http://trii-grafana.local"
echo "  Prometheus: http://trii-prometheus.local"
echo "  ArgoCD: https://argocd.local"
echo ""
echo "🔐 Default Credentials:"
echo "  Grafana Admin: admin / trii2026!"
echo "  ArgoCD Admin: admin / (check: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d)"
echo "  Prometheus: admin / prometheus2026!"
echo "  Monitoring Basic Auth: admin / monitoring2026!"
echo ""
echo "📊 Monitoring Dashboards:"
echo "  Business Intelligence: http://trii-grafana.local/d/business-intelligence"
echo "  ML Performance: http://trii-grafana.local/d/ml-performance"  
echo "  Security & Compliance: http://trii-grafana.local/d/security-compliance"
echo ""
echo "🚢 ArgoCD Applications:"
echo "  TRII Platform: https://argocd.local/applications/trii-platform"
echo "  Monitoring Stack: https://argocd.local/applications/monitoring-stack"
echo "  Business Dashboards: https://argocd.local/applications/business-dashboards"