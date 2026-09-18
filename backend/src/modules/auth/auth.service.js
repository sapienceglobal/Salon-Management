import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../config/mailer.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashToken, generateRandomToken, generateOTP, generateUUID } from '../../utils/crypto.js';
import { slugify } from '../../utils/helpers.js';

const SALT_ROUNDS = 12;

/**
 * Auth Service — handles all authentication business logic.
 */
class AuthService {
  /**
   * Register a new business + admin user.
   * Creates both the business entity and the initial admin account.
   */
  async register({ business_name, first_name, last_name, email, password, phone }) {
    // Check if email already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create business + user in a transaction
    const result = await db.transaction(async (trx) => {
      // Create business
      const [businessId] = await trx('businesses').insert({
        name: business_name,
        slug: slugify(business_name) + '-' + Date.now().toString(36),
        email,
        phone: phone || null,
      });

      // Create admin user
      const [userId] = await trx('users').insert({
        business_id: businessId,
        email,
        password_hash,
        first_name,
        last_name: last_name || null,
        phone: phone || null,
        role: 'admin',
      });

      // Fetch the created user (without password)
      const user = await trx('users')
        .select('id', 'business_id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active', 'created_at')
        .where({ id: userId })
        .first();

      return { user, businessId };
    });

    // Generate tokens
    const tokens = await this.generateTokens(result.user, null, null);

    logger.info(`New business registered: ${business_name} (user: ${email})`);

    return {
      user: result.user,
      ...tokens,
    };
  }

  /**
   * Login with email and password.
   * Returns access token + sets refresh token cookie.
   */
  async login({ email, password }, ipAddress, userAgent) {
    // Find user by email
    const user = await db('users')
      .select('id', 'business_id', 'email', 'password_hash', 'first_name', 'last_name', 'role', 'is_active', 'google_id')
      .where({ email })
      .first();

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.is_active) {
      throw ApiError.forbidden('Your account has been deactivated. Contact administrator.');
    }

