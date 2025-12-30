# TRII Platform - Testing Guide

Esta guía te ayudará a probar la plataforma TRII desplegada en Kubernetes con ArgoCD.

## Pre-requisitos

1. **Port-forward activo** al API Gateway:
```bash
kubectl port-forward -n trii-dev svc/api-gateway-service 8080:8080
```

2. **Configurar /etc/hosts** (opcional, para testing con ingress):
```bash
sudo nano /etc/hosts
# Agregar:
127.0.0.1 api.trii-platform.local
127.0.0.1 market-data.local
```

---

## Tests Básicos

### 1. Health Check del API Gateway

```bash
curl http://localhost:8080/health
```

**Respuesta esperada:**
```
healthy
```

---

### 2. Health Check del Market Data Service

**Opción A: Via API Gateway**
```bash
curl http://localhost:8080/api/market-data/health
```

**Opción B: Via Ingress (requiere /etc/hosts configurado)**
```bash
curl -H "Host: market-data.local" http://localhost/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "service": "TRII Market Data Service",
  "version": "1.0.0"
}
```

---

## Tests de API - Cotizaciones en Tiempo Real

### 3. Obtener cotización de AAPL (Apple)

```bash
curl -H "Host: market-data.local" "http://localhost/api/v1/market-data/quotes/AAPL"
```

**Via API Gateway:**
```bash
curl -H "Host: api.trii-platform.local" "http://localhost/api/market-data/quotes/AAPL"
```

**Respuesta esperada:**
```json
{
  "symbol": "AAPL",
  "price": 273.76,
  "timestamp": "2025-12-30T02:10:44Z",
  "source": "alphavantage"
}
```

---

### 4. Obtener múltiples cotizaciones

```bash
# Tesla
curl -H "Host: api.trii-platform.local" "http://localhost/api/market-data/quotes/TSLA"

# Microsoft
curl -H "Host: api.trii-platform.local" "http://localhost/api/market-data/quotes/MSFT"

# Google
curl -H "Host: api.trii-platform.local" "http://localhost/api/market-data/quotes/GOOGL"

# Amazon
curl -H "Host: api.trii-platform.local" "http://localhost/api/market-data/quotes/AMZN"
```

---

## Tests de Infraestructura

### 5. Verificar estado de los Pods

```bash
kubectl get pods -n trii-dev
```

**Estado esperado:** Todos los pods en `Running` con `1/1 Ready`

```
NAME                                 READY   STATUS
postgres-0                           1/1     Running
redis-0                              1/1     Running
rabbitmq-0                           1/1     Running
minio-0                              1/1     Running
market-data-xxx                      1/1     Running
analysis-engine-xxx                  1/1     Running
ml-prediction-xxx                    1/1     Running
portfolio-manager-xxx                1/1     Running
api-gateway-xxx (2 replicas)         1/1     Running
```

---

### 6. Verificar estado de ArgoCD Applications

```bash
kubectl get applications -n argocd -l app.kubernetes.io/part-of=trii-platform
```

**Estado esperado:** Todas las aplicaciones `Synced` y `Healthy`

```
NAME                     SYNC STATUS   HEALTH STATUS
trii-infrastructure      Synced        Healthy
trii-market-data         Synced        Healthy
trii-analysis-engine     Synced        Healthy
trii-ml-prediction       Synced        Healthy
trii-portfolio-manager   Synced        Healthy
trii-api-gateway         Synced        Healthy
```

---

### 7. Verificar logs de un servicio

```bash
# Logs del Market Data Service
kubectl logs -n trii-dev -l app=market-data --tail=50

# Logs del API Gateway
kubectl logs -n trii-dev -l app=api-gateway --tail=50

# Logs del Analysis Engine
kubectl logs -n trii-dev -l app=analysis-engine --tail=50
```

---

## Tests Avanzados

### 8. Test de carga con múltiples peticiones

```bash
# Crear script de testing
cat << 'SCRIPT' > /tmp/load_test.sh
#!/bin/bash
SYMBOLS=("AAPL" "TSLA" "GOOGL" "MSFT" "AMZN" "META" "NVDA" "AMD")
for i in {1..5}; do
  for SYMBOL in "${SYMBOLS[@]}"; do
    echo "Fetching $SYMBOL (attempt $i)..."
    curl -s -H "Host: api.trii-platform.local" \
      "http://localhost/api/market-data/quotes/$SYMBOL" | \
      grep -o '"symbol":"[^"]*","price":[0-9.]*' || echo "Failed"
  done
  sleep 1
done
SCRIPT

chmod +x /tmp/load_test.sh
/tmp/load_test.sh
```

