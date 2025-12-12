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
