#!/bin/bash

# TRII Platform - Deploy Services via ArgoCD
# Deploys all microservices to the Kind cluster using ArgoCD applications

set -e

ARGOCD_NAMESPACE="argocd"
SERVICES=(
    "market-data"
    "analysis-engine"
    "ml-prediction"
    "portfolio-manager"
    "broker-integration"
    "auth-service"
    "notification-service"
)

echo "🚀 Deploying TRII Platform microservices via ArgoCD..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not configured. Please ensure kubectl is set up for your Kind cluster."
    exit 1
fi

# Check if ArgoCD is installed
if ! kubectl get namespace "${ARGOCD_NAMESPACE}" &> /dev/null; then
    echo "❌ ArgoCD namespace '${ARGOCD_NAMESPACE}' not found. Please run ./install-argocd.sh first."
    exit 1
fi

# Create trii-platform namespace if it doesn't exist
echo "📁 Ensuring trii-platform namespace exists..."
kubectl create namespace trii-platform --dry-run=client -o yaml | kubectl apply -f -

# Deploy databases
echo "🗄️  Deploying databases..."
kubectl apply -f ../k8s-manifests/postgres.yaml
kubectl apply -f ../k8s-manifests/redis.yaml
kubectl apply -f ../k8s-manifests/rabbitmq.yaml

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=Ready pod -l app=postgres -n trii-platform --timeout=300s
kubectl wait --for=condition=Ready pod -l app=redis -n trii-platform --timeout=300s
kubectl wait --for=condition=Ready pod -l app=rabbitmq -n trii-platform --timeout=300s

# Build and push Docker images to Docker Hub
echo "🏗️  Building and pushing Docker images to Docker Hub..."

# Load environment variables from .env
if [ -f "../../.env" ]; then
  set -a
  source ../../.env
  set +a
fi

# Check if variables are loaded
echo "DOCKERHUB_USERNAME: $DOCKERHUB_USERNAME"
echo "DOCKERHUB_TOKEN: ${DOCKERHUB_TOKEN:0:10}..."

# Login to Docker Hub
echo "Logging in to Docker Hub..."
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

# Build and push market-data
echo "Building and pushing market-data..."
cd ../../backend/market-data
docker build -t jaimehenao8126/trii-market-data:latest .
docker push jaimehenao8126/trii-market-data:latest

# Build and push analysis-engine
echo "Building and pushing analysis-engine..."
cd ../analysis-engine
docker build -t jaimehenao8126/trii-analysis-engine:latest .
docker push jaimehenao8126/trii-analysis-engine:latest

# Build and push portfolio-manager
echo "Building and pushing portfolio-manager..."
cd ../portfolio-manager
docker build -t jaimehenao8126/trii-portfolio-manager:latest .
docker push jaimehenao8126/trii-portfolio-manager:latest

# Build and push ml-prediction
echo "Building and pushing ml-prediction..."
cd ../ml-prediction
docker build -t jaimehenao8126/trii-ml-prediction:latest .
docker push jaimehenao8126/trii-ml-prediction:latest

# Build and push auth-service (placeholder)
echo "Building and pushing auth-service..."
cd ../../infrastructure/helm/auth-service
docker build -t jaimehenao8126/trii-auth-service:latest -f Dockerfile . 2>/dev/null || docker build -t jaimehenao8126/trii-auth-service:latest - <<EOF
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
docker push jaimehenao8126/trii-auth-service:latest

# Build and push notification-service (placeholder)
echo "Building and pushing notification-service..."
cd ../notification-service
docker build -t jaimehenao8126/trii-notification-service:latest -f Dockerfile . 2>/dev/null || docker build -t jaimehenao8126/trii-notification-service:latest - <<EOF
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
docker push jaimehenao8126/trii-notification-service:latest

# Build and push broker-integration (placeholder)
echo "Building and pushing broker-integration..."
cd ../broker-integration
docker build -t jaimehenao8126/trii-broker-integration:latest -f Dockerfile . 2>/dev/null || docker build -t jaimehenao8126/trii-broker-integration:latest - <<EOF
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
docker push jaimehenao8126/trii-broker-integration:latest

cd ../../../../infrastructure/scripts

# Deploy each service
for service in "${SERVICES[@]}"; do
  echo "📦 Deploying ${service}..."
  kubectl apply -f "../argocd/${service}-app.yaml"
done

echo "⏳ Waiting for ArgoCD applications to sync..."
# Wait a bit for ArgoCD to process
sleep 10

# Check sync status
echo "📊 Checking deployment status..."
kubectl get applications -n "${ARGOCD_NAMESPACE}"

echo "✅ TRII Platform microservices deployment initiated!"
echo "💡 Monitor deployment progress in ArgoCD UI:"
echo "   kubectl port-forward svc/argocd-server -n ${ARGOCD_NAMESPACE} 8080:443"
echo "   Then visit: https://localhost:8080"
echo ""
echo "🔍 Check service status:"
echo "   kubectl get pods -n trii-platform"
echo "   kubectl get services -n trii-platform"