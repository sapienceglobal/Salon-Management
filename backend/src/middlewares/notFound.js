import { ApiError } from '../utils/ApiError.js';

/**
 * 404 Not Found handler.
 * Catches all requests that don't match any defined route.
 * Must be placed AFTER all route definitions but BEFORE error handler.
 */
export const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
