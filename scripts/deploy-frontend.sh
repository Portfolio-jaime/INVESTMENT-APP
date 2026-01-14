#!/bin/bash

# 🚀 Frontend Build & Deploy Script for Kind Cluster
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="app/frontend"
IMAGE_NAME="trii/frontend"
IMAGE_TAG="latest"
NAMESPACE="trii-system"

echo -e "${BLUE}🚀 Starting Frontend Build & Deploy Process${NC}"

# Check if Kind cluster is running
if ! kind get clusters | grep -q "kind"; then
    echo -e "${RED}❌ Kind cluster not found. Please start the cluster first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Kind cluster found${NC}"

# Navigate to frontend directory
cd $FRONTEND_DIR

echo -e "${YELLOW}📦 Building frontend application...${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing dependencies...${NC}"
    npm install
fi

# Build the application
echo -e "${YELLOW}🔨 Building production bundle...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completed${NC}"

# Build Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# Load image into Kind cluster
echo -e "${YELLOW}📤 Loading image into Kind cluster...${NC}"
kind load docker-image ${IMAGE_NAME}:${IMAGE_TAG}

echo -e "${GREEN}✅ Image loaded into Kind cluster${NC}"

# Go back to root directory
cd ../../

# Create namespace if it doesn't exist
echo -e "${YELLOW}🏗️ Creating namespace if needed...${NC}"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes manifests
echo -e "${YELLOW}🚁 Deploying to Kubernetes...${NC}"
kubectl apply -f infrastructure/k8s/frontend.yaml

# Wait for deployment to be ready
echo -e "${YELLOW}⏳ Waiting for deployment to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n $NAMESPACE

# Get service information
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${BLUE}📋 Service Information:${NC}"
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

# Port forward for local access
echo -e "${BLUE}🌐 Setting up port forwarding...${NC}"
echo -e "${YELLOW}Frontend will be available at: http://localhost:8080${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop port forwarding${NC}"

kubectl port-forward -n $NAMESPACE service/frontend-service 8080:80