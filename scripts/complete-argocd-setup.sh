#!/bin/bash

# Script completo para configurar ArgoCD desde cero con acceso web
set -e

echo "🚀 Configuración completa de ArgoCD"

# Función para verificar comandos
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ Error: $1 no está instalado"
        exit 1
    fi
    echo "✅ $1 disponible"
}

# Verificar prerequisitos
echo "=== Verificando prerequisitos ==="
check_command kubectl
check_command kind
check_command docker

# 1. Recrear cluster Kind
echo "=== 1. Recreando cluster Kind ==="
echo "Eliminando cluster existente..."
kind delete cluster --name trii-dev 2>/dev/null || echo "No había cluster previo"

echo "Creando nuevo cluster..."
cat << EOF > /tmp/kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: trii-dev
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  - containerPort: 30080
    hostPort: 30080
    protocol: TCP
EOF

kind create cluster --config /tmp/kind-config.yaml
rm /tmp/kind-config.yaml

# Esperar que el cluster esté listo
echo "Esperando que el cluster esté listo..."
kubectl wait --for=condition=ready node --all --timeout=300s

# 2. Instalar Ingress Controller
echo "=== 2. Instalando Ingress Controller ==="
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Esperar que el ingress controller esté listo
echo "Esperando que el ingress controller esté listo..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

# 3. Instalar ArgoCD
echo "=== 3. Instalando ArgoCD ==="
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Esperar que ArgoCD esté listo
echo "Esperando que ArgoCD esté listo..."
kubectl wait --for=condition=available --timeout=600s deployment/argocd-server -n argocd

# 4. Configurar ingress para ArgoCD
echo "=== 4. Configurando ingress para ArgoCD ==="
cat << EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "false"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
spec:
  ingressClassName: nginx
  rules:
  - host: argocd.trii-platform.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 80
---
apiVersion: v1
kind: Service
metadata:
  name: argocd-server-nodeport
  namespace: argocd
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080
    protocol: TCP
    name: http
  selector:
    app.kubernetes.io/name: argocd-server
EOF

# 5. Configurar ArgoCD para HTTP (sin TLS)
echo "=== 5. Configurando ArgoCD para HTTP ==="
kubectl patch configmap argocd-cmd-params-cm -n argocd -p '{"data":{"server.insecure":"true"}}'
kubectl rollout restart deployment/argocd-server -n argocd

# Esperar a que se reinicie
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# 6. Obtener información de acceso
echo "=== 6. Información de acceso ==="
CLUSTER_IP=$(docker inspect trii-dev-control-plane | grep '"IPAddress":' | tail -1 | cut -d'"' -f4)
ADMIN_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo ""
echo "=========================================="
echo "  ✅ ARGOCD CONFIGURADO CORRECTAMENTE"
echo "=========================================="
echo ""
echo "🌐 Acceso web:"
echo "   URL: http://argocd.trii-platform.com/"
echo "   Alternativa: http://$CLUSTER_IP:30080/"
echo ""
echo "🔐 Credenciales:"
echo "   Usuario: admin"
echo "   Contraseña: $ADMIN_PASSWORD"
echo ""
echo "📝 Para acceso desde tu PC, agrega a /etc/hosts:"
echo "   $CLUSTER_IP argocd.trii-platform.com"
echo ""
echo "💾 Comando para /etc/hosts:"
echo "   echo '$CLUSTER_IP argocd.trii-platform.com' | sudo tee -a /etc/hosts"
echo ""
echo "🔧 Verificación:"
echo "   kubectl get pods -n argocd"
echo "   kubectl get ingress -n argocd"
echo ""
echo "🎉 ¡Configuración completada!"
