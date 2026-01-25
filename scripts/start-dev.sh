#!/bin/bash

# TRII Investment Platform - Development Startup Script
# This script starts both backend services and the frontend for full-stack development

set -e  # Exit on any error

echo "🚀 Starting TRII Investment Platform Development Environment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $1 is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $1 is available${NC}"
        return 0
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $name to start...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s $url/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        
        echo -ne "${YELLOW}   Attempt $attempt/$max_attempts...${NC}\r"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Check required ports
echo -e "${BLUE}🔍 Checking available ports...${NC}"
check_port 3000  # Frontend
check_port 8001  # Market Data Service
check_port 8003  # Portfolio Manager Service
check_port 5432  # PostgreSQL

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Start PostgreSQL database
echo -e "${BLUE}🗄️  Starting PostgreSQL database...${NC}"
cd /Users/jaime.henao/arheanja/investment-app
if ! docker-compose up -d postgres-service; then
    echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Start Portfolio Manager Service (Node.js)
echo -e "${BLUE}📊 Starting Portfolio Manager Service...${NC}"
cd /Users/jaime.henao/arheanja/investment-app/backend/portfolio-manager
npm install > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  npm install failed, continuing...${NC}"

# Start Portfolio Manager in background
PORT=8003 npm run dev > portfolio-manager.log 2>&1 &
PORTFOLIO_PID=$!
echo -e "${BLUE}   Portfolio Manager PID: $PORTFOLIO_PID${NC}"

# Start Market Data Service (Python)
echo -e "${BLUE}📈 Starting Market Data Service...${NC}"
cd /Users/jaime.henao/arheanja/investment-app/backend/market-data

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}🐍 Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  pip install failed, continuing...${NC}"

# Start Market Data Service in background
PORT=8001 python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > market-data.log 2>&1 &
MARKET_DATA_PID=$!
echo -e "${BLUE}   Market Data Service PID: $MARKET_DATA_PID${NC}"

# Wait for backend services to be ready
wait_for_service "http://localhost:8003" "Portfolio Manager"
wait_for_service "http://localhost:8001" "Market Data Service"

# Start Frontend (React + Vite)
echo -e "${BLUE}🎨 Starting Frontend Application...${NC}"
cd /Users/jaime.henao/arheanja/investment-app/app/frontend

# Install frontend dependencies
npm install > /dev/null 2>&1 || echo -e "${YELLOW}⚠️  npm install failed, continuing...${NC}"

# Start frontend in background
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${BLUE}   Frontend PID: $FRONTEND_PID${NC}"

# Wait for frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 5

# Display status and URLs
echo -e "\n${GREEN}🎉 TRII Investment Platform is now running!${NC}"
echo -e "=================================================="
echo -e "${BLUE}📊 Portfolio Manager:${NC} http://localhost:8003"
echo -e "${BLUE}📈 Market Data Service:${NC} http://localhost:8001"
echo -e "${BLUE}🎨 Frontend Application:${NC} http://localhost:3000"
echo -e "${BLUE}🗄️  PostgreSQL Database:${NC} localhost:5432"
echo -e "\n${YELLOW}📋 Service Health Checks:${NC}"
echo -e "   Portfolio Manager: curl http://localhost:8003/health"
echo -e "   Market Data: curl http://localhost:8001/health"

# Create cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${BLUE}   Stopped Frontend (PID: $FRONTEND_PID)${NC}"
    fi
    
    # Kill backend services
    if [ ! -z "$PORTFOLIO_PID" ]; then
        kill $PORTFOLIO_PID 2>/dev/null || true
        echo -e "${BLUE}   Stopped Portfolio Manager (PID: $PORTFOLIO_PID)${NC}"
    fi
    
    if [ ! -z "$MARKET_DATA_PID" ]; then
        kill $MARKET_DATA_PID 2>/dev/null || true
        echo -e "${BLUE}   Stopped Market Data Service (PID: $MARKET_DATA_PID)${NC}"
    fi
    
    # Stop Docker services
    cd /Users/jaime.henao/arheanja/investment-app
    docker-compose down > /dev/null 2>&1 || true
    echo -e "${BLUE}   Stopped Docker services${NC}"
    
    echo -e "${GREEN}✅ All services stopped successfully${NC}"
}

# Trap cleanup function on script exit
trap cleanup EXIT

echo -e "\n${GREEN}🔥 Development environment is ready!${NC}"
echo -e "${YELLOW}💡 Press Ctrl+C to stop all services${NC}"
echo -e "\n${BLUE}📋 Useful Commands:${NC}"
echo -e "   Check logs: tail -f *.log"
echo -e "   Test API: curl http://localhost:8003/health"
echo -e "   Open app: open http://localhost:3000"

# Wait for user interrupt
echo -e "\n${YELLOW}⏳ Services running... (Press Ctrl+C to stop)${NC}"
while true; do
    sleep 1
done