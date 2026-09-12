import redis, { isRedisAvailable } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * Cache Utility — Redis-backed caching with automatic fallback.
 * 
 * If Redis is down, operations silently fail (no cache = direct DB queries).
 * All keys are auto-prefixed with 'salon360:' by the Redis client.
 */
class CacheService {
  /**
   * Get a cached value.
   * @param {string} key - Cache key
   * @returns {any|null} Parsed value or null
   */
  async get(key) {
    if (!isRedisAvailable()) return null;
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.warn(`Cache GET error [${key}]: ${err.message}`);
      return null;
    }
  }

  /**
   * Set a cached value with TTL.
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds (default: 60)
   */
  async set(key, value, ttl = 60) {
    if (!isRedisAvailable()) return;
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
      logger.warn(`Cache SET error [${key}]: ${err.message}`);
    }
  }

  /**
   * Delete a specific cache key.
   */
  async del(key) {
    if (!isRedisAvailable()) return;
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn(`Cache DEL error [${key}]: ${err.message}`);
    }
  }

  /**
   * Delete all keys matching a pattern.
   * Useful for invalidating all cache for a business.
   * @param {string} pattern - e.g., 'dashboard:5:*'
   */
  async delPattern(pattern) {
    if (!isRedisAvailable()) return;
    try {
      // Use SCAN to avoid blocking Redis
      let cursor = '0';
      const fullPattern = `salon360:${pattern}`;
      do {
        const [newCursor, keys] = await redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100);
        cursor = newCursor;
        if (keys.length > 0) {
          // Remove prefix because redis client adds it back
          const unprefixedKeys = keys.map((k) => k.replace('salon360:', ''));
          await redis.del(...unprefixedKeys);
        }
      } while (cursor !== '0');
    } catch (err) {
      logger.warn(`Cache DEL PATTERN error [${pattern}]: ${err.message}`);
    }
  }

  /**
   * Get-or-Set pattern — fetch from cache, or compute and cache.
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Async function to compute the value
   * @param {number} ttl - TTL in seconds
   */
  async getOrSet(key, fetchFn, ttl = 60) {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }
}

export const cache = new CacheService();
