# TRII Platform – Architecture

## Stack
- Frontend: React SPA (Vite/Next.js)
- Backend: FastAPI (Python), Express (Node.js)
- Local K8s: kind
- Production K8s: AWS EKS
- GitOps: ArgoCD
- CI/CD: GitHub Actions
- IaC: Terraform (EKS/cloud only)
- Helm: All apps

## Principles
- GitHub = single source of truth
- No manual kubectl
- All config as code
- Developer experience first

## See `docs/DEPLOYMENT.md` for setup.