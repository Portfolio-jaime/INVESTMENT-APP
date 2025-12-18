#!/bin/bash

# Portfolio Manager API Test Script
# This script demonstrates how to test the Portfolio Manager API endpoints

BASE_URL="http://localhost:8003"

echo "=== Portfolio Manager API Test Script ==="
echo ""

# Health Check
echo "1. Health Check"
curl -s "$BASE_URL/health" | jq '.'
echo ""
echo ""

# Create Portfolio
echo "2. Create Portfolio"
PORTFOLIO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/portfolios" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Test Portfolio",
    "description": "Testing portfolio management",
    "currency": "USD"
  }')
echo "$PORTFOLIO_RESPONSE" | jq '.'
PORTFOLIO_ID=$(echo "$PORTFOLIO_RESPONSE" | jq -r '.data.id')
echo "Created Portfolio ID: $PORTFOLIO_ID"
echo ""
echo ""

# Get All Portfolios
echo "3. Get All Portfolios"
curl -s "$BASE_URL/api/v1/portfolios" | jq '.'
echo ""
echo ""

# Get Portfolio by ID
echo "4. Get Portfolio by ID"
curl -s "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID" | jq '.'
echo ""
echo ""

# Create BUY Transaction
echo "5. Create BUY Transaction (AAPL)"
curl -s -X POST "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "transaction_type": "BUY",
    "quantity": 10,
    "price": 150.00,
    "fees": 1.99,
    "notes": "Initial purchase"
  }' | jq '.'
echo ""
echo ""

# Create Another BUY Transaction
echo "6. Create Another BUY Transaction (GOOGL)"
curl -s -X POST "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "GOOGL",
    "transaction_type": "BUY",
    "quantity": 5,
    "price": 140.00,
    "fees": 1.50,
    "notes": "Google investment"
  }' | jq '.'
echo ""
echo ""

# Get Transactions
echo "7. Get All Transactions"
curl -s "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID/transactions" | jq '.'
echo ""
echo ""

# Get Positions
echo "8. Get Current Positions"
curl -s "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID/positions" | jq '.'
echo ""
echo ""

# Get Portfolio Summary
echo "9. Get Portfolio Summary (with P&L)"
curl -s "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID/summary" | jq '.'
echo ""
echo ""

# Create SELL Transaction
echo "10. Create SELL Transaction (Partial)"
curl -s -X POST "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "transaction_type": "SELL",
    "quantity": 5,
    "price": 155.00,
    "fees": 1.50,
    "notes": "Taking profits"
  }' | jq '.'
echo ""
echo ""

# Get Updated Positions
echo "11. Get Updated Positions After Sell"
curl -s "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID/positions" | jq '.'
echo ""
echo ""

# Update Portfolio
echo "12. Update Portfolio"
curl -s -X PUT "$BASE_URL/api/v1/portfolios/$PORTFOLIO_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Portfolio",
    "description": "This portfolio has been updated"
  }' | jq '.'
echo ""
echo ""

echo "=== Test Complete ==="
echo "Portfolio ID: $PORTFOLIO_ID"
echo ""
echo "To delete the portfolio, run:"
echo "curl -X DELETE $BASE_URL/api/v1/portfolios/$PORTFOLIO_ID"
