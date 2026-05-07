#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"

require_env REMOTE_TARGET

LATEST_BACKUP="$(ls -dt "${REMOTE_TARGET}"_backup_* 2>/dev/null | head -n 1)"

if [ -z "${LATEST_BACKUP}" ]; then
  echo "No backup found for rollback"
  exit 1
fi

echo "Rolling back to: ${LATEST_BACKUP}"

echo "Stopping current application..."
pm2 stop domBot 2>/dev/null || true
pm2 delete domBot 2>/dev/null || true

echo "Restoring from backup..."
rm -rf "${REMOTE_TARGET}"
cp -r "${LATEST_BACKUP}" "${REMOTE_TARGET}"

cd "${REMOTE_TARGET}"

echo "Installing dependencies..."
npm ci --omit=dev

echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs
pm2 status

if ! pm2_wait_online "domBot"; then
  echo "Checking application logs..."
  pm2 logs domBot --lines 20 --nostream
  echo "Checking process status..."
  pm2 status
  exit 1
fi

echo "Rollback completed successfully"
