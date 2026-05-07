#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

require_env \
  TOKEN \
  MONGO_DB_URL \
  MONGO_DB_NAME \
  MONGO_DB_USER \
  MONGO_DB_PASSWORD \
  API_URL \
  API_WEBSOCKET_URL \
  API_CLIENT_NAME \
  API_CLIENT_PASSWORD \
  POLING_DELAY \
  REMOTE_TARGET \
  NODE_BIN_DIR

cd "${REMOTE_TARGET}"

echo "Creating logs directory..."
mkdir -p logs

echo "Installing dependencies..."
npm ci --omit=dev

echo "Starting application with PM2..."
pm2 delete domBot 2>/dev/null || true
NODE_BIN_DIR="${NODE_BIN_DIR}" pm2 start ecosystem.config.cjs
pm2 status

if ! pm2_wait_online "domBot"; then
  echo "Checking application logs..."
  pm2 logs domBot --lines 20 --nostream
  echo "Checking process status..."
  pm2 status
  exit 1
fi

echo "Deployment completed successfully"
