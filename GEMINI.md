# Project Overview

This is a scalable, cloud-native investment platform that uses a monorepo structure. It is designed for both local development and production environments, with a strong emphasis on GitOps and CI/CD.

**Key Technologies:**

*   **Languages & Frameworks:** `Node.js` (Fastify), `TypeScript` (Next.js)
*   **Database:** `MongoDB`
*   **Local Development:** `kind` (Kubernetes), `ArgoCD` (GitOps), `Helm` (Package Manager), `GitHub Actions` (CI/CD Automation)
*   **Production:** `AWS EKS` (Kubernetes), `Terraform` (IaC), `ArgoCD` (GitOps), `Helm` (Package Manager), `GitHub Actions` (CI/CD Automation)
*   **GitOps:** `ArgoCD` is used to watch the `main` branch and automatically synchronize all changes to the Kubernetes cluster.
*   **CI/CD:** `GitHub Actions` are used to build, tag, and push Docker images to Docker Hub, update Helm chart manifests, and trigger `ArgoCD` synchronization.

**Architecture:**

*   **Frontend:** The Next.js frontend application is located in `apps/next-frontend/`.
*   **Backend:** The Fastify backend microservice is located in `backend/fastify-backend/`.
*   **Database:** `MongoDB` is deployed via Helm chart.
*   **Infrastructure:** The infrastructure is defined as code using `Terraform` and is located in the `infra/` directory.
*   **Kubernetes Configuration:** `Helm` charts for all applications (frontend, backend, mongodb) and values are located in the `helm/` directory. `ArgoCD` manifests and configuration are located in the `argocd/` directory, including application definitions and patches for ArgoCD's own configuration.

# Building and Running

**Local Development:**

The local development environment is managed using `make`.

*   To start the local development environment, run: `make local-up`
    *   This will create a `kind` cluster, install `ArgoCD`, and bootstrap the applications.
*   To access the `ArgoCD` UI, navigate to: `http://localhost:8080`

**Production:**

The production environment is deployed on `AWS EKS`. The deployment process is automated using `Terraform` and `GitHub Actions`.

# Development Conventions

*   **GitOps:** All deployments are managed through GitOps. Manual `kubectl` changes are discouraged.
*   **CI/CD:** The CI/CD pipeline is defined in `.github/workflows/ci-build-push.yml`.
*   **Docker Images:** Docker images are stored on Docker Hub at `jaimehenao8126`.
*   **Manifest Updates:** Manifest updates are automatically committed to the repository with the `[skip ci]` message.
*   **Migration:** The migration process from `kind` to `EKS` is documented in `docs/MIGRATION_KIND_TO_EKS.md`.
