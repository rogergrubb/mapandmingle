#!/bin/bash

# Map Mingle - Local Development Setup Script
# Run this script to get started with local development

set -e

echo "🗺️  Map Mingle - Local Development Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is required but not installed.${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 found${NC}"
        return 0
    fi
}

echo "Checking required tools..."
check_command node || exit 1
check_command npm || exit 1
check_command docker || echo -e "${YELLOW}⚠️  Docker not found - you'll need to set up PostgreSQL manually${NC}"

echo ""
echo "Step 1: Installing dependencies..."
echo "-----------------------------------"
npm install

echo ""
echo "Step 2: Setting up backend..."
echo "-----------------------------"
cd apps/backend

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit apps/backend/.env with your settings${NC}"
fi

npm install

echo ""
echo "Step 3: Setting up mobile app..."
echo "---------------------------------"
cd ../mobile
npm install

echo ""
echo "Step 4: Database setup..."
echo "-------------------------"
cd ../..

if command -v docker &> /dev/null; then
    echo "Starting PostgreSQL with Docker..."
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    cd apps/backend
    echo "Running database migrations..."
    npx prisma migrate dev --name init
    
    echo "Seeding database..."
    npm run db:seed
    
    cd ../..
else
    echo -e "${YELLOW}⚠️  Docker not available. Please set up PostgreSQL manually:${NC}"
    echo "   1. Install PostgreSQL"
    echo "   2. Create a database named 'mapmingle'"
    echo "   3. Update DATABASE_URL in apps/backend/.env"
    echo "   4. Run: cd apps/backend && npx prisma migrate dev"
fi

echo ""
echo "========================================="
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo "========================================="
echo ""
echo "To start development:"
echo ""
echo "  Backend (Terminal 1):"
echo "    cd apps/backend && npm run dev"
echo ""
echo "  Mobile (Terminal 2):"
echo "    cd apps/mobile && npx expo start"
echo ""
echo "Test accounts (after seeding):"
echo "  Email: alice@test.com"
echo "  Password: password123"
echo ""
echo "API will be available at: http://localhost:3000"
echo "Prisma Studio: cd apps/backend && npx prisma studio"
echo ""
