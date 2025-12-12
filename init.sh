#!/bin/bash

################################################################################
# TRII Investment Platform - Initialization Script
#
# This script sets up the complete development environment for the TRII
# investment decision support platform.
#
# Usage: ./init.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project name
PROJECT_NAME="TRII Investment Platform"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}"
    echo "================================================================================"
    echo "$1"
    echo "================================================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed ($(command -v $1))"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

################################################################################
# Banner
################################################################################

clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ████████╗██████╗ ██╗██╗    ██████╗ ██╗      █████╗ ████████╗███████╗  ║
║   ╚══██╔══╝██╔══██╗██║██║    ██╔══██╗██║     ██╔══██╗╚══██╔══╝██╔════╝  ║
║      ██║   ██████╔╝██║██║    ██████╔╝██║     ███████║   ██║   █████╗    ║
║      ██║   ██╔══██╗██║██║    ██╔═══╝ ██║     ██╔══██║   ██║   ██╔══╝    ║
║      ██║   ██║  ██║██║██║    ██║     ███████╗██║  ██║   ██║   ██║       ║
║      ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝    ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝       ║
║                                                                           ║
║              Investment Decision Support Platform v1.0                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

print_info "Initializing TRII Investment Platform development environment..."
echo ""

################################################################################
# Step 1: Check Prerequisites
################################################################################

print_header "Step 1: Checking Prerequisites"

MISSING_DEPS=0

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node -v)
    print_info "Node.js version: $NODE_VERSION"
else
    print_error "Node.js is required. Please install from https://nodejs.org/"
    MISSING_DEPS=1
fi

# Check npm
if check_command npm; then
    NPM_VERSION=$(npm -v)
    print_info "npm version: $NPM_VERSION"
else
    print_error "npm is required (comes with Node.js)"
    MISSING_DEPS=1
fi

# Check Python
if check_command python3; then
    PYTHON_VERSION=$(python3 --version)
    print_info "Python version: $PYTHON_VERSION"
else
    print_error "Python 3.11+ is required. Please install from https://www.python.org/"
    MISSING_DEPS=1
fi

# Check pip
if check_command pip3; then
    PIP_VERSION=$(pip3 --version)
    print_info "pip version: $PIP_VERSION"
else
    print_error "pip is required (comes with Python)"
    MISSING_DEPS=1
fi

# Check Docker
if check_command docker; then
    DOCKER_VERSION=$(docker --version)
    print_info "Docker version: $DOCKER_VERSION"
else
    print_warning "Docker is optional but recommended. Install from https://www.docker.com/"
fi

# Check Docker Compose
if check_command docker-compose; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_info "Docker Compose version: $COMPOSE_VERSION"
else
    print_warning "Docker Compose is optional but recommended."
fi

# Check Git
if check_command git; then
    GIT_VERSION=$(git --version)
    print_info "Git version: $GIT_VERSION"
else
    print_error "Git is required. Please install from https://git-scm.com/"
    MISSING_DEPS=1
fi

# Exit if missing required dependencies
if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    print_error "Missing required dependencies. Please install them and try again."
    exit 1
fi

echo ""
print_success "All required dependencies are installed!"
echo ""

################################################################################
# Step 2: Install PNPM
################################################################################

print_header "Step 2: Installing PNPM Package Manager"

if check_command pnpm; then
    PNPM_VERSION=$(pnpm -v)
    print_info "PNPM version: $PNPM_VERSION"
else
    print_info "Installing PNPM..."
    npm install -g pnpm
    print_success "PNPM installed successfully!"
fi

echo ""

################################################################################
# Step 3: Create Project Structure
################################################################################

print_header "Step 3: Creating Project Structure"

# Create directory structure
print_info "Creating directories..."

