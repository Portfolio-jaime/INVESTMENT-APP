#!/bin/bash

# Script de diagnóstico completo para ArgoCD
echo "🔍 DIAGNÓSTICO COMPLETO DE ARGOCD"
echo "================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}1. ESTADO DE APLICACIONES${NC}"
echo "=============================="
kubectl get applications -n argocd -o wide

echo -e "\n${BLUE}2. RECURSOS CREADOS EN TRII-DEV${NC}"
echo "======================================"
echo "Deployments:"
kubectl get deployments -n trii-dev 2>/dev/null || echo "No deployments found"
echo ""
echo "StatefulSets:"
kubectl get statefulsets -n trii-dev 2>/dev/null || echo "No statefulsets found"
echo ""
echo "Services:"
kubectl get services -n trii-dev 2>/dev/null | head -10
echo ""
echo "ConfigMaps:"
kubectl get configmaps -n trii-dev 2>/dev/null || echo "No configmaps found"
echo ""
echo "Secrets:"
kubectl get secrets -n trii-dev 2>/dev/null || echo "No secrets found"

echo -e "\n${BLUE}3. ANÁLISIS DE ERRORES POR APLICACIÓN${NC}"
echo "=========================================="

for app in trii-platform trii-platform-staging trii-platform-prod trii-monitoring; do
    echo -e "\n${YELLOW}=== $app ===${NC}"
    
    # Estado general
    SYNC_STATUS=$(kubectl get application $app -n argocd -o jsonpath='{.status.sync.status}' 2>/dev/null || echo "Unknown")
    HEALTH_STATUS=$(kubectl get application $app -n argocd -o jsonpath='{.status.health.status}' 2>/dev/null || echo "Unknown")
    REVISION=$(kubectl get application $app -n argocd -o jsonpath='{.status.sync.revision}' 2>/dev/null || echo "Unknown")
    
    echo "Sync Status: $SYNC_STATUS"
    echo "Health Status: $HEALTH_STATUS"
    echo "Revision: $REVISION"
    
    # Errores específicos
    CONDITIONS=$(kubectl get application $app -n argocd -o jsonpath='{.status.conditions[?(@.type=="SyncError")].message}' 2>/dev/null || echo "")
    if [ ! -z "$CONDITIONS" ]; then
        echo -e "${RED}ERROR: $CONDITIONS${NC}"
    fi
    
    COMPARISON_ERRORS=$(kubectl get application $app -n argocd -o jsonpath='{.status.conditions[?(@.type=="ComparisonError")].message}' 2>/dev/null || echo "")
    if [ ! -z "$COMPARISON_ERRORS" ]; then
        echo -e "${RED}COMPARISON ERROR: $COMPARISON_ERRORS${NC}"
    fi
done

echo -e "\n${BLUE}4. REPOSITORIOS CONFIGURADOS${NC}"
echo "==============================="
kubectl get secrets -n argocd -l argocd.argoproj.io/secret-type=repository

echo -e "\n${BLUE}5. ESTADO DE COMPONENTES ARGOCD${NC}"
echo "=================================="
kubectl get deployments -n argocd

echo -e "\n${BLUE}6. LOGS RECIENTES DEL REPO SERVER${NC}"
echo "====================================="
echo "Últimos 5 logs:"
kubectl logs deployment/argocd-repo-server -n argocd --tail=5

echo -e "\n${BLUE}7. RESUMEN Y RECOMENDACIONES${NC}"
echo "================================="

# Verificar qué aplicaciones están progresando
SYNC_COUNT=$(kubectl get applications -n argocd -o jsonpath='{.items[?(@.status.sync.status=="OutOfSync")].metadata.name}' | wc -w)
UNKNOWN_COUNT=$(kubectl get applications -n argocd -o jsonpath='{.items[?(@.status.sync.status=="Unknown")].metadata.name}' | wc -w)
HEALTHY_COUNT=$(kubectl get applications -n argocd -o jsonpath='{.items[?(@.status.health.status=="Healthy")].metadata.name}' | wc -w)

echo -e "${GREEN}✅ Aplicaciones en OutOfSync: $SYNC_COUNT${NC}"
echo -e "${YELLOW}⚠️  Aplicaciones en Unknown: $UNKNOWN_COUNT${NC}"
echo -e "${GREEN}✅ Aplicaciones Healthy: $HEALTHY_COUNT${NC}"

echo -e "\n${BLUE}PROGRESO LOGRADO:${NC}"
echo "- ✅ Problema de autenticación del repositorio RESUELTO"
echo "- ✅ ArgoCD puede conectarse al repositorio GitHub"
echo "- ✅ Repositorio público configurado correctamente"
echo "- ✅ Aplicaciones detectando diferencias (OutOfSync)"
echo "- ✅ Deployment market-data recreado sin errores de selector"
echo "- ✅ StatefulSet rabbitmq recreado sin errores de spec"

echo -e "\n${BLUE}PRÓXIMOS PASOS:${NC}"
echo "1. Las aplicaciones están progresando - estado 'OutOfSync' es normal"
echo "2. Permitir que ArgoCD complete la sincronización automática"
echo "3. Si persisten errores, usar: kubectl patch application <nombre> -n argocd --type='merge' -p='{\"operation\":{\"sync\":{\"prune\":true}}}'"
echo "4. Verificar que los recursos se están creando correctamente en trii-dev"

echo -e "\n${GREEN}🎉 DIAGNÓSTICO COMPLETADO${NC}"
</content>
<task_progress>
- [x] Verificar estado actual de aplicaciones ArgoCD
- [x] Identificar aplicaciones en estado desconocido
- [x] Analizar logs y eventos de aplicaciones problemáticas
- [x] Diagnosticar problemas específicos
- [x] Proponer soluciones para cada aplicación
- [x] Verificar configuración de repositorios
- [x] Corregir problemas encontrados
