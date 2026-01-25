# TRII Platform - Testing Strategy

## Overview

The TRII platform implements a comprehensive testing strategy covering unit tests, integration tests, end-to-end tests, and performance tests. This ensures code quality, reliability, and user experience across all components.

## Testing Pyramid

```
End-to-End Tests (E2E)
    ↕️
Integration Tests
    ↕️
Component Tests
    ↕️
Unit Tests
```

### Unit Tests (Bottom Layer)
- **Coverage**: 80% minimum code coverage
- **Scope**: Individual functions and methods
- **Speed**: Fast execution (< 100ms per test)
- **Isolation**: Mock external dependencies

### Component Tests (Middle Layer)
- **Coverage**: Critical user journeys
- **Scope**: Component integration and interaction
- **Speed**: Medium execution (100ms - 1s per test)
- **Isolation**: Mock external services

### Integration Tests (Upper Middle Layer)
- **Coverage**: Service-to-service communication
- **Scope**: API endpoints and data flow
- **Speed**: Slow execution (1s - 10s per test)
- **Isolation**: Test containers for dependencies

### End-to-End Tests (Top Layer)
- **Coverage**: Complete user workflows
- **Scope**: Full application flow
- **Speed**: Slowest execution (10s - 60s per test)
- **Isolation**: Full environment testing

## Testing Frameworks

### Backend Services

#### Python Services (FastAPI)
```python
# pytest configuration
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --cov=app --cov-report=term-missing --cov-report=html
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

#### TypeScript Services (NestJS)
```typescript
// jest configuration
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Frontend Application

#### React Testing
```typescript
// React Testing Library + Jest
import { render, screen, fireEvent } from '@testing-library/react';
import { InvestmentDashboard } from './InvestmentDashboard';

test('displays portfolio value', () => {
  render(<InvestmentDashboard />);
  expect(screen.getByText(/\$[0-9,]+/)).toBeInTheDocument();
});
```

#### Electron Testing
```typescript
// Spectron for Electron testing
const Application = require('spectron').Application;

describe('Desktop Application', () => {
  let app;

  beforeEach(async () => {
    app = new Application({
      path: './node_modules/.bin/electron',
      args: ['.'],
    });
    await app.start();
  });

  afterEach(async () => {
    if (app && app.isRunning()) {
      await app.stop();
    }
  });

  it('shows main window', async () => {
    const windowCount = await app.client.getWindowCount();
    expect(windowCount).toBe(1);
  });
});
```

## Test Categories

### Unit Tests

#### Service Layer Testing
```python
# Example: Market Data Service Unit Test
import pytest
from app.services.market_data import MarketDataService

class TestMarketDataService:
    def test_get_quote_success(self, mock_yfinance):
        service = MarketDataService()
        result = service.get_quote("AAPL")

        assert result.symbol == "AAPL"
        assert result.price > 0
        assert result.timestamp is not None

    def test_get_quote_not_found(self, mock_yfinance):
        service = MarketDataService()

        with pytest.raises(ValueError):
            service.get_quote("INVALID")
```

#### Repository Layer Testing
```python
# Example: Portfolio Repository Test
class TestPortfolioRepository:
    def test_create_portfolio(self, db_session):
        repo = PortfolioRepository(db_session)
        portfolio = Portfolio(name="Test Portfolio", user_id=1)

        created = repo.create(portfolio)

        assert created.id is not None
        assert created.name == "Test Portfolio"

    def test_get_portfolio_not_found(self, db_session):
        repo = PortfolioRepository(db_session)

        with pytest.raises(NotFoundError):
            repo.get_by_id(999)
```

### Integration Tests

