#!/bin/bash

# TRII Investment Platform - Kubernetes Context Selector
# For managing Kubernetes cluster contexts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

print_context() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        print_info "Please install kubectl first:"
        echo "  macOS: brew install kubectl"
        echo "  Linux: curl -LO https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl && chmod +x kubectl && sudo mv kubectl /usr/local/bin/"
        exit 1
    fi
}

# Function to show usage
usage() {
    echo "TRII Investment Platform - Kubernetes Context Selector"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  list           List all available Kubernetes contexts"
    echo "  current        Show current Kubernetes context and cluster info"
    echo "  use <context>  Switch to specified Kubernetes context"
    echo "  info <context> Show detailed information about a context"
    echo "  clusters       List all configured clusters"
    echo "  users          List all configured users"
    echo "  test <context> Test connection to a cluster"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 current"
    echo "  $0 use my-cluster"
    echo "  $0 info my-cluster"
    echo "  $0 test my-cluster"
    echo ""
}

# Function to list all contexts
list_contexts() {
    print_header "Available Kubernetes Contexts:"
    echo ""
    
    # Get current context
    local current_context=$(kubectl config current-context 2>/dev/null || echo "")
    
    kubectl config get-contexts | while read -r line; do
        if [[ $line == NAME* ]]; then
            # Header line
            printf "${YELLOW}%-30s %-20s %-15s %-15s${NC}\n" "CONTEXT NAME" "CLUSTER" "AUTHINFO" "NAMESPACE"
            printf "${YELLOW}%-30s %-20s %-15s %-15s${NC}\n" "----------------------------" "--------------------" "---------------" "---------------"
        else
            # Data lines
            local context_name=$(echo "$line" | awk '{print $1}')
            local cluster=$(echo "$line" | awk '{print $2}')
            local authinfo=$(echo "$line" | awk '{print $3}')
            local namespace=$(echo "$line" | awk '{print $4}')
            
            # Check if this is current context
            if [[ "$context_name" == "$current_context" ]]; then
                printf "${GREEN}%-30s %-20s %-15s %-15s${NC} (current)\n" "$context_name" "$cluster" "$authinfo" "$namespace"
            else
                printf "%-30s %-20s %-15s %-15s\n" "$context_name" "$cluster" "$authinfo" "$namespace"
            fi
        fi
    done
}

# Function to show current context
current_context() {
    print_header "Current Kubernetes Context:"
    echo ""
    
    local current_ctx=$(kubectl config current-context 2>/dev/null)
    if [ -z "$current_ctx" ]; then
        print_error "No current context set"
        return 1
    fi
    
    print_context "Context: $current_ctx"
    
    # Get cluster info
    local cluster=$(kubectl config get-contexts "$current_ctx" --no-headers | awk '{print $2}')
    local user=$(kubectl config get-contexts "$current_ctx" --no-headers | awk '{print $3}')
    local namespace=$(kubectl config get-contexts "$current_ctx" --no-headers | awk '{print $4}')
    
    echo "  Cluster: $cluster"
    echo "  User: $user"
    echo "  Namespace: ${namespace:-default}"
    echo ""
    
    # Test cluster connectivity
    print_info "Testing cluster connectivity..."
    if kubectl cluster-info &>/dev/null; then
        print_success "Cluster is accessible"
    else
        print_error "Cannot connect to cluster"
        return 1
    fi
}

# Function to switch context
use_context() {
    local context_name=$1
    
    if [ -z "$context_name" ]; then
        print_error "Context name is required"
        echo "Usage: $0 use <context>"
        exit 1
    fi
    
    if kubectl config get-contexts "$context_name" &>/dev/null; then
        print_info "Switching to Kubernetes context: $context_name"
        kubectl config use-context "$context_name"
        print_success "Switched to context: $context_name"
        
        # Show new context info
        echo ""
        current_context
    else
        print_error "Context '$context_name' not found"
        print_info "Available contexts:"
        kubectl config get-contexts --no-headers | awk '{print $1}'
        exit 1
    fi
}

# Function to show context info
info_context() {
    local context_name=$1
    
    if [ -z "$context_name" ]; then
        print_error "Context name is required"
        echo "Usage: $0 info <context>"
        exit 1
    fi
    
    if ! kubectl config get-contexts "$context_name" &>/dev/null; then
        print_error "Context '$context_name' not found"
        exit 1
    fi
    
    print_header "Context Information: $context_name"
    echo ""
    
    # Get context details
    local cluster=$(kubectl config get-contexts "$context_name" --no-headers | awk '{print $2}')
    local user=$(kubectl config get-contexts "$context_name" --no-headers | awk '{print $3}')
    local namespace=$(kubectl config get-contexts "$context_name" --no-headers | awk '{print $4}')
    
    echo "Context Name: $context_name"
    echo "Cluster:      $cluster"
    echo "User:         $user"
    echo "Namespace:    ${namespace:-default}"
    echo ""
    
    # Cluster details
    print_info "Cluster Details:"
    kubectl config view --minify --flatten | grep -A 5 -B 5 "name: $cluster" | head -20
    
    # User details
    echo ""
    print_info "User Details:"
    kubectl config view --minify --flatten | grep -A 10 -B 5 "name: $user" | head -20
}

# Function to list clusters
list_clusters() {
    print_header "Configured Kubernetes Clusters:"
    echo ""
    
    kubectl config get-clusters | while read -r cluster; do
        if [[ $cluster != NAME ]]; then
            echo "🔹 $cluster"
        fi
    done
}

# Function to list users
list_users() {
    print_header "Configured Kubernetes Users:"
    echo ""
    
    kubectl config get-users | while read -r user; do
        if [[ $user != NAME ]]; then
            echo "👤 $user"
        fi
    done
}

# Function to test cluster connection
test_cluster() {
    local context_name=$1
    
    if [ -z "$context_name" ]; then
        print_error "Context name is required"
        echo "Usage: $0 test <context>"
        exit 1
    fi
    
    print_info "Testing connection to cluster: $context_name"
    
    # Switch to context temporarily
    local original_context=$(kubectl config current-context 2>/dev/null || echo "")
    
    if kubectl config use-context "$context_name" 2>/dev/null; then
        echo "  🔗 Testing API server connection..."
        if kubectl cluster-info &>/dev/null; then
            print_success "API server is accessible"
        else
            print_error "Cannot reach API server"
        fi
        
        echo "  📊 Testing basic resources access..."
        local nodes=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
        if [ "$nodes" -gt 0 ]; then
            print_success "Can access cluster nodes ($nodes nodes)"
        else
            print_error "Cannot access cluster nodes"
        fi
        
        local pods=$(kubectl get pods --all-namespaces --no-headers 2>/dev/null | wc -l)
        if [ "$pods" -ge 0 ]; then
            print_success "Can access pods ($pods pods)"
        else
            print_error "Cannot access pods"
        fi
        
        # Switch back to original context
        if [ -n "$original_context" ]; then
            kubectl config use-context "$original_context" &>/dev/null
        fi
        
    else
        print_error "Cannot switch to context '$context_name'"
    fi
}

# Main script logic
check_kubectl

case "${1:-help}" in
    list)
        list_contexts
        ;;
    current)
        current_context
        ;;
    use)
        use_context "$2"
        ;;
    info)
        info_context "$2"
        ;;
    clusters)
        list_clusters
        ;;
    users)
        list_users
        ;;
    test)
        test_cluster "$2"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        usage
        exit 1
        ;;
esac
