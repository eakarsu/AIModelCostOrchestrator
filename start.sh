#!/bin/bash

# ============================================================
# AI Model Cost Orchestrator - Start Script
# ============================================================
# This script will:
# 1. Clean up used ports (3000, 3001)
# 2. Check/start PostgreSQL
# 3. Create database and user if needed
# 4. Install dependencies
# 5. Seed the database
# 6. Start backend and frontend with hot-reload
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}${CYAN}🚀 AI Model Cost Orchestrator${NC}                           ${PURPLE}║${NC}"
echo -e "${PURPLE}║${NC}  ${BOLD}Reduce AI infrastructure costs by 30-60%${NC}                ${PURPLE}║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✓${NC} Loaded .env configuration"
else
    echo -e "${RED}✗${NC} .env file not found! Please create one."
    exit 1
fi

# ============================================================
# Step 1: Kill processes on ports 3000 and 3001
# ============================================================
echo ""
echo -e "${YELLOW}[1/6]${NC} ${BOLD}Cleaning up ports...${NC}"

kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "  ${YELLOW}→${NC} Killing processes on port $port (PIDs: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "  ${GREEN}✓${NC} Port $port cleared"
    else
        echo -e "  ${GREEN}✓${NC} Port $port is available"
    fi
}

kill_port 3000
kill_port 3001

# ============================================================
# Step 2: Check PostgreSQL
# ============================================================
echo ""
echo -e "${YELLOW}[2/6]${NC} ${BOLD}Checking PostgreSQL...${NC}"

# Check if PostgreSQL is running
if command -v pg_isready &> /dev/null; then
    if pg_isready -q 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL is running"
    else
        echo -e "  ${YELLOW}→${NC} Starting PostgreSQL..."
        if command -v brew &> /dev/null; then
            brew services start postgresql@14 2>/dev/null || \
            brew services start postgresql@15 2>/dev/null || \
            brew services start postgresql@16 2>/dev/null || \
            brew services start postgresql 2>/dev/null || true
        fi
        sleep 2
        if pg_isready -q 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} PostgreSQL started"
        else
            echo -e "  ${RED}✗${NC} Could not start PostgreSQL. Please start it manually."
            exit 1
        fi
    fi
else
    echo -e "  ${YELLOW}⚠${NC} pg_isready not found, assuming PostgreSQL is running"
fi

# ============================================================
# Step 3: Create database and user
# ============================================================
echo ""
echo -e "${YELLOW}[3/6]${NC} ${BOLD}Setting up database...${NC}"

# Create user if not exists
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='aiorch_user'" 2>/dev/null | grep -q 1 || \
    psql -U postgres -c "CREATE USER aiorch_user WITH PASSWORD 'aiorch_pass' CREATEDB;" 2>/dev/null || \
    echo -e "  ${YELLOW}⚠${NC} Could not create user (may already exist or requires different postgres setup)"

# Create database if not exists
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='ai_cost_orchestrator'" 2>/dev/null | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE ai_cost_orchestrator OWNER aiorch_user;" 2>/dev/null || \
    echo -e "  ${YELLOW}⚠${NC} Could not create database (may already exist)"

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ai_cost_orchestrator TO aiorch_user;" 2>/dev/null || true
psql -U postgres -d ai_cost_orchestrator -c "GRANT ALL ON SCHEMA public TO aiorch_user;" 2>/dev/null || true
psql -U postgres -d ai_cost_orchestrator -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aiorch_user;" 2>/dev/null || true

echo -e "  ${GREEN}✓${NC} Database 'ai_cost_orchestrator' ready"

# ============================================================
# Step 4: Install dependencies
# ============================================================
echo ""
echo -e "${YELLOW}[4/6]${NC} ${BOLD}Installing dependencies...${NC}"

echo -e "  ${CYAN}→${NC} Installing server dependencies..."
npm install --silent 2>&1 | tail -1 || npm install 2>&1 | tail -3

echo -e "  ${CYAN}→${NC} Installing client dependencies..."
cd client && npm install --silent 2>&1 | tail -1 || npm install 2>&1 | tail -3
cd "$PROJECT_DIR"

echo -e "  ${GREEN}✓${NC} All dependencies installed"

# ============================================================
# Step 5: Seed the database
# ============================================================
echo ""
echo -e "${YELLOW}[5/6]${NC} ${BOLD}Seeding database...${NC}"

node server/seed.js
echo -e "  ${GREEN}✓${NC} Database seeded with sample data"

# ============================================================
# Step 6: Start the application with hot-reload
# ============================================================
echo ""
echo -e "${YELLOW}[6/6]${NC} ${BOLD}Starting application...${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Application is starting!${NC}                                ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}Frontend:${NC}  http://localhost:3000                        ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${CYAN}Backend:${NC}   http://localhost:3001                        ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}Login:${NC}     admin@aiorchestrator.com / admin123          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}           (or click 'Quick Demo Login' button)            ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${PURPLE}Hot-reload enabled:${NC} Changes auto-refresh!               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Press ${RED}Ctrl+C${NC} to stop all services                        ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start with concurrently (nodemon for backend hot-reload, vite for frontend HMR)
npx concurrently \
    --names "SERVER,CLIENT" \
    --prefix-colors "blue,magenta" \
    --kill-others \
    "npx nodemon --watch server server/server.js" \
    "cd client && npx vite --host"