mkdir -p apps/desktop-client/{public,src/{main,renderer,shared}}
mkdir -p apps/desktop-client/src/renderer/{components,features,store,hooks,utils,types,services}
mkdir -p services/{market-data,analysis-engine,ml-prediction,portfolio-manager,risk-assessment,notification}
mkdir -p libs/{common,api-client,python-common}
mkdir -p infrastructure/{docker,terraform,kubernetes,nginx,monitoring}
mkdir -p infrastructure/monitoring/{prometheus,grafana,loki}
mkdir -p scripts/{setup,deployment,database,maintenance,ci}
mkdir -p docs/{architecture,api,deployment,development,operations,user}
mkdir -p tests/{integration,e2e,performance,security}
mkdir -p data/{historical,models,backups,exports}
mkdir -p config/{environments,database,redis,rabbitmq}
mkdir -p .github/workflows
mkdir -p .vscode
mkdir -p .husky

print_success "Project structure created!"
echo ""

################################################################################
# Step 4: Initialize Git Repository
################################################################################

print_header "Step 4: Initializing Git Repository"

if [ ! -d .git ]; then
    git init
    print_success "Git repository initialized!"
else
    print_info "Git repository already exists"
fi

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
pnpm-lock.yaml
package-lock.json
yarn.lock

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
.venv
pip-log.txt
pip-delete-this-directory.txt
.pytest_cache/
.mypy_cache/
.coverage
htmlcov/

# Build outputs
dist/
build/
*.egg-info/
out/
.next/
.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Environment
.env
.env.local
.env.*.local
*.env

