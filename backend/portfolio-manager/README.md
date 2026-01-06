# Portfolio Manager Service

Portfolio management microservice for the TRII Investment Platform. Handles portfolio CRUD operations, transaction tracking, position management, and P&L calculations.

## Features

- Portfolio CRUD operations
- Transaction tracking (buy/sell)
- Automatic position calculation from transactions
- Real-time P&L calculations using market data
- PostgreSQL database integration
- RESTful API with validation
- TypeScript with strict mode
- Docker support
- Health check endpoints

## Tech Stack

- Node.js 18+
- TypeScript 5.3+
- Express.js
- PostgreSQL (via pg)
- Docker

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Docker (for containerized deployment)
- Market Data Service (for real-time quotes)

## Installation

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
PORT=8003
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trii_dev
MARKET_DATA_SERVICE_URL=http://localhost:8001
```

4. Run in development mode:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

### Docker Deployment

The service is included in the main docker-compose.yml:

```bash
# From the project root
docker-compose up portfolio-manager
```

Or run individually:
```bash
# From this directory
docker build -t trii-portfolio-manager .
docker run -p 8003:8003 \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/trii_dev \
  -e MARKET_DATA_SERVICE_URL=http://market-data:8001 \
  trii-portfolio-manager
```

## API Endpoints

### Health Check
- `GET /health` - Service health check

### Portfolios
- `GET /api/v1/portfolios` - List all portfolios
  - Query params: `user_id` (optional)
- `GET /api/v1/portfolios/:id` - Get portfolio by ID
- `POST /api/v1/portfolios` - Create new portfolio
- `PUT /api/v1/portfolios/:id` - Update portfolio
- `DELETE /api/v1/portfolios/:id` - Delete portfolio (soft delete)

### Transactions
- `GET /api/v1/portfolios/:id/transactions` - List transactions
  - Query params: `limit` (default: 100, max: 1000)
- `POST /api/v1/portfolios/:id/transactions` - Create transaction

### Positions
- `GET /api/v1/portfolios/:id/positions` - Get current positions
- `GET /api/v1/portfolios/:id/summary` - Get portfolio summary with P&L

## Request/Response Examples

### Create Portfolio
```bash
POST /api/v1/portfolios
Content-Type: application/json

{
  "user_id": 1,
  "name": "My Investment Portfolio",
  "description": "Long-term investment portfolio",
  "currency": "USD"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "My Investment Portfolio",
    "description": "Long-term investment portfolio",
    "currency": "USD",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Portfolio created successfully"
}
```

### Create Transaction (Buy)
```bash
POST /api/v1/portfolios/1/transactions
Content-Type: application/json

