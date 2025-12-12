#!/bin/bash

echo "Checking service health..."
echo ""

check_service() {
    SERVICE_NAME=$1
    URL=$2

    if curl -s -f -o /dev/null $URL; then
        echo "✓ $SERVICE_NAME is healthy"
    else
        echo "✗ $SERVICE_NAME is not responding"
    fi
}

check_service "Market Data" "http://localhost:8001/health"
check_service "Analysis Engine" "http://localhost:8002/health"
check_service "ML Service" "http://localhost:8003/health"
check_service "Portfolio Manager" "http://localhost:8004/health"
check_service "Risk Assessment" "http://localhost:8005/health"
check_service "Notification" "http://localhost:8006/health"

echo ""
echo "Infrastructure services:"
docker-compose ps
