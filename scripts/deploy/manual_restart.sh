#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

echo "Loading environment from ${APP_ROOT}/config/.env..."
set -a
# shellcheck source=../../config/.env
source "${APP_ROOT}/config/.env"
set +a

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
  POLING_DELAY

cd "${APP_ROOT}"

echo "Restarting domBot with updated environment..."
pm2 restart domBot --update-env
pm2 status

if ! pm2_wait_online "domBot"; then
  echo "Checking application logs..."
  pm2 logs domBot --lines 20 --nostream
  echo "Checking process status..."
  pm2 status
  exit 1
fi

echo "Manual restart completed successfully"