{
  "symbol": "AAPL",
  "transaction_type": "BUY",
  "quantity": 10,
  "price": 150.50,
  "fees": 1.99,
  "notes": "Initial purchase"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "portfolio_id": 1,
    "symbol": "AAPL",
    "transaction_type": "BUY",
    "quantity": 10,
    "price": 150.50,
    "fees": 1.99,
    "total": 1506.99,
    "notes": "Initial purchase",
    "transaction_date": "2024-01-01T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Transaction created successfully"
}
```

### Get Portfolio Summary
```bash
GET /api/v1/portfolios/1/summary
```

Response:
```json
{
  "success": true,
  "data": {
    "portfolio_id": 1,
    "portfolio_name": "My Investment Portfolio",
    "total_value": 1550.00,
    "total_cost": 1506.99,
    "cash": 0,
    "total_pnl": 43.01,
    "total_pnl_percent": 2.85,
    "positions_count": 1,
    "positions": [
      {
        "id": 1,
        "portfolio_id": 1,
        "symbol": "AAPL",
        "quantity": 10,
        "avg_cost": 150.50,
        "current_price": 155.00,
        "market_value": 1550.00,
        "unrealized_pnl": 45.00,
        "unrealized_pnl_percent": 2.99,
        "total_cost": 1505.00,
        "latest_quote": {
          "symbol": "AAPL",
          "price": 155.00,
          "change": 4.50,
          "change_percent": 2.99,
          "volume": 50000000,
          "timestamp": "2024-01-01T16:00:00.000Z"
        }
      }
    ],
    "last_updated": "2024-01-01T16:00:00.000Z"
  }
}
```

## Database Schema

The service uses the following PostgreSQL tables:

### portfolios
- `id` - Primary key
- `user_id` - User identifier
- `name` - Portfolio name
- `description` - Optional description
- `currency` - Currency code (default: USD)
- `is_active` - Active status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### transactions
- `id` - Primary key
- `portfolio_id` - Foreign key to portfolios
- `symbol` - Stock symbol
- `transaction_type` - BUY or SELL
- `quantity` - Number of shares
- `price` - Price per share
- `fees` - Transaction fees
- `total` - Total transaction amount
- `notes` - Optional notes
- `transaction_date` - Transaction timestamp
- `created_at` - Creation timestamp

### positions
- `id` - Primary key
- `portfolio_id` - Foreign key to portfolios
- `symbol` - Stock symbol
- `quantity` - Current quantity held
- `avg_cost` - Average cost per share
- `current_price` - Latest market price
- `market_value` - Current market value
- `unrealized_pnl` - Unrealized profit/loss
- `unrealized_pnl_percent` - P&L percentage
- `last_updated` - Last update timestamp
- `created_at` - Creation timestamp

## Architecture

### Project Structure
```
services/portfolio-manager/
├── src/
│   ├── index.ts                   # Main app entry
│   ├── config/
│   │   └── database.ts            # DB config & connection
│   ├── routes/
│   │   ├── portfolios.ts          # Portfolio routes
│   │   ├── transactions.ts        # Transaction routes
│   │   └── positions.ts           # Position routes
│   ├── controllers/
│   │   ├── portfolioController.ts # Portfolio handlers
│   │   ├── transactionController.ts # Transaction handlers
│   │   └── positionController.ts  # Position handlers
│   ├── services/
│   │   └── portfolioService.ts    # Business logic
│   └── types/
│       └── index.ts               # TypeScript types
├── package.json
├── tsconfig.json
├── Dockerfile
└── .dockerignore
```

### Key Features

**Transaction Management**
- Automatically calculates position from buy/sell transactions
- Tracks average cost basis
- Validates sell transactions against available quantity
- Uses database transactions for data consistency

**P&L Calculation**
- Fetches real-time quotes from Market Data Service
- Calculates unrealized P&L for each position
- Provides portfolio-level summary with total P&L
- Updates position data with latest market prices

**Error Handling**
- Custom AppError class for operational errors
- Validation using express-validator
- Comprehensive error messages
- Graceful degradation when market data unavailable

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8003 |
| NODE_ENV | Environment (development/production) | development |
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@postgres:5432/trii_dev |
| MARKET_DATA_SERVICE_URL | Market data service URL | http://market-data:8001 |
| DEBUG | Enable debug logging | true |

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

### Building
```bash
npm run build
```

## Integration

### Market Data Service
The service integrates with the Market Data Service to fetch real-time quotes for P&L calculations. If the market data service is unavailable, positions will still be calculated using cost basis only.

### Database
Connects to the shared PostgreSQL database with all other TRII services. Ensure the database is initialized with the schema from `/scripts/database/init_db.sql`.

## Production Considerations

1. **Authentication**: Add authentication middleware to protect endpoints
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Caching**: Add Redis caching for frequently accessed portfolios
4. **Monitoring**: Integrate with monitoring tools (Prometheus, Grafana)
5. **Logging**: Enhanced logging with structured formats
6. **Backup**: Regular database backups for transaction data
7. **Cash Management**: Implement cash balance tracking
8. **Realized P&L**: Track realized gains/losses from sold positions

## Future Enhancements

- [ ] Cash balance management
- [ ] Realized P&L tracking
- [ ] Portfolio performance metrics (Sharpe ratio, etc.)
- [ ] Multi-currency support
- [ ] Tax lot tracking (FIFO/LIFO)
- [ ] Dividend tracking
- [ ] Portfolio rebalancing suggestions
- [ ] Historical performance charts
- [ ] Export to CSV/PDF
- [ ] WebSocket support for real-time updates

## License

MIT

## Author

TRII Platform Team
