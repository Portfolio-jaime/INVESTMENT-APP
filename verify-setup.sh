#!/bin/bash
echo "🔍 Investment App Environment Check"
echo "=================================="

if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

NODE_VERSION=$(node --version 2>/dev/null || echo "NOT_FOUND")
if [[ "$NODE_VERSION" != "NOT_FOUND" ]]; then
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js missing"
    exit 1
fi

if [[ -d "node_modules" ]]; then
    echo "✅ Node modules installed"
else
    echo "⚠️  Run 'npm install' first"
fi

if docker --version &>/dev/null && docker info &>/dev/null; then
    echo "✅ Docker ready"
    if docker-compose --version &>/dev/null || docker compose version &>/dev/null; then
        echo "✅ Docker Compose available"
    else
        echo "❌ Docker Compose unavailable"
        exit 1
    fi
else
    echo "❌ Docker unavailable - please start Docker Desktop"
    exit 1
fi

APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
if [[ "$APP_STATUS" == "200" ]]; then
    echo "✅ Investment app responding"
    echo "🟢 System ready for monitoring"
else
    echo "⚠️  App not responding on port 3000"
    echo "🟡 Start app first: npm start"
fi

echo -e "\nNext steps:"
if [[ "$APP_STATUS" != "200" ]]; then
    echo "1. npm start"
    echo "2. ./setup-monitoring.sh"
else
    echo "1. ./setup-monitoring.sh"
fi
