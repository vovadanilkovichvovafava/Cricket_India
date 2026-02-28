#!/bin/bash
# 🏏 Cricket Bet Analyzer — Full Dev Environment
# Remote Control + Cloudflare Tunnel + Vite + FastAPI

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

PIDS=()
cleanup() {
  echo -e "\n${RED}Shutting down...${NC}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null
  done
  exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${BOLD}🏏 Cricket Bet Analyzer — Dev Environment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Frontend (Vite)
echo -e "${GREEN}[1/4] Starting frontend (Vite)...${NC}"
cd "$(dirname "$0")/web"
npm run dev &
PIDS+=($!)
sleep 3
echo -e "  ✅ Frontend: ${BOLD}http://localhost:5173${NC}"

# 2. Backend (FastAPI)
echo -e "${GREEN}[2/4] Starting backend (FastAPI)...${NC}"
cd ../backend
if [ -d "venv" ]; then
  source venv/bin/activate
fi
uvicorn app.main:app --reload --port 8000 &
PIDS+=($!)
sleep 2
echo -e "  ✅ Backend:  ${BOLD}http://localhost:8000${NC}"

# 3. Cloudflare Tunnel
echo -e "${BLUE}[3/4] Starting Cloudflare Tunnel...${NC}"
if command -v cloudflared &> /dev/null; then
  cloudflared tunnel --url http://localhost:5173 2>&1 | grep -o 'https://[^ ]*\.trycloudflare\.com' | head -1 | while read url; do
    echo -e "  ✅ Public URL: ${BOLD}${url}${NC}"
    echo -e "  📱 Open this URL on your phone to preview!"
  done &
  PIDS+=($!)
  sleep 6
else
  echo -e "  ${YELLOW}⚠️  cloudflared not found. Install: brew install cloudflared${NC}"
  echo -e "  ${YELLOW}   Skipping tunnel — use localhost only${NC}"
fi

# 4. Claude Code Remote Control
echo ""
echo -e "${YELLOW}[4/4] Starting Claude Code Remote Control...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📱 Scan QR code with your phone to connect!${NC}"
echo ""
cd "$(dirname "$0")"

# Check if claude is available
if command -v claude &> /dev/null; then
  claude remote-control
else
  echo -e "${RED}Claude Code CLI not found.${NC}"
  echo -e "Install: ${BOLD}npm install -g @anthropic-ai/claude-code${NC}"
  echo ""
  echo "Press Ctrl+C to stop all services."
  wait
fi
