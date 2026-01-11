#!/bin/bash

# Deploy TRII Platform Monitoring Stack
echo "🔧 Deploying TRII Platform Monitoring Stack..."

# Create monitoring namespace and apply all manifests
kubectl apply -f infrastructure/k8s-manifests/monitoring/prometheus-rules.yaml
kubectl apply -f infrastructure/k8s-manifests/monitoring/prometheus.yaml
kubectl apply -f infrastructure/k8s-manifests/monitoring/grafana-dashboards.yaml
kubectl apply -f infrastructure/k8s-manifests/monitoring/grafana.yaml
kubectl apply -f infrastructure/k8s-manifests/monitoring/monitoring-ingress.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for monitoring services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n trii-monitoring
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n trii-monitoring

# Update /etc/hosts for local access
echo "🌐 Updating /etc/hosts for monitoring services..."
if ! grep -q "trii-grafana.local" /etc/hosts; then
    echo "127.0.0.1 trii-grafana.local" | sudo tee -a /etc/hosts
fi

if ! grep -q "trii-prometheus.local" /etc/hosts; then
    echo "127.0.0.1 trii-prometheus.local" | sudo tee -a /etc/hosts
fi

# Check status
echo "📊 Monitoring Stack Status:"
kubectl get pods -n trii-monitoring
kubectl get services -n trii-monitoring
kubectl get ingress -n trii-monitoring

echo ""
echo "🎉 TRII Monitoring Stack deployed successfully!"
echo ""
echo "📊 Access your monitoring services:"
echo "   🔍 Prometheus: http://trii-prometheus.local"
echo "   📈 Grafana: http://trii-grafana.local"
echo "   👤 Grafana Login: admin / trii-admin-2026"
echo ""
echo "🚀 Opening monitoring services in browser..."

# Open in browser
sleep 3
if command -v open &> /dev/null; then
    open http://trii-grafana.local
    open http://trii-prometheus.local
elif command -v xdg-open &> /dev/null; then
    xdg-open http://trii-grafana.local
    xdg-open http://trii-prometheus.local
fi

echo "✅ Monitoring stack deployment complete!"