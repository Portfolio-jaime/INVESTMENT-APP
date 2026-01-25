.PHONY: help local-up local-down argocd-install bootstrap logs clean

CLUSTER_NAME := trii-platform-local
KUBECONFIG := $(HOME)/.kube/config

help:
	@echo "TRII Platform - Local Development"
	@echo "Commands:"
	@echo "  make local-up          Create kind cluster + Install ArgoCD + Bootstrap apps"
	@echo "  make local-down        Destroy kind cluster"
	@echo "  make argocd-install    Install ArgoCD only"
	@echo "  make bootstrap         Bootstrap ArgoCD applications"
	@echo "  make logs              View ArgoCD logs"
	@echo "  make clean             Clean all resources"

local-up:
	./scripts/kind-setup.sh
	./scripts/argocd-install.sh
	./scripts/bootstrap-apps.sh

local-down:
	kind delete cluster --name $(CLUSTER_NAME)

argocd-install:
	./scripts/argocd-install.sh

bootstrap:
	./scripts/bootstrap-apps.sh

logs:
	kubectl -n argocd logs -f deployment/argocd-application-controller

clean:
	kind delete cluster --name $(CLUSTER_NAME)
	docker system prune -af