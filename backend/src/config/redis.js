import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Redis Client — Production-grade configuration.
 * 
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Connection pooling via ioredis
 * - Graceful error handling (app works without Redis, just slower)
 * - Key prefix to avoid collisions
 */
const redisConfig = {
  host: env.REDIS_HOST || '127.0.0.1',
  port: parseInt(env.REDIS_PORT || '6379', 10),
  password: env.REDIS_PASSWORD || undefined,
  db: parseInt(env.REDIS_DB || '0', 10),
  keyPrefix: 'salon360:',
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 10) {
      logger.error('Redis: Max reconnection attempts reached. Giving up.');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 5000);
    logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ['READONLY', 'ECONNRESET'];
    return targetErrors.some((e) => err.message.includes(e));
  },
  lazyConnect: true, // Don't connect immediately, wait for first command
};

// Parse REDIS_URL if provided (for cloud Redis like Upstash, Railway, etc.)
let redis;
if (env.REDIS_URL) {
  const isTls = env.REDIS_URL.startsWith('rediss://');
  redis = new Redis(env.REDIS_URL, {
    keyPrefix: 'salon360:',
    maxRetriesPerRequest: 3,
    retryStrategy: redisConfig.retryStrategy,
    lazyConnect: true,
    family: 0, // Enable both IPv4 and IPv6 for cloud providers
  });
} else {
  redis = new Redis(redisConfig);
}

// Track connection state
let isConnected = false;

redis.on('connect', () => {
  isConnected = true;
  logger.info('✅ Redis connected successfully');
});

redis.on('ready', () => {
  isConnected = true;
  logger.info('✅ Redis ready to accept commands');
});

redis.on('error', (err) => {
  isConnected = false;
  logger.error(`❌ Redis error: ${err.message}`);
});

redis.on('close', () => {
  isConnected = false;
  logger.warn('⚠️  Redis connection closed');
});

/**
 * Connect to Redis. Called during server startup.
 * If Redis is unavailable, the app continues with degraded performance.
 */
export async function connectRedis() {
  try {
    await redis.connect();
    await redis.ping();
    logger.info('✅ Redis PING successful');
  } catch (err) {
    logger.error(`❌ Redis connection failed: ${err.message}. App will run without Redis (degraded mode).`);
  }
}

/**
 * Disconnect Redis gracefully. Called during server shutdown.
 */
export async function disconnectRedis() {
  try {
    if (isConnected) {
      await redis.quit();
      logger.info('Redis disconnected gracefully');
    }
  } catch (err) {
    logger.error(`Redis disconnect error: ${err.message}`);
  }
}

/**
 * Check if Redis is currently available.
 */
export function isRedisAvailable() {
  return isConnected;
}

export { redis };
export default redis;
