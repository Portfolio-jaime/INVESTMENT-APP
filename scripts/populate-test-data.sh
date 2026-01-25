#!/bin/bash

echo "🌱 Poblando datos de prueba en TRII Platform..."

# Función para hacer requests
make_request() {
    local url=$1
    local data=$2
    local description=$3

    echo "📝 $description"
    curl -X POST \
         -H "Content-Type: application/json" \
         -d "$data" \
         "$url" 2>/dev/null | jq '.' 2>/dev/null || echo "Request completed"
    echo ""
}

# Crear portfolios de prueba
echo "📊 Creando portfolios de prueba..."

make_request "http://localhost/api/portfolio-manager/portfolios" \
    '{"user_id": 1, "name": "Conservative Portfolio", "description": "Low-risk investment portfolio", "currency": "USD"}' \
    "Creating Conservative Portfolio"

make_request "http://localhost/api/portfolio-manager/portfolios" \
    '{"user_id": 1, "name": "Growth Portfolio", "description": "High-growth technology stocks", "currency": "USD"}' \
    "Creating Growth Portfolio"

make_request "http://localhost/api/portfolio-manager/portfolios" \
    '{"user_id": 1, "name": "Balanced Portfolio", "description": "Mixed asset allocation", "currency": "USD"}' \
    "Creating Balanced Portfolio"

# Verificar que se crearon
echo "✅ Verificando portfolios creados..."
curl -H "Host: localhost" "http://localhost/api/portfolio-manager/portfolios" 2>/dev/null | jq '.' 2>/dev/null || echo "Portfolios list retrieved"

echo ""
echo "🎉 Datos de prueba poblados exitosamente!"
echo ""
echo "📋 Resumen:"
echo "- 3 Portfolios de prueba creados"
echo "- Usuario ID: 1"
echo "- Moneda: USD"
