#!/usr/bin/env bash
set -euo pipefail

require_env() {
  local var_name
  for var_name in "$@"; do
    if [ -z "${!var_name:-}" ]; then
      echo "${var_name} missing"
      exit 1
    fi
  done
}

pm2_wait_online() {
  local name="${1}"
  local max_attempts=20
  local attempt

  echo "Waiting for ${name} to come online..."
  for attempt in $(seq 1 "${max_attempts}"); do
    if pm2 describe "${name}" 2>/dev/null | grep -q "online"; then
      echo "${name} is online (attempt ${attempt})"
      return 0
    fi
    echo "Attempt ${attempt}/${max_attempts}: ${name} not yet online, retrying in 3s..."
    sleep 3
  done

  echo "${name} failed to come online after ${max_attempts} attempts"
  return 1
}
