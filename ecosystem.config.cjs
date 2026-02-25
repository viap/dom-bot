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
        NODE_ENV: "production",
        // Set PATH to include NVM Node.js location - fixes "node not found" error in PM2
        // System PATH: /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
        // NVM PATH: /root/.nvm/versions/node/v20.18.1/bin
        PATH: "/root/.nvm/versions/node/v20.18.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin",
      },
      // Restart settings
      max_restarts: 5,
      min_uptime: "10s",
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