#### API Integration Testing
```python
# Example: FastAPI Integration Test
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_portfolio_positions():
    # Create test portfolio
    portfolio_response = client.post("/portfolios", json={
        "name": "Test Portfolio",
        "user_id": 1
    })
    portfolio_id = portfolio_response.json()["id"]

    # Add position
    client.post(f"/portfolios/{portfolio_id}/transactions", json={
        "symbol": "AAPL",
        "transaction_type": "BUY",
        "quantity": 100,
        "price": 150.00
    })

    # Get positions
    response = client.get(f"/portfolios/{portfolio_id}/positions")
    assert response.status_code == 200

    positions = response.json()
    assert len(positions) == 1
    assert positions[0]["symbol"] == "AAPL"
```

#### Database Integration Testing
```python
# Example: Database Integration Test
def test_portfolio_transaction_flow(db_session):
    # Create user
    user = User(email="test@example.com", username="testuser")
    db_session.add(user)
    db_session.commit()

    # Create portfolio
    portfolio = Portfolio(name="Test", user_id=user.id, cash_balance=10000)
    db_session.add(portfolio)
    db_session.commit()

    # Execute transaction
    transaction = Transaction(
        portfolio_id=portfolio.id,
        symbol="AAPL",
        transaction_type="BUY",
        quantity=10,
        price=150.00,
        total=1500.00
    )
    db_session.add(transaction)

    # Update portfolio cash balance
    portfolio.cash_balance -= 1500.00
    db_session.commit()

    # Verify final state
    updated_portfolio = db_session.query(Portfolio).get(portfolio.id)
    assert updated_portfolio.cash_balance == 8500.00

    positions = db_session.query(Position).filter_by(
        portfolio_id=portfolio.id, symbol="AAPL"
    ).all()
    assert len(positions) == 1
    assert positions[0].quantity == 10
```

### End-to-End Tests

#### Desktop Application E2E
```typescript
// Playwright for Desktop App E2E
import { _electron as electron } from 'playwright';

test('complete portfolio workflow', async () => {
  const electronApp = await electron.launch({
    args: ['dist/main.js']
  });

  const window = await electronApp.firstWindow();

  // Navigate to portfolio
  await window.click('text=Portfolio');

  // Add new portfolio
  await window.click('text=Add Portfolio');
  await window.fill('[placeholder="Portfolio Name"]', 'Test Portfolio');
  await window.click('text=Create');

  // Add transaction
  await window.click('text=Add Transaction');
  await window.selectOption('select[name=type]', 'BUY');
  await window.fill('[name=symbol]', 'AAPL');
  await window.fill('[name=quantity]', '100');
  await window.fill('[name=price]', '150.00');
  await window.click('text=Submit');

  // Verify portfolio value updated
  await expect(window.locator('.portfolio-value')).toContainText('$15,000');

  await electronApp.close();
});
```

#### API E2E Testing
```python
# Full API workflow test
def test_complete_investment_workflow(client, db_session):
    # 1. Create user
    user_response = client.post("/users", json={
        "email": "investor@example.com",
        "username": "investor",
        "password": "securepass123"
    })
    user_id = user_response.json()["id"]

    # 2. Create portfolio
    portfolio_response = client.post("/portfolios", json={
        "name": "Growth Portfolio",
        "user_id": user_id,
        "cash_balance": 50000.00
    })
    portfolio_id = portfolio_response.json()["id"]

    # 3. Get market data
    quote_response = client.get("/market-data/quotes/AAPL")
    assert quote_response.status_code == 200
    quote = quote_response.json()

    # 4. Execute trade
    trade_response = client.post(f"/portfolios/{portfolio_id}/transactions", json={
        "symbol": "AAPL",
        "transaction_type": "BUY",
        "quantity": 50,
        "price": quote["price"]
    })
    assert trade_response.status_code == 201

    # 5. Get portfolio analysis
    analysis_response = client.get(f"/analysis/portfolio/{portfolio_id}")
    assert analysis_response.status_code == 200

    analysis = analysis_response.json()
    assert "total_value" in analysis
    assert "performance" in analysis
```

## Test Data Management

### Test Database Setup
```python
# conftest.py for pytest
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base

@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine("postgresql://test:test@localhost/test_db")
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()
```

