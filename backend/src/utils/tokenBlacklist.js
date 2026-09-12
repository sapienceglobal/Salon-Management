import redis, { isRedisAvailable } from '../config/redis.js';
import { db } from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * JWT Token Blacklist — Redis-backed with DB fallback.
 * 
 * When a user logs out or a refresh token is revoked, the token's JTI (JWT ID)
 * is added to the blacklist. On every authenticated request, we check if the
 * token is blacklisted.
 * 
 * Redis: O(1) lookup, auto-expires with TTL matching token expiry.
 * DB fallback: Query `refresh_tokens` table if Redis is down.
 */

const BLACKLIST_PREFIX = 'blacklist:';

/**
 * Add a token to the blacklist.
 * @param {string} jti - JWT ID or token identifier
 * @param {number} expiresInSeconds - TTL matching the token's remaining lifetime
 */
export async function blacklistToken(jti, expiresInSeconds = 900) {
  if (!jti) return;

  // Always mark in DB
  try {
    await db('refresh_tokens')
      .where('token', jti)
      .update({ is_revoked: true, revoked_at: db.fn.now() });
  } catch (err) {
    logger.warn(`Blacklist DB update failed: ${err.message}`);
  }

  // Also add to Redis for fast lookups
  if (isRedisAvailable()) {
    try {
      await redis.setex(`${BLACKLIST_PREFIX}${jti}`, expiresInSeconds, '1');
    } catch (err) {
      logger.warn(`Blacklist Redis SET failed: ${err.message}`);
    }
  }
}

/**
 * Check if a token is blacklisted.
 * @param {string} jti - JWT ID or token identifier
 * @returns {boolean} true if blacklisted
 */
export async function isTokenBlacklisted(jti) {
  if (!jti) return false;

  // Try Redis first (fast path)
  if (isRedisAvailable()) {
    try {
      const exists = await redis.exists(`${BLACKLIST_PREFIX}${jti}`);
      return exists === 1;
    } catch (err) {
      logger.warn(`Blacklist Redis check failed: ${err.message}`);
      // Fall through to DB
    }
  }

  // DB fallback
  try {
    const token = await db('refresh_tokens')
      .where({ token: jti, is_revoked: true })
      .first();
    return !!token;
  } catch (err) {
    logger.warn(`Blacklist DB check failed: ${err.message}`);
    return false;
  }
}

/**
 * Revoke ALL tokens for a user (e.g., password change, security event).
 * @param {number} userId - User ID
 */
export async function revokeAllUserTokens(userId) {
  try {
    // Get all active tokens for this user
    const tokens = await db('refresh_tokens')
      .where({ user_id: userId, is_revoked: false })
      .select('token', 'expires_at');

    // Revoke in DB
    await db('refresh_tokens')
      .where({ user_id: userId })
      .update({ is_revoked: true, revoked_at: db.fn.now() });

    // Blacklist in Redis
    if (isRedisAvailable()) {
      const pipeline = redis.pipeline();
      for (const t of tokens) {
        const ttl = Math.max(1, Math.floor((new Date(t.expires_at) - Date.now()) / 1000));
        pipeline.setex(`${BLACKLIST_PREFIX}${t.token}`, ttl, '1');
      }
      await pipeline.exec();
    }

    logger.info(`Revoked ${tokens.length} tokens for user ${userId}`);
  } catch (err) {
    logger.error(`Revoke all tokens failed for user ${userId}: ${err.message}`);
  }
}
