# TRII Investment Platform - Agent Ecosystem

## Overview
The TRII Investment Platform uses a specialized agent ecosystem to handle different aspects of development, deployment, and maintenance. This multi-agent architecture ensures expert-level assistance for each technical domain while maintaining coordination across the entire platform.

## Agent Architecture

```
┌─────────────────────┐
│  orchestrator.agent │  ←── Master Coordinator
└──────────┬──────────┘
           │
           ├── npm.agent           (Package Management)
           ├── docker.agent        (Containerization)
           ├── database.agent      (Data Operations)
           ├── testing.agent       (Quality Assurance)
           ├── ml-ai.agent         (Machine Learning)
           ├── infrastructure.agent (DevOps & Deployment)
           └── monitoring.agent    (Observability)
```

## Specialized Agents

### 🎯 [orchestrator.agent.md](orchestrator.agent.md)
**Master Coordinator** - Orchestrates complex multi-domain operations
- Delegates tasks to specialized agents
- Manages workflow dependencies
- Coordinates cross-domain troubleshooting
- Handles end-to-end feature development

### 📦 [npm.agent.md](npm.agent.md)
**Package Management** - NPM/PNPM and workspace operations
- Dependency management across monorepo
- Workspace configuration
- Script execution and build operations
- Version management and conflict resolution

### 🐳 [docker.agent.md](docker.agent.md)
**Containerization** - Docker and container orchestration
- Container building and management
- Docker Compose operations
- Service networking and volumes
- Development environment setup

### 🗄️ [database.agent.md](database.agent.md)
**Data Operations** - PostgreSQL, Redis, and database management
- Schema design and migrations
- Query optimization and performance tuning
- Data backup and recovery
- Connection management for services

### 🧪 [testing.agent.md](testing.agent.md)
**Quality Assurance** - Comprehensive testing across the platform
- Unit, integration, and E2E testing
- Performance and security testing
- Test automation and CI/CD integration
- Coverage analysis and reporting

### 🤖 [ml-ai.agent.md](ml-ai.agent.md)
**Machine Learning** - AI-driven investment analysis
- ML model development and training
- Investment algorithm implementation
- Python environment management
- Model deployment and validation

### 🏗️ [infrastructure.agent.md](infrastructure.agent.md)
**DevOps & Deployment** - Infrastructure and automation
- Kubernetes orchestration
- Terraform infrastructure as code
- CI/CD pipeline management
- Load balancing and scaling

### 📊 [monitoring.agent.md](monitoring.agent.md)
**Observability** - Monitoring, logging, and alerting
- Prometheus/Grafana setup
- Log aggregation with Loki
- Custom business metrics
- Performance analysis and alerting

## Usage Patterns

### Direct Agent Usage
For single-domain tasks, interact directly with the specialized agent:

```
"npm.agent: Install lodash in the portfolio-manager service"
"docker.agent: Build and run the market-data service"
"database.agent: Create an index on the portfolio_positions table"
```

### Orchestrated Operations
For complex multi-domain tasks, use the orchestrator:

```
"orchestrator.agent: Deploy the new ML investment strategy to production"
"orchestrator.agent: Set up complete development environment for new developer"
"orchestrator.agent: Troubleshoot performance issues across the platform"
```

## Agent Selection Guide

| Task Type | Recommended Agent | Example |
|-----------|-------------------|---------|
| Package management | npm.agent | "Update all dependencies to latest versions" |
| Container issues | docker.agent | "Fix networking between services" |
| Database operations | database.agent | "Optimize slow queries in portfolio analysis" |
| Code quality | testing.agent | "Add E2E tests for new trading workflow" |
| ML development | ml-ai.agent | "Train model for risk assessment" |
| Deployment | infrastructure.agent | "Deploy to staging environment" |
| System monitoring | monitoring.agent | "Set up alerts for API response times" |
| Complex workflows | orchestrator.agent | "Complete feature from development to production" |

## Best Practices

### 1. Start Simple
- Use specialized agents for single-domain tasks
- Escalate to orchestrator for complex operations
- Let agents coordinate when dependencies exist

### 2. Clear Communication
- Specify target services or components
- Provide context about business requirements
- Mention any constraints or preferences

### 3. Trust the Expertise
- Each agent is specialized in its domain
- Agents will coordinate automatically when needed
- The orchestrator will handle complex dependencies

### 4. Monitor and Validate
- Use monitoring.agent to track changes
- Verify outcomes with testing.agent
- Document important decisions and configurations

## Platform Services Supported

### Applications
- **desktop-client**: Electron-based desktop application
- **web-client**: Future web interface

### Core Services
- **market-data**: Real-time market data processing
- **analysis-engine**: Investment analysis and computation
- **ml-prediction**: Machine learning prediction services
- **portfolio-manager**: Portfolio management and tracking
- **risk-assessment**: Risk analysis and compliance
- **notification**: Alert and notification system

### Infrastructure
- **PostgreSQL**: Primary database for transactional data
- **Redis**: Caching and session management
- **RabbitMQ**: Message queuing for service communication
- **Prometheus/Grafana**: Monitoring and alerting
- **Nginx**: Load balancing and reverse proxy

## Getting Started

1. **For new features**: Start with `orchestrator.agent`
2. **For specific technical issues**: Use the relevant specialized agent
3. **For maintenance tasks**: Use `orchestrator.agent` for complex operations, direct agents for simple ones
4. **For monitoring**: Use `monitoring.agent` to track system health and performance

## Agent Coordination

The agents are designed to work together seamlessly:
- **Automatic coordination**: Agents coordinate when tasks have dependencies
- **Shared context**: Important information is shared between relevant agents
- **Conflict avoidance**: Each agent has clear boundaries and responsibilities
- **Quality assurance**: The orchestrator ensures all requirements are met

This ecosystem provides comprehensive coverage of all technical aspects of the TRII Investment Platform while maintaining expertise and efficiency in each domain.