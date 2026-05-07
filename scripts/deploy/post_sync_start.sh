#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

# Initialize NVM so the correct Node version is active in this SSH session.
# fifsky/ssh-action does not source ~/.bashrc or ~/.nvm/nvm.sh, so without this
# `command -v node` resolves to the system node (v18) instead of NVM node (v20).
if [ -s "/root/.nvm/nvm.sh" ]; then
  export NVM_DIR="/root/.nvm"
  # shellcheck source=/dev/null
  source "${NVM_DIR}/nvm.sh" --no-use
  nvm use 20 --silent || true
fi

export NODE_BIN_DIR="$(dirname "$(command -v node)")"
echo "Using Node.js: $(node --version) at ${NODE_BIN_DIR}"

NODE_MAJOR="$(node --version | sed 's/v\([0-9]*\).*/\1/')"
if [ "${NODE_MAJOR}" -lt 20 ]; then
  echo "ERROR: Node.js v20+ required. Got: $(node --version)"
  exit 1
fi

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
  REMOTE_TARGET

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
