/**
 * PM2 Ecosystem Configuration
 * Production-grade process management with cluster mode.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 */
export default {
  apps: [
    {
      name: 'salon360-api',
      script: './src/server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing
      autorestart: true,
      watch: false, // Don't watch files in production
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 30000, // 30s to complete graceful shutdown
      listen_timeout: 10000, // 10s for new instance to start
      shutdown_with_message: true,
    },
  ],
};
