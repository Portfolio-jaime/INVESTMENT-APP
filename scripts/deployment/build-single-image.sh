#!/bin/bash

# Script para construir y subir una sola imagen
# Uso: ./build-single-image.sh <service-name> [tag]

SERVICE_NAME=$1
TAG=${2:-"latest"}
DOCKER_USERNAME="jaimehenao8126"

if [ -z "$SERVICE_NAME" ]; then
    echo "Uso: $0 <service-name> [tag]"
    echo "Ejemplos:"
    echo "  $0 market-data"
    echo "  $0 analysis-engine v1.0"
    exit 1
fi

SERVICE_PATH="./services/${SERVICE_NAME}"
IMAGE_NAME="${DOCKER_USERNAME}/trii-${SERVICE_NAME}:${TAG}"

echo "🏗️  Construyendo imagen: ${IMAGE_NAME}"
echo "📁 Directorio: ${SERVICE_PATH}"

# Verificar que el directorio existe
if [ ! -d "$SERVICE_PATH" ]; then
    echo "❌ Error: Directorio ${SERVICE_PATH} no existe"
    exit 1
fi

# Verificar que el Dockerfile existe
if [ ! -f "${SERVICE_PATH}/Dockerfile" ]; then
    echo "❌ Error: Dockerfile no encontrado en ${SERVICE_PATH}"
    exit 1
fi

# Cambiar al directorio del servicio
cd "$SERVICE_PATH"

# Construir imagen
echo "🔨 Construyendo imagen..."
if docker build -t "${IMAGE_NAME}" .; then
    echo "✅ Imagen construida exitosamente"

    # Subir imagen
    echo "⬆️  Subiendo imagen a Docker Hub..."
    if docker push "${IMAGE_NAME}"; then
        echo "✅ Imagen subida exitosamente"
        echo "🌐 Imagen disponible en: https://hub.docker.com/r/${IMAGE_NAME}"
    else
        echo "❌ Error al subir la imagen"
        exit 1
    fi
else
    echo "❌ Error al construir la imagen"
    exit 1
fi
