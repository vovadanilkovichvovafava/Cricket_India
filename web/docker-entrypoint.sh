#!/bin/sh
# Inject runtime env vars into config.js before starting nginx
# This script is placed in /docker-entrypoint.d/ and runs automatically

CONFIG_FILE="/usr/share/nginx/html/config.js"

# PUBLIC_API_URL — public backend URL (use this to avoid Coolify overriding BACKEND_URL)
# Fallback chain: PUBLIC_API_URL → BACKEND_URL → empty
BACKEND="${PUBLIC_API_URL:-${BACKEND_URL:-}}"
API_URL="${BACKEND:+${BACKEND}/api/v1}"

cat > "$CONFIG_FILE" <<EOF
window.__APP_CONFIG__ = {
  API_URL: '${API_URL:-}',
  CRICKET_API_KEY: '${CRICKET_API_KEY:-}',
  ODDS_API_KEY: '${ODDS_API_KEY:-}',
  GEO_SERVER_URL: '${GEO_SERVER_URL:-}',
  TRACKING_API: '${TRACKING_API:-}',
  OFFER_URL: '${OFFER_URL:-}',
  BOOKMAKER_NAME: '${BOOKMAKER_NAME:-}',
  BOOKMAKER_LINK: '${BOOKMAKER_LINK:-}',
  BOOKMAKER_BONUS: '${BOOKMAKER_BONUS:-}',
};
EOF

echo "Config injected: API_URL=${API_URL:-[not set]}"
