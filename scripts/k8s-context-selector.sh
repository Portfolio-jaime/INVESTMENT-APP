#!/bin/bash

# TRII Platform - Kubernetes Context Selector
# Script para seleccionar el contexto de Kubernetes al que conectarse

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
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
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}🚀 TRII Platform - Selector de Contexto K8s${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Verificar si kubectl está instalado
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl no está instalado o no está en el PATH"
    exit 1
fi

print_header

# Obtener lista de contextos disponibles
print_info "Obteniendo contextos disponibles..."
CONTEXTS=$(kubectl config get-contexts --no-headers -o name 2>/dev/null || echo "")

if [ -z "$CONTEXTS" ]; then
    print_error "No se encontraron contextos de Kubernetes configurados"
    print_info "Ejecuta 'kubectl config get-contexts' para verificar"
    exit 1
fi

# Obtener contexto actual
CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "none")

print_info "Contextos disponibles:"
echo ""

# Crear array de contextos
CONTEXT_ARRAY=()
while IFS= read -r context; do
    CONTEXT_ARRAY+=("$context")
done <<< "$CONTEXTS"

# Mostrar lista numerada de contextos
INDEX=1
for context in "${CONTEXT_ARRAY[@]}"; do
    if [ "$context" = "$CURRENT_CONTEXT" ]; then
        echo -e "${GREEN}  $INDEX) $context (ACTUAL)${NC}"
    else
        echo "  $INDEX) $context"
    fi
    ((INDEX++))
done

echo ""
read -p "Selecciona el número del contexto al que deseas conectarte (1-${#CONTEXT_ARRAY[@]}): " selection

# Validar entrada
if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "${#CONTEXT_ARRAY[@]}" ]; then
    print_error "Selección inválida. Debe ser un número entre 1 y ${#CONTEXT_ARRAY[@]}"
    exit 1
fi

# Obtener el contexto seleccionado (ajustar índice ya que arrays empiezan en 0)
SELECTED_CONTEXT="${CONTEXT_ARRAY[$((selection-1))]}"

print_info "Conectando al contexto: $SELECTED_CONTEXT"

# Cambiar al contexto seleccionado
if kubectl config use-context "$SELECTED_CONTEXT" >/dev/null 2>&1; then
    print_success "Contexto cambiado exitosamente a: $SELECTED_CONTEXT"
    echo ""

    # Mostrar información del cluster
    print_info "Información del cluster:"
    kubectl cluster-info --context "$SELECTED_CONTEXT" 2>/dev/null || print_warning "No se pudo obtener información del cluster"

    # Mostrar nodos
    echo ""
    print_info "Nodos del cluster:"
    kubectl get nodes --context "$SELECTED_CONTEXT" 2>/dev/null || print_warning "No se pudieron obtener los nodos"

    # Mostrar namespaces
    echo ""
    print_info "Namespaces disponibles:"
    kubectl get namespaces --context "$SELECTED_CONTEXT" --no-headers -o custom-columns="NAME:.metadata.name" 2>/dev/null | head -10
    NAMESPACE_COUNT=$(kubectl get namespaces --context "$SELECTED_CONTEXT" --no-headers 2>/dev/null | wc -l)
    if [ "$NAMESPACE_COUNT" -gt 10 ]; then
        echo "... y $((NAMESPACE_COUNT-10)) más"
    fi

    echo ""
    print_success "¡Listo para trabajar con Kubernetes!"
    print_info "Usa 'kubectl get pods' para ver los pods en el namespace default"
    print_info "Usa 'kubectl get pods -A' para ver todos los pods"

else
    print_error "Error al cambiar al contexto: $SELECTED_CONTEXT"
    print_info "Verifica que el contexto esté correctamente configurado"
    exit 1
fi