---

### 9. Verificar Ingress Controller

```bash
# Ver ingress resources
kubectl get ingress -n trii-dev

# Ver configuración detallada
kubectl describe ingress api-gateway-ingress -n trii-dev

# Logs del ingress controller
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=100
```

---

### 10. Test de conectividad entre servicios (dentro del cluster)

```bash
# Crear un pod temporal para testing
kubectl run test-pod -n trii-dev --rm -i --tty --image=curlimages/curl -- sh

# Dentro del pod, probar:
curl http://market-data-service:8001/health
curl http://analysis-engine-service:8002/health
curl http://portfolio-manager-service:8003/health
curl http://ml-prediction-service:8004/health
curl http://api-gateway-service:8080/health
```

---

## Acceso a ArgoCD UI

### 11. Acceder a la interfaz de ArgoCD

```bash
# Port-forward a ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8443:443

# Abrir en navegador:
# https://localhost:8443
```

**Credenciales:**
- Username: `admin`
- Password: Obtener con:
```bash
kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d && echo
```

En ArgoCD UI podrás ver:
- Estado de sincronización de cada aplicación
- Recursos desplegados (pods, services, ingress)
- Historial de deployments
- Logs y eventos en tiempo real

---

## Troubleshooting

### Pod no inicia

```bash
# Ver detalles del pod
kubectl describe pod <pod-name> -n trii-dev

# Ver logs
kubectl logs <pod-name> -n trii-dev

# Ver eventos recientes
kubectl get events -n trii-dev --sort-by='.lastTimestamp'
```

### Servicio no responde

```bash
# Verificar endpoints
kubectl get endpoints -n trii-dev

# Verificar servicios
kubectl get svc -n trii-dev

# Test directo al pod (bypass service)
kubectl port-forward -n trii-dev <pod-name> 8001:8001
curl http://localhost:8001/health
```

### ArgoCD no sincroniza

```bash
# Forzar sync manual
kubectl patch application trii-market-data -n argocd \
  --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'

# Ver detalles de la aplicación
kubectl describe application trii-market-data -n argocd
```

---

## Scripts de Testing Automatizado

Hemos creado scripts de testing en:

```bash
# Deployment y verificación
./infrastructure/kubernetes/argocd/scripts/deploy-microservices.sh
./infrastructure/kubernetes/argocd/scripts/verify-deployment.sh

# Testing completo
./TESTING_GUIDE.md  # Esta guía
```

---

## Métricas y Monitoreo

### Prometheus (si está habilitado)

```bash
# Port-forward a Prometheus
kubectl port-forward -n monitoring svc/prometheus-server 9090:9090

# Abrir: http://localhost:9090
```

### Grafana (si está habilitado)

```bash
# Port-forward a Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Abrir: http://localhost:3000
```

---

## Comandos Útiles

```bash
# Ver todos los recursos en el namespace
kubectl get all -n trii-dev

# Ver configuración de secrets (sin valores sensibles)
kubectl get secrets -n trii-dev

# Reiniciar un deployment
kubectl rollout restart deployment/market-data -n trii-dev

# Ver historial de rollout
kubectl rollout history deployment/market-data -n trii-dev

# Escalar un deployment
kubectl scale deployment/api-gateway -n trii-dev --replicas=3
```

---

## Testing desde Postman o Navegador

### Colección de endpoints

Si prefieres usar Postman o navegador:

**Base URL (con port-forward):** `http://localhost:8080`

**Endpoints disponibles:**

1. **GET** `/health` - Health del API Gateway
2. **GET** `/api/market-data/health` - Health de Market Data
3. **GET** `/api/market-data/quotes/{symbol}` - Cotización de un símbolo
4. **GET** `/api/analysis/health` - Health de Analysis Engine
5. **GET** `/api/portfolio-manager/health` - Health de Portfolio Manager
6. **GET** `/api/predictions/health` - Health de ML Prediction

**Headers necesarios** (para testing con ingress):
```
Host: api.trii-platform.local
```

---

## Resultados Esperados

✅ **API Gateway:** Respondiendo en puerto 8080
✅ **Market Data:** Cotizaciones en tiempo real de acciones
✅ **10 Pods:** Todos en estado Running
✅ **6 ArgoCD Apps:** Todas Synced & Healthy
✅ **Ingress:** Rutas funcionando correctamente
✅ **Secrets:** API keys configuradas y funcionando

---

**¡Tu plataforma TRII está lista para usar! 🚀**
