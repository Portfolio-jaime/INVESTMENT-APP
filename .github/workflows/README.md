# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the TRII Investment Platform.

## 📁 Workflows

### `ci-cd-pipeline.yml`
**Triggers:** Push to `main` or `develop`

Automated deployment pipeline that:
- Detects changed services
- Runs tests and builds Docker images
- Pushes to DockerHub
- Updates Kubernetes manifests
- Triggers ArgoCD deployment

**Services monitored:**
- `market-data` (FastAPI/Python)
- `analysis-engine` (FastAPI/Python)
- `portfolio-manager` (NestJS/Node.js)
- `ml-prediction` (FastAPI/Python)

### `pr-validation.yml`
**Triggers:** Pull requests to `main` or `develop`

Validation workflow that:
- Runs unit tests
- Checks code quality (linting, type checking)
- Validates Docker builds
- Validates Kubernetes manifests

## 🚀 Quick Start

1. **Setup secrets** (required for first run):
   ```bash
   # Go to: Settings → Secrets → Actions
   # Add: DOCKER_USERNAME, DOCKER_PASSWORD
   ```

2. **Make changes and push:**
   ```bash
   git checkout -b feature/my-feature
   # Make changes to services/market-data/
   git commit -m "feat: improve caching"
   git push
   ```

3. **Create PR** → Validation runs automatically

4. **Merge to main** → Full CI/CD runs → Auto-deploys to K8s

## 📊 Workflow Status

View workflow runs: [Actions Tab](../../actions)

## 📖 Full Documentation

See [CICD_SETUP.md](../CICD_SETUP.md) for complete setup guide.

## 🔍 Service Detection

Changes in these paths trigger builds:

| Path | Service |
|------|---------|
| `services/market-data/**` | Market Data Service |
| `services/analysis-engine/**` | Analysis Engine |
| `services/portfolio-manager/**` | Portfolio Manager |
| `services/ml-prediction/**` | ML Prediction |
| `infrastructure/kubernetes/**` | Infrastructure (no build) |

## 🐳 Docker Images

Images pushed to:
- `jaimehenao8126/trii-market-data:latest`
- `jaimehenao8126/trii-market-data:<commit-sha>`
- `jaimehenao8126/trii-analysis-engine:latest`
- `jaimehenao8126/trii-portfolio-manager:latest`
- `jaimehenao8126/trii-ml-prediction:latest`

## ☸️ Deployment Flow

```
Code Push → GitHub Actions → DockerHub → Update Manifests → ArgoCD → Kubernetes
```

## ⚙️ Environment Variables

Set in GitHub Secrets:

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | DockerHub username |
| `DOCKER_PASSWORD` | DockerHub access token |

## 🛠️ Troubleshooting

**Build failing?**
- Check GitHub Actions logs
- Verify tests pass locally: `pytest tests/`
- Test Docker build: `docker build .`

**Images not deploying?**
- Check ArgoCD sync status
- Verify Kustomize overlays updated
- Check image tags match

**Need help?**
See [CICD_SETUP.md](../CICD_SETUP.md) troubleshooting section.
