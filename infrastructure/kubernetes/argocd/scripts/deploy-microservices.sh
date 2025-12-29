#!/bin/bash

##############################################################################
# TRII Platform - Microservices Deployment Script
# Deploys separate ArgoCD Applications for each microservice
##############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ARGOCD_NAMESPACE="argocd"
TARGET_NAMESPACE="trii-dev"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="${SCRIPT_DIR}/../applications/microservices"
APPSET_DIR="${SCRIPT_DIR}/../applicationsets"

##############################################################################
# Helper Functions
##############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    # Check argocd CLI
    if ! command -v argocd &> /dev/null; then
        log_warning "argocd CLI is not installed (optional but recommended)"
    fi

    # Check if ArgoCD is running
    if ! kubectl get namespace "${ARGOCD_NAMESPACE}" &> /dev/null; then
        log_error "ArgoCD namespace '${ARGOCD_NAMESPACE}' not found"
        exit 1
    fi

    # Check if ArgoCD server is ready
    if ! kubectl get deployment argocd-server -n "${ARGOCD_NAMESPACE}" &> /dev/null; then
        log_error "ArgoCD server deployment not found"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

##############################################################################
# Deployment Strategy Selection
##############################################################################

show_menu() {
    echo ""
    echo "========================================="
    echo "TRII Microservices Deployment Options"
    echo "========================================="
    echo "1) Deploy Individual Applications (Recommended)"
    echo "2) Deploy using ApplicationSet (All at once)"
    echo "3) Deploy Infrastructure Only"
    echo "4) Deploy Specific Service"
    echo "5) Check Application Status"
    echo "6) Delete All Applications"
    echo "7) Exit"
    echo "========================================="
    echo ""
}

##############################################################################
# Deploy Individual Applications
##############################################################################

deploy_individual_apps() {
    log_info "Deploying individual ArgoCD Applications..."

    local apps=(
        "trii-infrastructure.yaml"
        "trii-market-data.yaml"
        "trii-analysis-engine.yaml"
        "trii-ml-prediction.yaml"
        "trii-portfolio-manager.yaml"
        "trii-api-gateway.yaml"
    )

    for app in "${apps[@]}"; do
        log_info "Deploying ${app}..."
        if kubectl apply -f "${APPS_DIR}/${app}" -n "${ARGOCD_NAMESPACE}"; then
            log_success "Successfully deployed ${app}"
        else
            log_error "Failed to deploy ${app}"
            return 1
        fi
        sleep 2
    done

    log_success "All individual applications deployed"
    log_info "Applications will sync automatically based on sync waves"
}

##############################################################################
# Deploy ApplicationSet
##############################################################################

deploy_applicationset() {
    log_info "Deploying ApplicationSet for all microservices..."

    if kubectl apply -f "${APPSET_DIR}/trii-microservices-appset.yaml" -n "${ARGOCD_NAMESPACE}"; then
        log_success "ApplicationSet deployed successfully"
        log_info "ArgoCD will automatically create Applications for all microservices"
    else
        log_error "Failed to deploy ApplicationSet"
        return 1
    fi
}

##############################################################################
# Deploy Infrastructure Only
##############################################################################

deploy_infrastructure() {
    log_info "Deploying infrastructure components only..."

    if kubectl apply -f "${APPS_DIR}/trii-infrastructure.yaml" -n "${ARGOCD_NAMESPACE}"; then
        log_success "Infrastructure application deployed"
    else
        log_error "Failed to deploy infrastructure"
        return 1
    fi
}

##############################################################################
# Deploy Specific Service
##############################################################################