### Mock Data Generation
```python
# Mock market data for testing
def generate_mock_quotes(symbols):
    quotes = {}
    for symbol in symbols:
        quotes[symbol] = {
            "symbol": symbol,
            "price": round(random.uniform(10, 1000), 2),
            "change": round(random.uniform(-50, 50), 2),
            "volume": random.randint(100000, 10000000),
            "timestamp": datetime.utcnow().isoformat()
        }
    return quotes
```

## Performance Testing

### Load Testing
```python
# Locust for load testing
from locust import HttpUser, task, between

class MarketDataUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def get_quote(self):
        self.client.get("/api/v1/quotes/AAPL")

    @task(3)
    def get_analysis(self):
        self.client.get("/api/v1/analysis/AAPL")
```

### Stress Testing
- **Break point testing**: Find system limits
- **Spike testing**: Sudden load increases
- **Volume testing**: Large data sets
- **Endurance testing**: Prolonged load periods

### Performance Benchmarks
- **API Response Time**: P95 < 100ms
- **Concurrent Users**: 1000+ simultaneous users
- **Throughput**: 1000+ requests/second
- **Memory Usage**: < 500MB per service

## Security Testing

### Authentication Testing
```python
def test_unauthorized_access(client):
    response = client.get("/api/v1/portfolios")
    assert response.status_code == 401

def test_invalid_token(client):
    headers = {"Authorization": "Bearer invalid-token"}
    response = client.get("/api/v1/portfolios", headers=headers)
    assert response.status_code == 401
```

### Authorization Testing
```python
def test_user_cannot_access_other_portfolio(client, auth_headers):
    # Create portfolio for user A
    response_a = client.post("/portfolios", json={
        "name": "Portfolio A", "user_id": 1
    }, headers=auth_headers)

    # Try to access as user B
    headers_b = {"Authorization": "Bearer user-b-token"}
    portfolio_id = response_a.json()["id"]
    response = client.get(f"/portfolios/{portfolio_id}", headers=headers_b)
    assert response.status_code == 403
```

### Input Validation Testing
```python
def test_sql_injection_protection(client):
    malicious_input = "'; DROP TABLE users; --"
    response = client.get(f"/market-data/quotes/{malicious_input}")
    assert response.status_code == 400
```

## Test Automation

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
    - uses: actions/checkout@v4
    - name: Run tests
      run: |
        pnpm install
        pnpm test
        pnpm test:integration
        pnpm test:e2e
```

### Test Reporting
- **Coverage Reports**: HTML and JSON formats
- **Test Results**: JUnit XML for CI integration
- **Performance Metrics**: Response times and throughput
- **Security Scan Results**: Vulnerability reports

## Test Environments

### Local Development
- **Unit tests**: Run on every file save
- **Integration tests**: Run before commits
- **E2E tests**: Run nightly

### CI Environment
- **Full test suite**: On every push
- **Performance tests**: On release branches
- **Security tests**: Weekly scans

### Staging Environment
- **E2E tests**: Before production deployment
- **Load tests**: Performance validation
- **Compatibility tests**: Cross-browser/platform

## Quality Gates

### Code Quality Metrics
- **Test Coverage**: > 80% overall
- **Cyclomatic Complexity**: < 10 per function
- **Technical Debt**: < 5% of codebase
- **Security Vulnerabilities**: 0 critical/high

### Performance Benchmarks
- **Startup Time**: < 30 seconds for services
- **Memory Leak**: < 5% growth over 1 hour
- **Error Rate**: < 0.1% in production
- **Uptime**: > 99.9% SLA

### Release Criteria
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Code review approved

## Continuous Testing

### Test-Driven Development (TDD)
- Write tests before implementation
- Red-Green-Refactor cycle
- Test coverage as design tool

### Behavior-Driven Development (BDD)
- User story mapping to tests
- Given-When-Then test structure
- Business requirement validation

### Shift-Left Testing
- Security testing in development
- Performance testing early
- Automated testing in CI/CD

This comprehensive testing strategy ensures the TRII platform delivers reliable, secure, and high-performance investment analysis tools to users.