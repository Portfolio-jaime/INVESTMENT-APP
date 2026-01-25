#!/bin/bash
set -e

echo "🗑️  Eliminando cluster Kind..."
kind delete cluster --name trii-dev
echo "✅ Cluster eliminado exitosamente!"
