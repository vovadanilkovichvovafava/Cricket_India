#!/bin/sh
# Inject runtime env vars into config.js before starting nginx

CONFIG_FILE="/usr/share/nginx/html/config.js"

# BACKEND_URL from Coolify (e.g. https://cricket-india-iwrb4s.saturn.ac)
API_URL="${BACKEND_URL:+${BACKEND_URL}/api/v1}"

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

exec nginx -g 'daemon off;'
