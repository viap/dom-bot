#!/usr/bin/env bash
set -euo pipefail

# Activate the Node major from .nvmrc (via NVM when present) and fail before any
# PM2 change otherwise. fifsky/ssh-action does not source ~/.bashrc or
# ~/.nvm/nvm.sh, so without this `command -v node` resolves to the system node.
# PM2 starts apps with the first `node` in the saved PATH, so this also picks
# the runtime Node of every process started or restarted with --update-env.
NODE_MAJOR="$(cat "$(dirname "${BASH_SOURCE[0]}")/../../.nvmrc")"

use_node() {
  export NVM_DIR="${NVM_DIR:-/root/.nvm}"
  if [ -s "${NVM_DIR}/nvm.sh" ]; then
    # shellcheck source=/dev/null
    source "${NVM_DIR}/nvm.sh" --no-use
    # A system-wide Node of the right major is fine too; the check below decides.
    nvm use "${NODE_MAJOR}" --silent || true
  fi
  local v
  v="$(node --version)"
  echo "Using Node.js: ${v} at $(dirname "$(command -v node)")"
  [[ "${v}" == "v${NODE_MAJOR}."* ]] || { echo "ERROR: Node.js ${NODE_MAJOR} required. Got: ${v}"; exit 1; }
}

# Persist the PM2 process list for reboots. The apps are already up and
# checked at this point, so a failure here must not fail (and roll back) them.
pm2_save() {
  pm2 save || echo "WARNING: pm2 save failed; the process list will not survive a reboot"
}

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
