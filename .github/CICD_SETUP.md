# CI/CD Setup Guide

This guide explains how to set up the automated CI/CD pipeline for the TRII Investment Platform.

## 🎯 Overview

The CI/CD pipeline automatically:
- ✅ Detects which services have changed
- ✅ Runs tests and code quality checks
- ✅ Builds and pushes Docker images to DockerHub
- ✅ Updates Kubernetes manifests with new image tags
- ✅ Triggers ArgoCD to deploy updates

## 📋 Prerequisites

1. **GitHub Repository** with push access
2. **DockerHub Account** for container registry
3. **Kubernetes Cluster** with ArgoCD installed

## 🔧 Setup Steps

### Step 1: Configure GitHub Secrets

Navigate to your repository: **Settings → Secrets and variables → Actions**

Add the following secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DOCKERHUB_USERNAME` | Your DockerHub username | `jaimehenao8126` |
| `DOCKERHUB_TOKEN` | DockerHub access token | `dckr_pat_xxx...` |

**Note**: If you have organization-level secrets configured, the workflows will automatically use them.

**How to create DockerHub Access Token:**
1. Go to [DockerHub Settings](https://hub.docker.com/settings/security)
2. Click "New Access Token"
3. Name it "github-actions-trii"
4. Select permissions: Read, Write
5. Copy the token and save it as `DOCKER_PASSWORD`

### Step 2: Verify Workflow Files

Ensure these workflow files exist in `.github/workflows/`:

```
.github/workflows/
├── ci-cd-pipeline.yml      # Main CI/CD workflow
└── pr-validation.yml       # PR validation workflow
```

### Step 3: Update Docker Registry (if needed)

If you want to use a different DockerHub username, update:

1. **Kustomize overlays:**
   - `infrastructure/kubernetes/overlays/dev/kustomization.yaml`
   - `infrastructure/kubernetes/overlays/staging/kustomization.yaml`
   - `infrastructure/kubernetes/overlays/prod/kustomization.yaml`

   Change all image names from:
   ```yaml
   - name: jaimehenao8126/trii-market-data
   ```
   To:
   ```yaml
   - name: YOUR_USERNAME/trii-market-data
   ```

2. **Deployment manifests:**
   Update image references in:
   - `infrastructure/kubernetes/base/market-data/deployment.yaml`
   - `infrastructure/kubernetes/base/analysis-engine/deployment.yaml`
   - `infrastructure/kubernetes/base/portfolio-manager/deployment.yaml`
   - `infrastructure/kubernetes/base/ml-prediction/deployment.yaml`

## 🚀 How It Works

### On Pull Request

When you create a PR to `main` or `develop`:

1. **Detect Changes**: Identifies which services were modified
2. **Run Tests**: Executes unit tests for changed services
3. **Code Quality**: Runs linting, type checking, formatting checks
4. **Build Validation**: Tests Docker build without pushing
5. **K8s Validation**: Validates Kustomize overlays

**Example PR Workflow:**
```bash
git checkout -b feature/improve-market-data
# Make changes to services/market-data/
git add .
git commit -m "feat: improve market data caching"
git push origin feature/improve-market-data
# Create PR → GitHub Actions runs validation
```

### On Push to Main/Develop

When code is merged or pushed to `main`/`develop`:

1. **Detect Changes**: Identifies modified services
2. **Run Tests**: Full test suite for changed services
3. **Build Images**: Builds Docker images
4. **Push to Registry**: Pushes to DockerHub with tags:
   - `latest` (always)
   - `<commit-sha>` (specific version)
5. **Update Manifests**: Updates image tags in Kustomize overlays
6. **Commit Changes**: Commits updated manifests back to repo
7. **ArgoCD Sync**: ArgoCD detects changes and deploys

**Image Tagging Strategy:**
```
jaimehenao8126/trii-market-data:latest           # Always latest
jaimehenao8126/trii-market-data:5c38fe1644...    # Git commit SHA
```

## 📊 Monitoring Deployments

### View GitHub Actions

1. Go to **Actions** tab in GitHub
2. Click on latest workflow run
3. View logs for each job

### View ArgoCD Status

```bash
# Setup ArgoCD access
./scripts/setup-argocd-access.sh

# Port-forward to ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8443:443

# Open browser
open https://localhost:8443

# Login credentials
# Username: admin
# Password: (from script output)
```

### Check Deployed Images

```bash
# View current image tags in dev
kubectl get deployment -n trii-dev market-data -o jsonpath='{.spec.template.spec.containers[0].image}'

