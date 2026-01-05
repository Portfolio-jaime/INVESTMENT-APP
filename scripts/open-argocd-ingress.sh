#!/bin/bash

# Script para abrir ArgoCD via Ingress
# Solución para acceder a ArgoCD a través del ingress controller

echo "🚀 Abriendo ArgoCD via Ingress..."

# Verificar si el port-forward está activo
PF_RUNNING=$(ps aux | grep "kubectl port-forward.*ingress-nginx.*8888:80" | grep -v grep | wc -l)

if [ $PF_RUNNING -eq 0 ]; then
    echo "⚠️  Port-forward no está activo. Iniciando..."
    echo "📝 Ejecutando: kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8888:80"
    kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8888:80 &
    sleep 3
    echo "✅ Port-forward iniciado en puerto 8888"
else
    echo "✅ Port-forward ya está activo"
fi

# Verificar conectividad
echo "🔍 Verificando conectividad..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888 -H "Host: argocd.trii-platform.com")

if [ $RESPONSE -eq 200 ]; then
    echo "✅ ArgoCD responde correctamente (HTTP $RESPONSE)"
    echo "🌐 Abriendo ArgoCD en el navegador..."
    
    # Crear archivo HTML temporal para redirección con hostname correcto
    cat > /tmp/argocd_redirect.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>ArgoCD - Redirigiendo...</title>
    <meta http-equiv="refresh" content="0; url=http://argocd.trii-platform.com:8888/">
    <script>
        // Fallback en caso de que meta refresh no funcione
        window.location.replace("http://argocd.trii-platform.com:8888/");
    </script>
</head>
<body>
    <h1>Redirigiendo a ArgoCD...</h1>
    <p>Si no eres redirigido automáticamente, <a href="http://argocd.trii-platform.com:8888/">haz click aquí</a></p>
    <p>Credenciales:</p>
    <ul>
        <li><strong>Usuario:</strong> admin</li>
        <li><strong>Contraseña:</strong> LIsUOESBjKh2P5Ro</li>
    </ul>
</body>
</html>
EOF
    
    # Abrir en navegador
    open /tmp/argocd_redirect.html
    
    echo "📋 Credenciales de acceso:"
    echo "   Usuario: admin"
    echo "   Contraseña: LIsUOESBjKh2P5Ro"
    echo "   URL: http://argocd.trii-platform.com:8888/"
    
else
    echo "❌ Error: ArgoCD no responde (HTTP $RESPONSE)"
    echo "🔧 Verifica que el cluster Kind esté ejecutándose:"
    echo "   kubectl get pods -n argocd"
    echo "   kubectl get pods -n ingress-nginx"
fi

echo ""
echo "📖 Para más información, ver: ARGOCD_ACCESS.md"
