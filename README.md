# TRII Platform – Production-Grade Kubernetes Monorepo

## Overview
A scalable, cloud-native investment platform with:
- Local dev: kind + ArgoCD + Helm + GitHub Actions
- Production: AWS EKS + Terraform + ArgoCD + Helm + GitHub Actions
- GitOps: ArgoCD watches main, auto-syncs all changes
- CI/CD: GitHub Actions builds, tags, pushes images, updates manifests, triggers ArgoCD

## Quick Start

To set up your local development environment:

1.  **Ensure /etc/hosts entries:** Add the following to your `/etc/hosts` file (or equivalent on your OS):
    ```
    127.0.0.1 argocd.local frontend.local api.local
    ```
2.  **Start Local Environment:**
    ```bash
    make local-up
    ```
    This command will:
    *   Create a `kind` Kubernetes cluster named `investment-app`.
    *   Install the NGINX Ingress Controller.
    *   Install ArgoCD.
    *   Bootstrap the ArgoCD `root-app` which will then deploy MongoDB, the Frontend, and the Backend applications.
    *   Apply custom ArgoCD configurations for Ingress and GitHub OAuth.

3.  **Access Applications:**
    *   **ArgoCD UI:** Open `http://argocd.local` in your browser.
    *   **Frontend App:** Open `http://frontend.local` in your browser.
    *   **Backend API:** Open `http://api.local` in your browser.

4.  **Get ArgoCD Initial Password:**
    ```bash
    make argocd-password
    ```

## Structure

This monorepo is organized as follows:

*   `apps/next-frontend/`: The Next.js frontend application.
*   `backend/fastify-backend/`: The Fastify backend application.
*   `helm/`: Contains Helm charts for deploying our applications:
    *   `helm/backend/`: Helm chart for the Fastify backend.
    *   `helm/frontend/`: Helm chart for the Next.js frontend.
    *   `helm/database/mongodb/`: Helm chart for MongoDB (using Bitnami subchart).
*   `argocd/`: ArgoCD manifests and configurations:
    *   `argocd/applications/`: ArgoCD `Application` definitions for our services.
    *   `argocd/bootstrap/`: Root ArgoCD application to bootstrap other applications.
    *   `argocd/patches/`: Patches for ArgoCD core components (e.g., GitHub OAuth config).
    *   `argocd/argocd-ingress.yaml`: Ingress definition for ArgoCD UI.
*   `.github/workflows/`: GitHub Actions workflows for CI/CD.
*   `scripts/`: Automation scripts and Makefile targets.
*   `docs/`: Project documentation.
*   `infra/`: Infrastructure as Code (e.g., Terraform for production AWS EKS).

## Authentication (ArgoCD GitHub OAuth)

To enable GitHub OAuth for ArgoCD, you need to create a GitHub OAuth App:

1.  Go to your GitHub profile settings -> "Developer settings" -> "OAuth Apps".
2.  Click "New OAuth App".
3.  Fill in:
    *   **Application name:** `ArgoCD-Investment-App`
    *   **Homepage URL:** `http://argocd.local`
    *   **Authorization callback URL:** `http://argocd.local/api/callback`
4.  Register the application and get your **Client ID** and **Client Secret**.
5.  Update `argocd/patches/argocd-cm-github-oauth-patch.yaml` with your Client ID and Client Secret. Then run `make local-up` again (or `kubectl apply -f argocd/patches/argocd-cm-github-oauth-patch.yaml -n argocd`).

## CI/CD (GitHub Actions & DockerHub)

Our CI/CD pipeline uses GitHub Actions to build and push Docker images to Docker Hub, and then automatically updates the Helm chart values to trigger ArgoCD synchronization.

1.  **DockerHub Credentials:** You need to configure the following secrets in your GitHub repository:
    *   `DOCKER_USERNAME`: Your Docker Hub username (`jaimehenao8126`).
    *   `DOCKER_PASSWORD`: Your Docker Hub access token or password.
    *   Go to `Your GitHub Repo` -> `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`.
2.  **Workflow:** The `.github/workflows/ci-build-push.yml` workflow triggers on pushes to the `main` branch. It builds Docker images for the frontend and backend, pushes them to Docker Hub with `sha` and `latest` tags, and then commits an update to the respective Helm `values.yaml` files. The `[skip ci]` tag in the commit message prevents an infinite loop.

## CI/CD
- See `.github/workflows/ci-build-push.yml`
- Images: Docker Hub (`jaimehenao8126`)
- Manifest update: auto-commit with [skip ci]

## Migration
- See `docs/MIGRATION_KIND_TO_EKS.md`

---

For full details, see `docs/ARCHITECTURE.md` and `docs/DEPLOYMENT.md`.
