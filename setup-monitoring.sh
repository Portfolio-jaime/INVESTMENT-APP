#!/bin/bash
set -e
echo "🚀 Investment App Monitoring Setup"
echo "================================="

mkdir -p observatory/{prometheus,grafana/{dashboards,provisioning/{dashboards,datasources}}}

# Configuración de Prometheus
cat > observatory/prometheus/prometheus.yml << 'PROM_EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'investment-app'
    static_configs:
      - targets: ['host.docker.internal:3000']
    scrape_interval: 10s
    metrics_path: /metrics
    scrape_timeout: 5s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
PROM_EOF

# Configuración de datasources de Grafana
cat > observatory/grafana/provisioning/datasources/datasources.yml << 'DS_EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
DS_EOF

# Configuración de dashboards de Grafana
cat > observatory/grafana/provisioning/dashboards/dashboards.yml << 'DASH_EOF'
apiVersion: 1
providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
DASH_EOF

# Dashboard para la aplicación de inversiones
cat > observatory/grafana/dashboards/investment-dashboard.json << 'GRAF_EOF'
{
  "dashboard": {
    "id": null,
    "title": "Investment App Monitor",
    "tags": ["investment", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} requests/sec"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
GRAF_EOF

# Docker Compose para el stack de monitoreo
cat > observatory/docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

networks:
  monitoring:
    driver: bridge

services:
  prometheus:
    image: prom/prometheus:v2.40.0
    container_name: investment-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring
    restart: unless-stopped

  grafana:
    image: grafana/grafana:9.3.0
    container_name: investment-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
    networks:
      - monitoring
    restart: unless-stopped
    depends_on:
      - prometheus

volumes:
  grafana-storage:
COMPOSE_EOF

echo "📁 Configuration files created"
echo "🐳 Starting monitoring stack..."

cd observatory
docker-compose up -d

echo "⏳ Waiting for services..."
sleep 15

PROM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/-/ready 2>/dev/null || echo "000")
GRAF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "000")

echo ""
echo "🎯 Monitoring Stack Status:"
echo "=========================="
if [[ "$PROM_STATUS" == "200" ]]; then
    echo "✅ Prometheus: http://localhost:9090"
else
    echo "⏳ Prometheus still starting (HTTP $PROM_STATUS)"
fi

if [[ "$GRAF_STATUS" == "200" ]]; then
    echo "✅ Grafana: http://localhost:3001 (admin/admin123)"
else
    echo "⏳ Grafana still starting (HTTP $GRAF_STATUS)"
fi

echo ""
echo "🔧 Management commands:"
echo "docker-compose logs -f     # View logs"
echo "docker-compose down        # Stop monitoring"
echo "docker-compose restart     # Restart services"
