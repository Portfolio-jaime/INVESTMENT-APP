#!/bin/bash

##############################################################################
# TRII Platform - Microservices Deployment Verification Script
# Verifies health and connectivity of all microservices
##############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ARGOCD_NAMESPACE="argocd"
TARGET_NAMESPACE="trii-dev"

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

##############################################################################
# Verification Functions
##############################################################################

verify_argocd_apps() {
    log_info "Verifying ArgoCD Applications..."

    local apps=(
        "trii-infrastructure"
        "trii-market-data"
        "trii-analysis-engine"
        "trii-ml-prediction"
        "trii-portfolio-manager"
        "trii-api-gateway"
    )

    local all_healthy=true

    echo ""
    printf "%-30s %-12s %-12s %-12s\n" "APPLICATION" "SYNC STATUS" "HEALTH" "SYNC WAVE"
    printf "%-30s %-12s %-12s %-12s\n" "----------" "-----------" "------" "---------"

    for app in "${apps[@]}"; do
        if kubectl get application "${app}" -n "${ARGOCD_NAMESPACE}" &> /dev/null; then
            local sync_status=$(kubectl get application "${app}" -n "${ARGOCD_NAMESPACE}" \
                -o jsonpath='{.status.sync.status}' 2>/dev/null || echo "Unknown")
            local health_status=$(kubectl get application "${app}" -n "${ARGOCD_NAMESPACE}" \
                -o jsonpath='{.status.health.status}' 2>/dev/null || echo "Unknown")
            local sync_wave=$(kubectl get application "${app}" -n "${ARGOCD_NAMESPACE}" \
                -o jsonpath='{.metadata.annotations.argocd\.argoproj\.io/sync-wave}' 2>/dev/null || echo "N/A")

            # Color code health status
            local health_color="${NC}"
            if [[ "$health_status" == "Healthy" ]]; then
                health_color="${GREEN}"
            elif [[ "$health_status" == "Degraded" ]]; then
                health_color="${RED}"
                all_healthy=false
            else
                health_color="${YELLOW}"
                all_healthy=false
            fi

            printf "%-30s %-12s ${health_color}%-12s${NC} %-12s\n" \
                "${app}" "${sync_status}" "${health_status}" "${sync_wave}"
        else
            printf "%-30s %-12s ${RED}%-12s${NC} %-12s\n" \
                "${app}" "NotFound" "NotFound" "N/A"
            all_healthy=false
        fi
    done

    echo ""

    if $all_healthy; then
        log_success "All ArgoCD applications are healthy"
        return 0
    else
        log_warning "Some applications are not healthy"
        return 1
    fi
}

verify_pods() {
    log_info "Verifying Pod status in ${TARGET_NAMESPACE}..."

    if ! kubectl get namespace "${TARGET_NAMESPACE}" &> /dev/null; then
        log_error "Namespace ${TARGET_NAMESPACE} does not exist"
        return 1
    fi

    echo ""
    kubectl get pods -n "${TARGET_NAMESPACE}" \
        -o custom-columns=\
NAME:.metadata.name,\
STATUS:.status.phase,\
RESTARTS:.status.containerStatuses[0].restartCount,\
AGE:.metadata.creationTimestamp

    echo ""

    # Check for any pods not in Running state
    local unhealthy_pods=$(kubectl get pods -n "${TARGET_NAMESPACE}" \
        --field-selector=status.phase!=Running,status.phase!=Succeeded \
        --no-headers 2>/dev/null | wc -l)

    if [ "$unhealthy_pods" -eq 0 ]; then
        log_success "All pods are running"
        return 0
    else
        log_warning "${unhealthy_pods} pod(s) are not in Running state"
        return 1
    fi
}

verify_services() {
    log_info "Verifying Service endpoints..."

    local services=(
        "postgres-service:5432"
        "redis-service:6379"
        "rabbitmq-service:5672"
        "minio-service:9000"
        "market-data-service:8001"
        "analysis-engine-service:8002"
        "portfolio-manager-service:8003"
        "ml-prediction-service:8004"
        "api-gateway-service:8080"
    )

    echo ""
    printf "%-35s %-12s %-20s\n" "SERVICE" "STATUS" "ENDPOINTS"
    printf "%-35s %-12s %-20s\n" "-------" "------" "---------"

    for service_info in "${services[@]}"; do
        local service_name="${service_info%:*}"
        local service_port="${service_info#*:}"

        if kubectl get service "${service_name}" -n "${TARGET_NAMESPACE}" &> /dev/null; then
            local endpoints=$(kubectl get endpoints "${service_name}" -n "${TARGET_NAMESPACE}" \
                -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null || echo "None")

            if [[ -n "$endpoints" && "$endpoints" != "None" ]]; then
                printf "%-35s ${GREEN}%-12s${NC} %-20s\n" \
                    "${service_name}:${service_port}" "Ready" "${endpoints}"
            else
                printf "%-35s ${YELLOW}%-12s${NC} %-20s\n" \
                    "${service_name}:${service_port}" "No Endpoints" "N/A"
            fi
        else
            printf "%-35s ${RED}%-12s${NC} %-20s\n" \
                "${service_name}:${service_port}" "Not Found" "N/A"
        fi
    done

    echo ""
}

