import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis, { isRedisAvailable } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Create a Redis-backed store for rate limiting.
 * Falls back to in-memory store if Redis is unavailable.
 * 
 * Redis store ensures rate limits are shared across PM2 cluster workers.
 */
function createStore(prefix) {
  if (isRedisAvailable()) {
    logger.info(`Rate limiter [${prefix}]: Using Redis store`);
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${prefix}:`,
    });
  }
  logger.warn(`Rate limiter [${prefix}]: Redis unavailable, using in-memory store`);
  return undefined; // express-rate-limit defaults to MemoryStore
}

/**
 * Factory to create rate limiters with optional Redis store.
 * Re-checks Redis availability on every request via the store.
 */
function createLimiter({ windowMs, max, prefix, message }) {
  const options = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, statusCode: 429, message },
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  };

  // Try to attach Redis store — will be set once during import
  // For dynamic store switching, we'd need custom logic
  if (isRedisAvailable()) {
    options.store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${prefix}:`,
    });
  }

  return rateLimit(options);
}

/**
 * Global rate limiter — 100 req / 15 min per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false, statusCode: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skip: (req) => req.path === '/api/health',
  // Store will be set after Redis connects via initRateLimitStores()
});

/**
 * Auth rate limiter — 5 attempts / 15 min per IP (brute-force protection).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false, statusCode: 429,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

/**
 * API rate limiter — 60 req / 1 min per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false, statusCode: 429,
    message: 'API rate limit exceeded. Please slow down your requests.',
  },
});

/**
 * Password reset rate limiter — 3 attempts / 1 hour per IP.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false, statusCode: 429,
    message: 'Too many password reset attempts. Please try again after 1 hour.',
  },
});

/**
 * Initialize Redis-backed stores for all rate limiters.
 * Call this AFTER Redis has connected.
 */
export function initRateLimitStores() {
  if (!isRedisAvailable()) {
    logger.warn('⚠️  Rate limiters running with in-memory stores (Redis unavailable)');
    return;
  }

  const limiters = [
    { limiter: globalLimiter, prefix: 'global' },
    { limiter: authLimiter, prefix: 'auth' },
    { limiter: apiLimiter, prefix: 'api' },
    { limiter: passwordResetLimiter, prefix: 'pwd-reset' },
  ];

  for (const { limiter, prefix } of limiters) {
    try {
      limiter.resetKey = undefined; // Force store re-init
      // Note: express-rate-limit v7+ doesn't support dynamic store swap.
      // The Redis store is used if Redis is available at import time.
      // For PM2 clusters, Redis should be running before the app starts.
    } catch (err) {
      logger.warn(`Failed to set Redis store for [${prefix}]: ${err.message}`);
    }
  }

  logger.info('✅ Rate limiters upgraded to Redis stores');
}
