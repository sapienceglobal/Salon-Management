import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { testConnection, closeConnection } from './config/database.js';
import { verifyMailConnection } from './config/mailer.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initRateLimitStores } from './middlewares/rateLimiter.js';
import { initSocket } from './config/socket.js';

/**
 * Bootstrap the server.
 * 1. Test database connection
 * 2. Verify mail server (non-blocking)
 * 3. Start HTTP server
 * 4. Register graceful shutdown handlers
 */
async function startServer() {
  try {
    // Test database connectivity
    await testConnection();

    // Auto-run latest migrations
    try {
      const { db } = await import('./config/database.js');
      await db.migrate.latest();
      logger.info('Database migrations verified and up to date');
    } catch (migErr) {
      logger.warn(`Auto-migration note: ${migErr.message}`);
    }

    // Connect Redis (non-blocking — app works in degraded mode without Redis)
    await connectRedis();
    initRateLimitStores();

    // Verify SMTP connection (non-blocking — server starts even if mail fails)
    verifyMailConnection().catch(() => {
      logger.warn('Mail server verification failed — emails may not work');
    });

    // Start listening
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info('══════════════════════════════════════════════════');
      logger.info(`  🚀 Salon API Server Started`);
      logger.info(`  📍 URL: ${env.SERVER_URL}`);
      logger.info(`  🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`  📦 API Version: ${env.API_VERSION}`);
      logger.info(`  🔗 Health Check: ${env.SERVER_URL}/api/health`);
      logger.info('══════════════════════════════════════════════════');
    });

    // Initialize WebSockets
    initSocket(server);

    // Set server timeouts for production
    server.keepAliveTimeout = 65000; // Must be > load balancer's idle timeout
    server.headersTimeout = 66000; // Must be > keepAliveTimeout
    server.requestTimeout = 30000; // 30 second request timeout

    // ===================================================================
    // GRACEFUL SHUTDOWN
    // ===================================================================

    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed — no new connections');

        try {
          // Close Redis and database pool
          await disconnectRedis();
          await closeConnection();
          logger.info('All connections closed. Exiting process.');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('UNCAUGHT EXCEPTION:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
