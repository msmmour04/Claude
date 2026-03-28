#!/bin/bash

# Net Worth Tracker - Startup Script
# ==============================================

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║      Net Worth Tracker               ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "  ERROR: Node.js is not installed."
  echo "  Install from https://nodejs.org/ (v18+ recommended)"
  exit 1
fi

NODE_VERSION=$(node -v)
echo "  Node.js: $NODE_VERSION"

# Check for npm
if ! command -v npm &> /dev/null; then
  echo "  ERROR: npm is not installed."
  exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
  echo ""
  echo "  Installing dependencies..."
  npm install
  echo ""
fi

# Check for server .env
if [ ! -f "server/.env" ]; then
  echo "  NOTE: server/.env not found."
  echo "  Copying server/.env.example to server/.env"
  echo "  Edit server/.env with your API credentials before using live data."
  echo ""
  cp server/.env.example server/.env
fi

echo "  Starting servers:"
echo ""
echo "   Backend  →  http://localhost:3001"
echo "   Frontend →  http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop"
echo ""
echo "  ─────────────────────────────────────────"
echo ""

# Run both servers with concurrently
npm run dev
