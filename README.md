# TRII Platform – Production-Grade Kubernetes Monorepo

## Overview
A scalable, cloud-native investment platform with:
- Local dev: kind + ArgoCD + Helm + GitHub Actions
- Production: AWS EKS + Terraform + ArgoCD + Helm + GitHub Actions
- GitOps: ArgoCD watches main, auto-syncs all changes
- CI/CD: GitHub Actions builds, tags, pushes images, updates manifests, triggers ArgoCD

## Quick Start
1. `make local-up` – kind cluster, ArgoCD, bootstrap apps
2. Access ArgoCD UI: http://localhost:8080
3. All deployments via GitOps (no manual kubectl)

## Structure
- `apps/` – Frontend apps
- `services/` – Backend microservices
- `helm/` – Helm charts and values
- `infra/` – Terraform for EKS/cloud
- `argocd/` – ArgoCD Applications (GitOps)
- `scripts/` – Makefile and automation
- `docs/` – Architecture, deployment, migration

## CI/CD
- See `.github/workflows/ci-build-push.yml`
- Images: Docker Hub (`jaimehenao8126`)
- Manifest update: auto-commit with [skip ci]

## Migration
- See `docs/MIGRATION_KIND_TO_EKS.md`

---

For full details, see `docs/ARCHITECTURE.md` and `docs/DEPLOYMENT.md`.
