import passport from 'passport';
import { ApiError } from '../utils/ApiError.js';

/**
 * Authentication middleware using JWT strategy.
 * Extracts and verifies the access token from Authorization: Bearer header.
 * Attaches the authenticated user to req.user on success.
 */
export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      const message = info?.message || 'Authentication required. Please login.';
      return next(ApiError.unauthorized(message));
    }

    if (!user.is_active) {
      return next(ApiError.forbidden('Your account has been deactivated. Contact administrator.'));
    }

    // Attach user to request
    req.user = user;
    next();
  })(req, res, next);
};