deploy_specific_service() {
    echo ""
    echo "Available Services:"
    echo "1) infrastructure"
    echo "2) market-data"
    echo "3) analysis-engine"
    echo "4) ml-prediction"
    echo "5) portfolio-manager"
    echo "6) api-gateway"
    echo ""
    read -p "Select service to deploy (1-6): " service_choice

    local service_file=""
    case $service_choice in
        1) service_file="trii-infrastructure.yaml" ;;
        2) service_file="trii-market-data.yaml" ;;
        3) service_file="trii-analysis-engine.yaml" ;;
        4) service_file="trii-ml-prediction.yaml" ;;
        5) service_file="trii-portfolio-manager.yaml" ;;
        6) service_file="trii-api-gateway.yaml" ;;
        *) log_error "Invalid selection"; return 1 ;;
    esac

    log_info "Deploying ${service_file}..."
    if kubectl apply -f "${APPS_DIR}/${service_file}" -n "${ARGOCD_NAMESPACE}"; then
        log_success "Successfully deployed ${service_file}"
    else
        log_error "Failed to deploy ${service_file}"
        return 1
    fi
}

##############################################################################
# Check Application Status
##############################################################################

check_app_status() {
    log_info "Checking ArgoCD Application status..."

    echo ""
    echo "========================================="
    echo "Application Status"
    echo "========================================="

    kubectl get applications -n "${ARGOCD_NAMESPACE}" -l app.kubernetes.io/part-of=trii-platform \
        -o custom-columns=\
NAME:.metadata.name,\
SYNC:.status.sync.status,\
HEALTH:.status.health.status,\
WAVE:.metadata.annotations.argocd\\.argoproj\\.io/sync-wave

    echo ""
    echo "========================================="
    echo "Pod Status in ${TARGET_NAMESPACE}"
    echo "========================================="

    kubectl get pods -n "${TARGET_NAMESPACE}" -o wide

    echo ""
}

##############################################################################
# Delete All Applications
##############################################################################

delete_all_apps() {
    log_warning "This will delete ALL TRII microservice applications from ArgoCD"
    read -p "Are you sure? (yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        log_info "Deletion cancelled"
        return 0
    fi

    log_info "Deleting all TRII applications..."

    # Delete ApplicationSet if exists
    kubectl delete applicationset trii-microservices -n "${ARGOCD_NAMESPACE}" --ignore-not-found

    # Delete individual applications
    kubectl delete applications -n "${ARGOCD_NAMESPACE}" -l app.kubernetes.io/part-of=trii-platform

    log_success "All applications deleted"
}

##############################################################################
# Wait for Application Sync
##############################################################################

wait_for_app_sync() {
    local app_name=$1
    local max_wait=300
    local elapsed=0

    log_info "Waiting for ${app_name} to sync (timeout: ${max_wait}s)..."

    while [ $elapsed -lt $max_wait ]; do
        local sync_status=$(kubectl get application "${app_name}" -n "${ARGOCD_NAMESPACE}" \
            -o jsonpath='{.status.sync.status}' 2>/dev/null || echo "Unknown")
        local health_status=$(kubectl get application "${app_name}" -n "${ARGOCD_NAMESPACE}" \
            -o jsonpath='{.status.health.status}' 2>/dev/null || echo "Unknown")

        if [[ "$sync_status" == "Synced" && "$health_status" == "Healthy" ]]; then
            log_success "${app_name} is synced and healthy"
            return 0
        fi

        echo -ne "\r${BLUE}[INFO]${NC} ${app_name}: Sync=${sync_status}, Health=${health_status} (${elapsed}s elapsed)"
        sleep 5
        ((elapsed+=5))
    done

    echo ""
    log_warning "${app_name} did not become healthy within ${max_wait}s"
    return 1
}

##############################################################################
# Main Menu Loop
##############################################################################

main() {
    log_info "TRII Platform Microservices Deployment Tool"

    check_prerequisites

    while true; do
        show_menu
        read -p "Select an option (1-7): " choice

        case $choice in
            1)
                deploy_individual_apps
                ;;
            2)
                deploy_applicationset
                ;;
            3)
                deploy_infrastructure
                ;;
            4)
                deploy_specific_service
                ;;
            5)
                check_app_status
                ;;
            6)
                delete_all_apps
                ;;
            7)
                log_info "Exiting..."
                exit 0
                ;;
            *)
                log_error "Invalid option. Please select 1-7"
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main
