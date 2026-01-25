#!/bin/bash

# TRII Clean Architecture - Docker Context Selector
# Replaces the old k8s-context-selector.sh for Docker Compose environment
# Author: Jaime Henao
# Date: 2026-01-06

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="infrastructure/docker/docker-compose.yml"
SERVICES=("postgres" "redis")

# Functions
print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  TRII Clean Architecture - Docker Context${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_usage() {
    echo -e "${CYAN}Usage: $0 [COMMAND]${NC}"
    echo ""
    echo "Commands:"
    echo "  status    - Show Docker services status"
    echo "  start     - Start all Docker services"
    echo "  stop      - Stop all Docker services"
    echo "  restart   - Restart all Docker services"
    echo "  logs      - Show logs from all services"
    echo "  psql      - Connect to PostgreSQL database"
    echo "  redis     - Connect to Redis CLI"
    echo "  health    - Check services health"
    echo "  clean     - Remove all containers and volumes"
    echo "  help      - Show this help message"
    echo ""
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed or not in PATH${NC}"
        exit 1
    fi
}

check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}❌ Docker Compose file not found: $COMPOSE_FILE${NC}"
        echo -e "${YELLOW}💡 Make sure you're in the project root directory${NC}"
        exit 1
    fi
}

show_status() {
    echo -e "${CYAN}📊 Docker Services Status:${NC}"
    echo ""

    if docker-compose ps 2>/dev/null; then
        echo ""
    else
        echo -e "${YELLOW}⚠️  No services running${NC}"
        echo ""
        echo -e "${GREEN}💡 Use '$0 start' to start the services${NC}"
    fi
}

start_services() {
    echo -e "${GREEN}🚀 Starting TRII services...${NC}"

    # Copy compose file to root if not there
    if [ ! -f "docker-compose.yml" ]; then
        cp "$COMPOSE_FILE" .
    fi

    docker-compose up -d

    echo ""
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    echo -e "${CYAN}📊 Checking services health...${NC}"

    # Wait a bit and check health
    sleep 10
    health_check
}

stop_services() {
    echo -e "${YELLOW}🛑 Stopping TRII services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped!${NC}"
}

restart_services() {
    echo -e "${PURPLE}🔄 Restarting TRII services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Services restarted!${NC}"
}

show_logs() {
    echo -e "${CYAN}📋 Docker Services Logs:${NC}"
    echo ""
    docker-compose logs -f --tail=100
}

connect_psql() {
    echo -e "${CYAN}🐘 Connecting to PostgreSQL...${NC}"
    echo -e "${YELLOW}💡 Use '\q' to exit${NC}"
    echo ""

    # Check if container is running
    if ! docker ps | grep -q trii-postgres; then
        echo -e "${RED}❌ PostgreSQL container is not running${NC}"
        echo -e "${GREEN}💡 Use '$0 start' to start the services${NC}"
        exit 1
    fi

    docker exec -it trii-postgres psql -U postgres -d trii
}

connect_redis() {
    echo -e "${CYAN}🔴 Connecting to Redis CLI...${NC}"
    echo -e "${YELLOW}💡 Use 'quit' to exit${NC}"
    echo ""

    # Check if container is running
    if ! docker ps | grep -q trii-redis; then
        echo -e "${RED}❌ Redis container is not running${NC}"
        echo -e "${GREEN}💡 Use '$0 start' to start the services${NC}"
        exit 1
    fi

    docker exec -it trii-redis redis-cli -a trii_redis_pass
}

health_check() {
    echo -e "${CYAN}🏥 Health Check:${NC}"
    echo ""

    # Check PostgreSQL
    if docker ps | grep -q trii-postgres; then
        if docker exec trii-postgres pg_isready -U postgres -d trii &>/dev/null; then
            echo -e "${GREEN}✅ PostgreSQL: Healthy${NC}"
        else
            echo -e "${RED}❌ PostgreSQL: Unhealthy${NC}"
        fi
    else
        echo -e "${RED}❌ PostgreSQL: Not running${NC}"
    fi

    # Check Redis
    if docker ps | grep -q trii-redis; then
        if docker exec trii-redis redis-cli ping &>/dev/null; then
            echo -e "${GREEN}✅ Redis: Healthy${NC}"
        else
            echo -e "${RED}❌ Redis: Unhealthy${NC}"
        fi
    else
        echo -e "${RED}❌ Redis: Not running${NC}"
    fi

    echo ""
}

clean_containers() {
    echo -e "${RED}🧹 Cleaning Docker containers and volumes...${NC}"
    echo -e "${YELLOW}⚠️  This will remove all data!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        echo -e "${GREEN}✅ Clean completed!${NC}"
    else
        echo -e "${YELLOW}❌ Clean cancelled${NC}"
    fi
}

# Main script
main() {
    check_docker
    check_compose_file

    case "${1:-help}" in
        "status")
            print_header
            show_status
            ;;
        "start")
            print_header
            start_services
            ;;
        "stop")
            print_header
            stop_services
            ;;
        "restart")
            print_header
            restart_services
            ;;
        "logs")
            print_header
            show_logs
            ;;
        "psql")
            print_header
            connect_psql
            ;;
        "redis")
            print_header
            connect_redis
            ;;
        "health")
            print_header
            health_check
            ;;
        "clean")
            print_header
            clean_containers
            ;;
        "help"|*)
            print_header
            print_usage
            ;;
    esac
}

main "$@"
