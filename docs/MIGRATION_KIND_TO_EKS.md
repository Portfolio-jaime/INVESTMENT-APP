# Migration: kind → EKS

## Steps
1. Ensure all manifests/Helm charts are EKS-ready
2. Provision EKS with Terraform
3. Install ArgoCD in EKS
4. Point ArgoCD to repo/main
5. Update DNS, TLS, storage as needed

No code changes required—just infra and ArgoCD config.