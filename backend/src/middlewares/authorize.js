import { ApiError } from '../utils/ApiError.js';
import { ROLE_HIERARCHY } from '../utils/constants.js';

/**
 * Role-based access control (RBAC) middleware.
 * Checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER the authenticate middleware.
 *
 * @param {...string} allowedRoles - Roles that are permitted access
 * @returns {Function} Express middleware
 *
 * @example
 * router.delete('/users/:id', authenticate, authorize('super_admin', 'admin'), deleteUser);
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}`
        )
      );
    }

    next();
  };
};

/**
 * Minimum role level middleware.
 * Allows access if user's role is at or above the specified minimum level.
 *
 * @param {string} minimumRole - Minimum role required
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/reports', authenticate, minRole('manager'), getReports);
 */
export const minRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return next(
        ApiError.forbidden(
          `Access denied. Minimum role required: ${minimumRole}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

/**
 * Business-scoped access middleware.
 * Ensures the user can only access data belonging to their own business.
 * Super admins can access all businesses.
 *
 * @returns {Function} Express middleware
 */
export const businessScope = () => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super admins can access any business
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Set business_id filter for all subsequent queries
    req.businessId = req.user.business_id;

    // If a business_id is specified in params/query, verify it matches
    const requestedBusinessId = req.params.businessId || req.query.businessId || req.body?.business_id;
    if (requestedBusinessId && parseInt(requestedBusinessId, 10) !== req.user.business_id) {
      return next(ApiError.forbidden('You cannot access data from another business'));
    }

    next();
  };
};
