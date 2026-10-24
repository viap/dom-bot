/* eslint-disable no-undef */
module.exports = {
  apps: [
    {
      name: "domBot",
      script: "./dist/index.js",
      node_args: "--import=extensionless/register",
      instances: 1,
      exec_mode: "fork",
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