# View all deployments
kubectl get deployments -n trii-dev -o custom-columns="NAME:.metadata.name,IMAGE:.spec.template.spec.containers[0].image"
```

## 🔄 Workflow Triggers

### What Triggers CI/CD?

- ✅ Push to `main` or `develop` branches
- ✅ Changes in `services/**` directories
- ✅ Changes in `apps/**` directories
- ✅ Changes in `infrastructure/kubernetes/**`
- ✅ Changes in `.github/workflows/**`

### What Doesn't Trigger?

- ❌ Changes only to documentation (*.md files outside services)
- ❌ Changes only to scripts/
- ❌ Push to feature branches (only validation runs)

## 🛠️ Customization

### Change Deployment Environment

To deploy to different environments, update ArgoCD applications:

```bash
# Development (default)
kubectl apply -f infrastructure/kubernetes/argocd/applications/microservices/

# Staging
# Update targetRevision to 'develop' branch in ArgoCD apps

# Production
# Update targetRevision to specific release tag
```

### Add New Service

1. Create service directory: `services/new-service/`
2. Add Dockerfile
3. Update `.github/workflows/ci-cd-pipeline.yml`:
   - Add to `detect-changes` filters
   - Add build job
4. Create Kubernetes manifests in `infrastructure/kubernetes/base/new-service/`
5. Update Kustomize overlays to include new image

### Customize Build Process

Edit individual service build jobs in `ci-cd-pipeline.yml`:

```yaml
build-market-data:
  # Add custom build steps here
  - name: Custom build step
    run: |
      # Your custom commands
```

## 🐛 Troubleshooting

### Build Fails

**Check logs:**
```bash
# In GitHub Actions UI, click on failed job
# View detailed logs for the failing step
```

**Common issues:**
- Missing dependencies in `requirements.txt` or `package.json`
- Test failures
- Docker build context issues

### Image Not Updating in Kubernetes

**Check ArgoCD sync status:**
```bash
kubectl get applications -n argocd
```

**Manually trigger sync:**
```bash
# Via ArgoCD CLI
argocd app sync trii-market-data

# Via kubectl
kubectl patch application trii-market-data -n argocd \
  --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

### Wrong Image Tag Deployed

**Verify Kustomize overlay:**
```bash
# Check what will be deployed
cd infrastructure/kubernetes/overlays/dev
kustomize build . | grep -A 5 "image:"
```

## 📈 Best Practices

### Commit Messages

Use conventional commits for better changelog generation:

```bash
feat: add new market data provider
fix: resolve database connection timeout
chore: update dependencies
docs: improve API documentation
test: add integration tests for portfolio service
```

### Testing Before Push

```bash
# Run tests locally before pushing
cd services/market-data
pytest tests/ -v

# Test Docker build
docker build -t test-image:local .

# Validate Kubernetes manifests
cd infrastructure/kubernetes/overlays/dev
kustomize build .
```

### Rollback Strategy

If deployment fails:

```bash
# Option 1: Revert git commit
git revert HEAD
git push

# Option 2: Manually rollback in ArgoCD UI
# Go to Application → History → Rollback to previous version

# Option 3: Update image tag manually
cd infrastructure/kubernetes/overlays/dev
# Edit kustomization.yaml to previous working tag
git commit -m "fix: rollback to previous version"
git push
```

## 🔐 Security Notes

- ✅ Secrets are encrypted in GitHub
- ✅ DockerHub tokens can be revoked anytime
- ✅ Use separate tokens for staging/prod if needed
- ✅ Never commit secrets to git
- ✅ Rotate tokens periodically

## 📚 Additional Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [DockerHub Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kustomize Documentation](https://kustomize.io/)

## ✅ Verification Checklist

Before going live with CI/CD:

- [ ] GitHub Secrets configured (`DOCKER_USERNAME`, `DOCKER_PASSWORD`)
- [ ] DockerHub repository exists for each service
- [ ] Kustomize overlays have correct image names
- [ ] ArgoCD applications are configured
- [ ] Test PR validation workflow
- [ ] Test full CI/CD workflow with small change
- [ ] Verify ArgoCD auto-sync is working
- [ ] Check monitoring/alerting is configured

## 🎉 You're Ready!

Your CI/CD pipeline is now configured. Every push to `main` will automatically:
1. Build and test your services
2. Push new images to DockerHub
3. Update Kubernetes manifests
4. Deploy via ArgoCD

**Happy deploying! 🚀**
