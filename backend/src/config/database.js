import knex from 'knex';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Knex.js MySQL connection with production-grade pool configuration.
 * Uses mysql2 driver for better performance and prepared statement support.
 */
const db = knex({
  client: 'mysql2',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+05:30',
    // Security: prevent multiple SQL statements in one query
    multipleStatements: false,
    // Convert BIGINT to string to prevent JS precision loss
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Date handling
    dateStrings: true,
    typeCast: function (field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1'; // Convert TINYINT(1) to boolean
      }
      return next();
    },
  },
  pool: {
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
    // Close idle connections after 30 seconds
    idleTimeoutMillis: 30000,
    // Max time to wait for a connection from pool
    acquireTimeoutMillis: 60000,
    // Validate connection before use
    afterCreate: (conn, done) => {
      conn.query('SELECT 1', (err) => {
        if (err) {
          logger.error('Database connection validation failed:', err);
          done(err, conn);
        } else {
          done(null, conn);
        }
      });
    },
  },
  // Knex migrations
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
  // Enable debug logging in development
  debug: env.NODE_ENV === 'development',
  log: {
    warn(message) {
      logger.warn('[Knex Warning]', message);
    },
    error(message) {
      logger.error('[Knex Error]', message);
    },
    deprecate(message) {
      logger.warn('[Knex Deprecation]', message);
    },
    debug(message) {
      if (env.NODE_ENV === 'development') {
        logger.debug('[Knex Query]', message);
      }
    },
  },
});

/**
 * Test database connection on startup.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    await db.raw('SELECT 1+1 AS result');
    logger.info(`✅ Database connected successfully (${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME})`);
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Gracefully close database connection pool.
 * @returns {Promise<void>}
 */
async function closeConnection() {
  try {
    await db.destroy();
    logger.info('Database connection pool closed');
  } catch (error) {
    logger.error('Error closing database connection:', error.message);
  }
}

export { db, testConnection, closeConnection };