# Data
data/historical/*
data/models/*
data/backups/*
data/exports/*
!data/.gitkeep

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Docker
.docker/

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/
test-results/
playwright-report/

# Misc
*.bak
*.tmp
.cache/
EOF

print_success ".gitignore created!"
echo ""

################################################################################
# Step 5: Create Root Package.json
################################################################################

print_header "Step 5: Creating Root Package Configuration"

cat > package.json << 'EOF'
{
  "name": "trii-investment-platform",
  "version": "1.0.0",
  "description": "TRII Investment Decision Support Platform",
  "private": true,
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/investment-app.git"
  },
  "scripts": {
    "dev": "pnpm --filter desktop-client dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "pnpm -r type-check",
    "clean": "pnpm -r clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
EOF

print_success "Root package.json created!"
echo ""

################################################################################
# Step 6: Create PNPM Workspace
################################################################################

print_header "Step 6: Setting up PNPM Workspace"

cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'services/*'
  - 'libs/*'
EOF

print_success "PNPM workspace configured!"
echo ""

################################################################################
# Step 7: Create Environment Template
################################################################################

print_header "Step 7: Creating Environment Configuration"

cat > config/environments/.env.example << 'EOF'
# Application
NODE_ENV=development
APP_NAME=TRII Platform
APP_VERSION=1.0.0
APP_PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trii_dev
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_MAX_CONNECTIONS=50

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
RABBITMQ_EXCHANGE=trii_events

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=trii-data

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# API Keys (Get free keys from providers)
ALPHA_VANTAGE_API_KEY=demo
TWELVE_DATA_API_KEY=your-key-here
FINNHUB_API_KEY=your-key-here

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Feature Flags
ENABLE_ML_PREDICTIONS=true
ENABLE_REAL_TIME_DATA=true
ENABLE_EMAIL_NOTIFICATIONS=false
EOF

cp config/environments/.env.example .env

print_success "Environment configuration created!"
print_warning "Remember to update API keys in .env file!"
echo ""

################################################################################
# Step 8: Create Docker Compose Configuration
################################################################################

print_header "Step 8: Creating Docker Compose Configuration"

cat > infrastructure/docker/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: trii-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: trii_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: trii-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: trii-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: trii-minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  minio_data:

networks:
  default:
    name: trii-network
EOF

ln -sf infrastructure/docker/docker-compose.yml docker-compose.yml

print_success "Docker Compose configuration created!"
echo ""

################################################################################
# Step 9: Create README
################################################################################

print_header "Step 9: Creating Documentation"

cat > README.md << 'EOF'
# TRII Investment Decision Support Platform

A comprehensive desktop application for detecting optimal investment opportunities using real-time data analysis, technical indicators, and machine learning predictions.

## Features

- Real-time market data streaming
- Technical analysis (RSI, MACD, Bollinger Bands, etc.)
- ML-powered price predictions
- Portfolio management
- Risk assessment tools
- Customizable alerts and notifications

## Quick Start

See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

```bash
# Install dependencies
pnpm install

# Start infrastructure services
docker-compose up -d

# Start development environment
pnpm dev
```

## Documentation

- [Architecture](ARCHITECTURE.md) - System architecture and design
- [Technology Stack](TECH_STACK_JUSTIFICATION.md) - Technology choices and rationale
- [DevOps Guide](DEVOPS_IMPLEMENTATION.md) - CI/CD and deployment
- [Quick Start](QUICK_START.md) - Development setup guide
- [Project Structure](PROJECT_STRUCTURE.md) - Directory organization

## Tech Stack

- **Frontend**: Electron + React + TypeScript
- **Backend**: FastAPI (Python) + NestJS (Node.js)
- **Database**: PostgreSQL + TimescaleDB
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **ML/AI**: TensorFlow, Scikit-learn, XGBoost
- **DevOps**: Docker, GitHub Actions, Prometheus, Grafana

## Project Structure

```
investment-app/
├── apps/              # Frontend applications
├── services/          # Backend microservices
├── libs/              # Shared libraries
├── infrastructure/    # Docker, IaC, monitoring
├── scripts/           # Automation scripts
├── docs/              # Documentation
└── tests/             # Integration & E2E tests
```

## Development

```bash
# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## License

MIT License - see LICENSE file for details.

## Contributors

- TRII Platform Team

---

**Version**: 1.0.0
**Last Updated**: 2025-12-11
EOF

print_success "README.md created!"
echo ""

################################################################################
# Step 10: Create Helper Scripts
################################################################################

print_header "Step 10: Creating Helper Scripts"

# Health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

echo "Checking service health..."
echo ""

check_service() {
    SERVICE_NAME=$1
    URL=$2

    if curl -s -f -o /dev/null $URL; then
        echo "✓ $SERVICE_NAME is healthy"
    else
        echo "✗ $SERVICE_NAME is not responding"
    fi
}

check_service "Market Data" "http://localhost:8001/health"
check_service "Analysis Engine" "http://localhost:8002/health"
check_service "ML Service" "http://localhost:8003/health"
check_service "Portfolio Manager" "http://localhost:8004/health"
check_service "Risk Assessment" "http://localhost:8005/health"
check_service "Notification" "http://localhost:8006/health"

echo ""
echo "Infrastructure services:"
docker-compose ps
EOF

chmod +x scripts/health-check.sh

print_success "Helper scripts created!"
echo ""

################################################################################
# Step 11: Final Summary
################################################################################

print_header "Installation Complete!"

cat << EOF

${GREEN}✓ TRII Investment Platform initialized successfully!${NC}

${BLUE}Project Structure:${NC}
  - Frontend application: apps/desktop-client/
  - Backend services: services/
  - Documentation: *.md files in root
  - Docker setup: docker-compose.yml

${BLUE}Next Steps:${NC}

1. ${YELLOW}Review documentation:${NC}
   - QUICK_START.md - Setup and development guide
   - ARCHITECTURE.md - System architecture
   - TECH_STACK_JUSTIFICATION.md - Technology choices

2. ${YELLOW}Configure environment:${NC}
   - Edit .env file with your API keys
   - Get free API keys from:
     • Alpha Vantage: https://www.alphavantage.co/support/#api-key
     • Twelve Data: https://twelvedata.com/apikey

3. ${YELLOW}Start infrastructure:${NC}
   docker-compose up -d

4. ${YELLOW}Install dependencies:${NC}
   pnpm install

5. ${YELLOW}Start development:${NC}
   pnpm dev

${BLUE}Useful Commands:${NC}
  pnpm dev                  # Start frontend
  docker-compose up -d      # Start infrastructure
  docker-compose logs -f    # View logs
  ./scripts/health-check.sh # Check service health
  pnpm test                 # Run tests

${BLUE}Access Points:${NC}
  Frontend:          http://localhost:3000
  API Docs:          http://localhost:8001/docs
  RabbitMQ:          http://localhost:15672 (guest/guest)
  MinIO Console:     http://localhost:9001 (minioadmin/minioadmin)

${GREEN}Happy coding! 🚀${NC}

EOF

################################################################################
# End of Script
################################################################################
