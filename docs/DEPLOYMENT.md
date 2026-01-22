# TRII Platform – Deployment Guide

## Local
- `make local-up` to create kind cluster, install ArgoCD, bootstrap apps
- Access ArgoCD UI at http://localhost:8080
- All deployments via GitOps

## Cloud (EKS)
- Provision EKS with Terraform (`infra/terraform/environments/dev`)
- Install ArgoCD in EKS
- Point ArgoCD to this repo/main
- All deployments via GitOps

See `docs/MIGRATION_KIND_TO_EKS.md` for migration.