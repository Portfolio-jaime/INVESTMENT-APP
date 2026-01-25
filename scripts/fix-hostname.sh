#!/bin/bash

echo "=== Fixing Hostname Configuration for postgres.trii.local ==="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Backup /etc/hosts
print_status "Backing up /etc/hosts..."
sudo cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)

# Remove existing entries
print_status "Removing existing postgres.trii.local entries..."
sudo sed -i '' '/postgres\.trii\.local/d' /etc/hosts 2>/dev/null || sudo sed -i '/postgres\.trii\.local/d' /etc/hosts

# Add new entry
print_status "Adding new postgres.trii.local entry..."
echo "127.0.0.1 postgres.trii.local" | sudo tee -a /etc/hosts

# Verify
if grep -q "postgres.trii.local" /etc/hosts; then
    print_success "Successfully added postgres.trii.local to /etc/hosts"
    grep "postgres.trii.local" /etc/hosts
else
    print_error "Failed to add postgres.trii.local to /etc/hosts"
    exit 1
fi

print_success "Hostname fix completed!"
