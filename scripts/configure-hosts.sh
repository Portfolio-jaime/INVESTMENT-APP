#!/bin/bash
#
# Configure /etc/hosts for TRII Platform Kubernetes Services
# Run with: sudo ./scripts/configure-hosts.sh
#

set -e

echo "Configuring /etc/hosts for TRII Platform services..."

# Backup /etc/hosts
cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)

# Remove old TRII entries if they exist
sed -i.bak '/# TRII Platform Services/,/# End TRII Platform/d' /etc/hosts

# Add new entries
cat >> /etc/hosts <<EOF

# TRII Platform Services - Kubernetes Ingress
127.0.0.1 argocd-dev.trii-platform.com
127.0.0.1 api.trii-platform.local
127.0.0.1 app.trii-platform.local
127.0.0.1 market-data.trii-platform.local
127.0.0.1 analysis-engine.trii-platform.local
127.0.0.1 portfolio-manager.trii-platform.local
127.0.0.1 ml-prediction.trii-platform.local
# End TRII Platform

EOF

echo "✓ /etc/hosts configured successfully!"
echo ""
echo "You can now access:"
echo "  - ArgoCD:              http://argocd-dev.trii-platform.com"
echo "  - API Gateway:         http://api.trii-platform.local"
echo "  - Desktop App:         http://app.trii-platform.local"
echo "  - Market Data:         http://market-data.trii-platform.local"
echo "  - Analysis Engine:     http://analysis-engine.trii-platform.local"
echo "  - Portfolio Manager:   http://portfolio-manager.trii-platform.local"
echo "  - ML Prediction:       http://ml-prediction.trii-platform.local"
echo ""
echo "ArgoCD credentials:"
echo "  Username: admin"
echo "  Password: (run 'kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d')"
