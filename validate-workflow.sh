#!/bin/bash

# 🔍 TRII Investment App - Workflow Validation Script
# This script validates the CI/CD workflow configuration and prerequisites

set -e

echo "🚀 TRII CI/CD Workflow Validation"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "✅ ${GREEN}$1${NC} exists"
        return 0
    else
        echo -e "❌ ${RED}$1${NC} missing"
        return 1
    fi
}

# Function to check if a directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "✅ ${GREEN}$1${NC} directory exists"
        return 0
    else
        echo -e "❌ ${RED}$1${NC} directory missing"
        return 1
    fi
}

echo ""
echo "📋 Checking Core Project Structure..."
echo "-----------------------------------"

# Check critical files
FILES_TO_CHECK=(
    ".github/workflows/ci-cd-pipeline.yml"
    "app/frontend/package.json"
    "Dockerfile.frontend"
    "app/frontend/nginx.conf"
    "infrastructure/helm/frontend-app/values.yaml"
    "infrastructure/helm/market-data/values.yaml"
    "backend/market-data/requirements.txt"
)

MISSING_FILES=0
for file in "${FILES_TO_CHECK[@]}"; do
    if ! check_file "$file"; then
        ((MISSING_FILES++))
    fi
done

echo ""
echo "📁 Checking Directory Structure..."
echo "--------------------------------"

# Check critical directories
DIRS_TO_CHECK=(
    "app/frontend"
    "app/frontend/components"
    "backend/market-data"
    "infrastructure/helm/frontend-app"
    "infrastructure/helm/market-data"
    "infrastructure/argocd"
)

MISSING_DIRS=0
for dir in "${DIRS_TO_CHECK[@]}"; do
    if ! check_dir "$dir"; then
        ((MISSING_DIRS++))
    fi
done

echo ""
echo "🔧 Checking Frontend Configuration..."
echo "-----------------------------------"

# Check if package.json has required scripts
if [ -f "app/frontend/package.json" ]; then
    if grep -q '"build":' "app/frontend/package.json"; then
        echo -e "✅ ${GREEN}Build script${NC} found in package.json"
    else
        echo -e "❌ ${RED}Build script${NC} missing in package.json"
        ((MISSING_FILES++))
    fi
    
    if grep -q '"type-check":' "app/frontend/package.json"; then
        echo -e "✅ ${GREEN}Type-check script${NC} found in package.json"
    else
        echo -e "⚠️ ${YELLOW}Type-check script${NC} missing in package.json (optional)"
    fi
    
    if grep -q '"lint":' "app/frontend/package.json"; then
        echo -e "✅ ${GREEN}Lint script${NC} found in package.json"
    else
        echo -e "⚠️ ${YELLOW}Lint script${NC} missing in package.json (optional)"
    fi
fi

echo ""
echo "🐳 Checking Docker Configuration..."
echo "---------------------------------"

# Check Dockerfile syntax basics
if [ -f "Dockerfile.frontend" ]; then
    if grep -q "FROM node:" "Dockerfile.frontend"; then
        echo -e "✅ ${GREEN}Node.js base image${NC} found in Dockerfile.frontend"
    else
        echo -e "❌ ${RED}Node.js base image${NC} not found in Dockerfile.frontend"
        ((MISSING_FILES++))
    fi
    
    if grep -q "FROM nginx:" "Dockerfile.frontend"; then
        echo -e "✅ ${GREEN}Nginx image${NC} found in Dockerfile.frontend"
    else
        echo -e "❌ ${RED}Nginx image${NC} not found in Dockerfile.frontend"
        ((MISSING_FILES++))
    fi
fi

echo ""
echo "⚙️ Checking Helm Configuration..."
echo "-------------------------------"

# Check Helm values files
if [ -f "infrastructure/helm/frontend-app/values.yaml" ]; then
    if grep -q 'tag:' "infrastructure/helm/frontend-app/values.yaml"; then
        echo -e "✅ ${GREEN}Image tag configuration${NC} found in frontend values.yaml"
    else
        echo -e "❌ ${RED}Image tag configuration${NC} missing in frontend values.yaml"
        ((MISSING_FILES++))
    fi
fi

echo ""
echo "🔍 Checking Workflow Configuration..."
echo "-----------------------------------"

# Check workflow improvements
if grep -q "Debug environment" ".github/workflows/ci-cd-pipeline.yml"; then
    echo -e "✅ ${GREEN}Enhanced debugging${NC} enabled in workflow"
else
    echo -e "⚠️ ${YELLOW}Enhanced debugging${NC} not found in workflow"
fi

if grep -q "has-credentials" ".github/workflows/ci-cd-pipeline.yml"; then
    echo -e "✅ ${GREEN}Docker credential checks${NC} implemented"
else
    echo -e "⚠️ ${YELLOW}Docker credential checks${NC} not found"
fi

if grep -q "set -e" ".github/workflows/ci-cd-pipeline.yml"; then
    echo -e "✅ ${GREEN}Error handling improvements${NC} implemented"
else
    echo -e "⚠️ ${YELLOW}Error handling improvements${NC} not found"
fi

echo ""
echo "📊 Validation Summary"
echo "===================="

TOTAL_ISSUES=$((MISSING_FILES + MISSING_DIRS))

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "🎉 ${GREEN}All checks passed!${NC} The workflow should run successfully."
    echo ""
    echo "📝 Next steps:"
    echo "1. Commit and push changes to trigger the workflow"
    echo "2. Monitor the GitHub Actions tab for workflow execution"
    echo "3. Check ArgoCD for automatic deployments"
    echo ""
    exit 0
else
    echo -e "⚠️ ${YELLOW}Found $TOTAL_ISSUES issues${NC} that should be addressed:"
    echo "- $MISSING_FILES missing/misconfigured files"
    echo "- $MISSING_DIRS missing directories"
    echo ""
    echo "🔧 Please fix these issues before running the workflow."
    exit 1
fi