test_api_gateway() {
    log_info "Testing API Gateway connectivity..."

    # Try to get the API Gateway NodePort service
    local nodeport=$(kubectl get service api-gateway-nodeport -n "${TARGET_NAMESPACE}" \
        -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")

    if [[ -z "$nodeport" ]]; then
        log_warning "API Gateway NodePort service not found"
        return 1
    fi

    log_info "API Gateway accessible at: http://localhost:${nodeport}"

    # Test health endpoint
    if command -v curl &> /dev/null; then
        log_info "Testing health endpoint..."
        if curl -s -f "http://localhost:${nodeport}/health" > /dev/null; then
            log_success "API Gateway health check passed"
        else
            log_warning "API Gateway health check failed"
        fi
    else
        log_info "curl not available, skipping health check test"
    fi

    echo ""
}

test_microservice_connectivity() {
    log_info "Testing microservice internal connectivity..."

    # Port-forward to API Gateway and test backend services
    local gateway_pod=$(kubectl get pod -n "${TARGET_NAMESPACE}" -l app=api-gateway \
        -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [[ -z "$gateway_pod" ]]; then
        log_warning "API Gateway pod not found, skipping connectivity test"
        return 1
    fi

    # Test if services are reachable from API Gateway
    local backend_services=(
        "market-data-service:8001"
        "analysis-engine-service:8002"
        "portfolio-manager-service:8003"
        "ml-prediction-service:8004"
    )

    echo ""
    printf "%-40s %-15s\n" "SERVICE" "STATUS"
    printf "%-40s %-15s\n" "-------" "------"

    for service in "${backend_services[@]}"; do
        local service_name="${service%:*}"
        local service_port="${service#*:}"

        # Simple connectivity test using kubectl exec
        if kubectl exec -n "${TARGET_NAMESPACE}" "${gateway_pod}" -- \
            wget -q -O- "http://${service_name}:${service_port}/health" --timeout=2 &> /dev/null; then
            printf "%-40s ${GREEN}%-15s${NC}\n" "${service}" "Reachable"
        else
            printf "%-40s ${RED}%-15s${NC}\n" "${service}" "Unreachable"
        fi
    done

    echo ""
}

display_sync_wave_order() {
    log_info "Deployment Sync Wave Order:"

    echo ""
    echo "Wave 0 (Infrastructure):"
    echo "  - PostgreSQL (TimescaleDB)"
    echo "  - Redis"
    echo "  - RabbitMQ"
    echo "  - MinIO"
    echo ""
    echo "Wave 1 (Core Services):"
    echo "  - Market Data Service"
    echo ""
    echo "Wave 2 (Analysis Services):"
    echo "  - Analysis Engine"
    echo "  - ML Prediction Service"
    echo ""
    echo "Wave 3 (Business Logic):"
    echo "  - Portfolio Manager"
    echo ""
    echo "Wave 4 (Gateway):"
    echo "  - API Gateway"
    echo ""
}

show_useful_commands() {
    log_info "Useful Commands:"

    echo ""
    echo "# View Application details"
    echo "kubectl get applications -n argocd -l app.kubernetes.io/part-of=trii-platform"
    echo ""
    echo "# View specific application"
    echo "kubectl get application trii-api-gateway -n argocd -o yaml"
    echo ""
    echo "# View all pods"
    echo "kubectl get pods -n trii-dev -o wide"
    echo ""
    echo "# Check logs for specific service"
    echo "kubectl logs -n trii-dev -l app=api-gateway --tail=100 -f"
    echo ""
    echo "# Port-forward to API Gateway"
    echo "kubectl port-forward -n trii-dev svc/api-gateway-service 8080:8080"
    echo ""
    echo "# Sync specific application"
    echo "kubectl patch application trii-api-gateway -n argocd --type merge -p '{\"operation\":{\"initiatedBy\":{\"username\":\"admin\"},\"sync\":{}}}'"
    echo ""
    echo "# View ArgoCD UI"
    echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
    echo ""
}

##############################################################################
# Main Function
##############################################################################

main() {
    echo ""
    echo "========================================="
    echo "TRII Platform Deployment Verification"
    echo "========================================="
    echo ""

    local exit_code=0

    # Run all verification checks
    verify_argocd_apps || exit_code=1
    verify_pods || exit_code=1
    verify_services || exit_code=1
    test_api_gateway || exit_code=1

    echo ""
    display_sync_wave_order

    echo ""
    show_useful_commands

    echo ""
    echo "========================================="
    if [ $exit_code -eq 0 ]; then
        log_success "All verification checks passed!"
    else
        log_warning "Some verification checks failed. Review output above."
    fi
    echo "========================================="
    echo ""

    return $exit_code
}

# Run main function
main
