.PHONY: help local-up local-setup argocd-password local-down local-access-argocd local-access-frontend local-access-backend

help:
	@echo "Usage:"
	@echo "  make help                    - Muestra esta ayuda."
	@echo "  make local-up                  - Inicia el entorno de desarrollo local (cluster Kind, Ingress, ArgoCD, Apps)."
	@echo "  make local-setup               - Crea el cluster Kind, instala NGINX Ingress y ArgoCD, y aplica las configuraciones."
	@echo "  make argocd-password         - Muestra la contraseña inicial del usuario 'admin' de ArgoCD."
	@echo "  make local-access-argocd     - Abre la UI de ArgoCD en el navegador."
	@echo "  make local-access-frontend   - Abre la aplicación frontend en el navegador."
	@echo "  make local-access-backend    - Abre la API backend en el navegador."
	@echo "  make local-down              - Elimina el cluster Kind."

local-up: local-setup
	@echo "\n--- Entorno local iniciado. Esperando a que las aplicaciones estén listas en ArgoCD..."
	@sleep 60 # Give ArgoCD some time to sync
	@echo "\n--- Para acceder a ArgoCD, visita: http://argocd.local"
	@echo "--- Para acceder al Frontend, visita: http://frontend.local"
	@echo "--- Para acceder al Backend, visita: http://api.local"
	@echo "\nRecuerda la contraseña de ArgoCD con 'make argocd-password' si la necesitas."

local-access-argocd:
	@echo "Abriendo ArgoCD UI en http://argocd.local..."
	@open http://argocd.local

local-access-frontend:
	@echo "Abriendo Frontend en http://frontend.local..."
	@open http://frontend.local

local-access-backend:
	@echo "Abriendo Backend API en http://api.local..."
	@open http://api.local

local-setup:
	@echo "--- Creando cluster Kind con kind-config.yaml..."
	@kind create cluster --name investment-app --config=kind-config.yaml

	@echo "--- Instalando NGINX Ingress Controller..."
	@kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
	@echo "--- Esperando a que el Ingress Controller esté listo (usando un bucle de reintrito)..."
	@i=0; \
	while [ $$i -lt 30 ]; do \
	  if kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' | grep -q "True"; then \
	    echo "Ingress Controller está listo."; \
	    break; \
	  fi; \
	  echo "Esperando al Ingress Controller... ($$i/30)"; \
	  sleep 10; \
	  i=$$((i+1)); \
	done; \
	if [ $$i -eq 30 ]; then \
	  echo "Error: El Ingress Controller no estuvo listo a tiempo."; \
	  exit 1; \
	fi

	@echo "\n--- Instalando ArgoCD..."
	@kubectl create namespace argocd || true
	@kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
	@echo "--- Esperando a que los componentes de ArgoCD estén listos..."
	@kubectl wait --namespace argocd \
	  --for=condition=ready pod --all \
	  --timeout=120s

	@echo "\n--- Aplicando la aplicación root de ArgoCD para bootstrap de las demás aplicaciones..."
	@kubectl apply -n argocd -f argocd/bootstrap/root-app.yaml

	@echo "\n--- Aplicando configuraciones personalizadas de ArgoCD (Ingress y Auth)..."
	@kubectl apply -f argocd/argocd-ingress.yaml
	@kubectl apply -f argocd/patches/argocd-cm-github-oauth-patch.yaml
	@kubectl apply -f argocd/patches/argocd-rbac-cm-patch.yaml

	@echo "\n✅ ¡Configuración completa!"
	@echo "Recuerda añadir las siguientes entradas a tu archivo /etc/hosts:"
	@echo "  127.0.0.1 argocd.local trii-frontend.local trii-api.local"
	@echo "Ejecuta 'make argocd-password' para obtener la contraseña del admin inicial."

argocd-password:
	@echo "Contraseña inicial de ArgoCD (usuario 'admin'):"
	@kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo

local-down:
	@kind delete cluster --name investment-app
