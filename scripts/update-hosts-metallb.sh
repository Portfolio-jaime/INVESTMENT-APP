#!/bin/bash
#
# Update /etc/hosts to use MetalLB IP for TRII Platform services
# Run with: sudo ./scripts/update-hosts-metallb.sh
#

set -e

METALLB_IP="172.18.255.200"

echo "Updating /etc/hosts to use MetalLB IP: $METALLB_IP"

# Backup /etc/hosts
cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)

# Update TRII Platform entries to use MetalLB IP
sed -i.bak \
  -e "s/^127\.0\.0\.1 argocd\.trii-platform\.com/$METALLB_IP argocd.trii-platform.com/" \
  -e "s/^127\.0\.0\.1 api\.trii-platform\.com/$METALLB_IP api.trii-platform.com/" \
  -e "s/^127\.0\.0\.1 app\.trii-platform\.com/$METALLB_IP app.trii-platform.com/" \
  -e "s/^127\.0\.0\.1 api\.trii-platform\.local/$METALLB_IP api.trii-platform.local/" \
  -e "s/^127\.0\.0\.1 app\.trii-platform\.local/$METALLB_IP app.trii-platform.local/" \
  -e "s/^127\.0\.0\.1 market-data\.trii-platform\.local/$METALLB_IP market-data.trii-platform.local/" \
  -e "s/^127\.0\.0\.1 analysis-engine\.trii-platform\.local/$METALLB_IP analysis-engine.trii-platform.local/" \
  -e "s/^127\.0\.0\.1 portfolio-manager\.trii-platform\.local/$METALLB_IP portfolio-manager.trii-platform.local/" \
  -e "s/^127\.0\.0\.1 ml-prediction\.trii-platform\.local/$METALLB_IP ml-prediction.trii-platform.local/" \
  /etc/hosts

echo "✓ /etc/hosts updated successfully!"
echo ""
echo "MetalLB IP: $METALLB_IP"
echo ""
echo "You can now access services via ingress:"
echo "  - ArgoCD:              http://argocd.trii-platform.com"
echo "  - API Gateway:         http://api.trii-platform.local"
echo "  - Desktop App:         http://app.trii-platform.local"
echo "  - Market Data:         http://market-data.trii-platform.local"
echo "  - Analysis Engine:     http://analysis-engine.trii-platform.local"
echo "  - Portfolio Manager:   http://portfolio-manager.trii-platform.local"
echo "  - ML Prediction:       http://ml-prediction.trii-platform.local"
echo ""
echo "Test with: curl http://argocd.trii-platform.com"
