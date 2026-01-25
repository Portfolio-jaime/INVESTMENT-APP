#!/bin/bash
set -e

echo "🚀 Construyendo y subiendo imágenes Docker a Docker Hub..."

# Configuración
DOCKER_USERNAME=${DOCKER_USERNAME:-"jaimehenao8126"}  # Usuario de Docker Hub
TAG=${TAG:-"latest"}

# Servicios a construir
SERVICES=(
    "market-data:./services/market-data"
    "analysis-engine:./services/analysis-engine"
    "portfolio-manager:./services/portfolio-manager"
    "ml-prediction:./services/ml-prediction"
)

# Login a Docker Hub (solo si no está logueado)
echo "🔐 Verificando login en Docker Hub..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ No estás logueado en Docker. Por favor ejecuta:"
    echo "   docker login"
    exit 1
fi

# Construir y subir cada servicio
for service_info in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo $service_info | cut -d: -f1)
    SERVICE_PATH=$(echo $service_info | cut -d: -f2)

    IMAGE_NAME="${DOCKER_USERNAME}/trii-${SERVICE_NAME}:${TAG}"

    echo "📦 Construyendo ${IMAGE_NAME}..."

    # Cambiar al directorio del servicio
    cd "$(dirname "$0")/../../${SERVICE_PATH}"

    # Construir imagen
    docker build -t "${IMAGE_NAME}" .

    # Subir imagen
    echo "⬆️  Subiendo ${IMAGE_NAME}..."
    docker push "${IMAGE_NAME}"

    echo "✅ ${SERVICE_NAME} completado"

    # Volver al directorio raíz
    cd "$(dirname "$0")/../.."
done

echo ""
echo "🎉 Todas las imágenes han sido construidas y subidas exitosamente!"
echo ""
echo "📋 Imágenes disponibles en Docker Hub:"
for service_info in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo $service_info | cut -d: -f1)
    IMAGE_NAME="${DOCKER_USERNAME}/trii-${SERVICE_NAME}:${TAG}"
    echo "  - ${IMAGE_NAME}"
done
