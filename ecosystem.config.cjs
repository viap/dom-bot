/* eslint-disable no-undef */
module.exports = {
  apps: [
    {
      name: "domBot",
      script: "./dist/index.js",
      node_args:
        "--experimental-specifier-resolution=node --experimental-loader=extensionless",
      instances: 1,
      exec_mode: "fork",
      env: {
        // Set PATH to include NVM Node.js location - fixes "node not found" error in PM2
        // NODE_BIN_DIR is injected at deploy time by post_sync_start.sh (e.g. via `dirname $(which node)`)
        // Falls back to hardcoded NVM path for manual PM2 restarts outside of deploy scripts
        PATH: `${process.env.NODE_BIN_DIR || "/root/.nvm/versions/node/v20.18.1/bin"}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin`,
      },
      // Restart settings
      max_restarts: 5,
      min_uptime: "10s",
      max_memory_restart: "512M",
      // Logging
      log_file: "./logs/domBot.log",
      out_file: "./logs/domBot-out.log",
      error_file: "./logs/domBot-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Graceful shutdown
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 10000,
      // Health check
      health_check_grace_period: 3000,
    },
  ],
}