    // If user registered via Google only (no password set)
    if (!user.password_hash && user.google_id) {
      throw ApiError.badRequest('This account uses Google login. Please sign in with Google.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login timestamp
    await db('users').where({ id: user.id }).update({ last_login_at: db.fn.now() });

    // Generate tokens
    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    // Remove sensitive fields
    const { password_hash, google_id, ...safeUser } = user;

    logger.info(`User logged in: ${email} (IP: ${ipAddress})`);

    return {
      user: safeUser,
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token.
   * Implements token rotation: old token revoked, new pair issued.
   * Includes reuse detection — if a revoked token is reused, ALL family tokens are invalidated.
   */
  async refreshToken(refreshToken, ipAddress, userAgent) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    const tokenHash = hashToken(refreshToken);

    // Find the token in database
    const storedToken = await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .first();

    if (!storedToken) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // REUSE DETECTION: If token was already revoked, someone stole it!
    if (storedToken.is_revoked) {
      logger.warn(`⚠️ REFRESH TOKEN REUSE DETECTED! family_id: ${storedToken.family_id}, user_id: ${storedToken.user_id}, IP: ${ipAddress}`);

      // Revoke ALL tokens in this family — force re-login
      await db('refresh_tokens')
        .where({ family_id: storedToken.family_id })
        .update({ is_revoked: true });

      throw ApiError.unauthorized('Suspicious activity detected. Please login again.');
    }

    // Check if token is expired
    if (new Date(storedToken.expires_at) < new Date()) {
      await db('refresh_tokens')
        .where({ id: storedToken.id })
        .update({ is_revoked: true });
      throw ApiError.unauthorized('Refresh token expired. Please login again.');
    }

    // Revoke the current token (rotation)
    await db('refresh_tokens')
      .where({ id: storedToken.id })
      .update({ is_revoked: true });

    // Fetch user
    const user = await db('users')
      .select('id', 'business_id', 'email', 'first_name', 'last_name', 'role', 'is_active')
      .where({ id: storedToken.user_id, is_active: true })
      .first();

    if (!user) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Generate new token pair (same family)
    const tokens = await this.generateTokens(user, ipAddress, userAgent, storedToken.family_id);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Logout — revoke the refresh token.
   */
  async logout(refreshToken) {
    if (!refreshToken) return;

    const tokenHash = hashToken(refreshToken);

    // Revoke the token
    await db('refresh_tokens')
      .where({ token_hash: tokenHash })
      .update({ is_revoked: true });

    logger.info('User logged out, refresh token revoked');
  }

  /**
   * Forgot password — send OTP email.
   */
  async forgotPassword(email) {
    const user = await db('users').where({ email, is_active: true }).first();

    // Don't reveal whether the email exists (security)
    if (!user) {
      return; // Silently return
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpHash = hashToken(otp);
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for OTP

    // Save to database
    await db('users').where({ id: user.id }).update({
      password_reset_token: otpHash,
      password_reset_expires: resetExpiry,
      updated_at: db.fn.now(),
    });

    // Send email
    try {
      await sendEmail({
        to: email,
        subject: 'Salon360 — Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #E91E63; text-align: center;">SalonTime</h2>
            <h3 style="color: #333;">Password Reset Verification</h3>
            <p>Hi ${user.first_name},</p>
            <p>You recently requested to reset your password for your SalonTime account. Use the OTP below to complete the process.</p>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1A1A2E;">
                ${otp}
              </span>
            </div>
            <p>This OTP is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">SalonTime — Salon Management Platform</p>
          </div>
        `,
      });

      logger.info(`Password reset OTP sent to ${email}`);
    } catch (error) {
      // Reset the token if email fails
      await db('users').where({ id: user.id }).update({
        password_reset_token: null,
        password_reset_expires: null,
      });
      logger.error('Failed to send password reset OTP email:', error);
      throw ApiError.internal('Failed to send OTP email. Please try again later.');
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(email, otp) {
    const user = await db('users').where({ email, is_active: true }).first();
    if (!user) {
      throw ApiError.badRequest('Invalid email or OTP');
    }

    const otpHash = hashToken(otp);

    const isValid = user.password_reset_token === otpHash && user.password_reset_expires > new Date();

    if (!isValid) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    return { success: true, message: 'OTP verified successfully' };
  }

  /**
   * Reset password using OTP from email.
   */
  async resetPassword(email, token, newPassword) {
    const tokenHash = hashToken(token);

    // Find user with valid, non-expired token and matching email
    const user = await db('users')
      .where({ email, password_reset_token: tokenHash })
      .where('password_reset_expires', '>', new Date())
      .first();

    if (!user) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    await db('users').where({ id: user.id }).update({
      password_hash,
      password_reset_token: null,
      password_reset_expires: null,
      password_changed_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    // Revoke ALL refresh tokens for this user (force re-login everywhere)
    await db('refresh_tokens')
      .where({ user_id: user.id })
      .update({ is_revoked: true });

    logger.info(`Password reset successful for user: ${user.email}`);
  }

  /**
   * Change password (for logged-in users).
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await db('users').where({ id: userId }).update({
      password_hash,
      password_changed_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    // Revoke all refresh tokens (force re-login on other devices)
    await db('refresh_tokens')
      .where({ user_id: userId })
      .update({ is_revoked: true });

    logger.info(`Password changed for user ID: ${userId}`);
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // ===================================================================

  /**
   * Generate access + refresh token pair.
   * @param {Object} user - User object
   * @param {string} ipAddress - Client IP
   * @param {string} userAgent - Client User-Agent
   * @param {string} [familyId] - Existing token family (for rotation)
   * @returns {Object} - { accessToken, refreshToken }
   */
  async generateTokens(user, ipAddress, userAgent, familyId = null) {
    // Access Token (short-lived)
    const accessToken = jwt.sign(
      {
        sub: user.id,
        business_id: user.business_id,
        role: user.role,
        type: 'access',
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.JWT_ACCESS_EXPIRY,
        algorithm: 'HS256',
        issuer: 'salon360',
        audience: 'salon360-client',
      }
    );

    // Refresh Token (long-lived)
    const refreshToken = generateRandomToken(40);
    const tokenHash = hashToken(refreshToken);
    const tokenFamilyId = familyId || generateUUID();

    // Calculate expiry
    const expiryMatch = env.JWT_REFRESH_EXPIRY.match(/^(\d+)([smhd])$/);
    let expiryMs = 7 * 24 * 60 * 60 * 1000; // Default 7 days
    if (expiryMatch) {
      const value = parseInt(expiryMatch[1], 10);
      const unit = expiryMatch[2];
      const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
      expiryMs = value * multipliers[unit];
    }

    const expiresAt = new Date(Date.now() + expiryMs);

    // Store refresh token in database
    await db('refresh_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      family_id: tokenFamilyId,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent ? userAgent.substring(0, 500) : null,
    });

    return { accessToken, refreshToken };
  }
}

// Singleton export
export const authService = new AuthService();
