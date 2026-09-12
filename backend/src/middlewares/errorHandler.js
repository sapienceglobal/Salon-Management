import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Global error handler middleware.
 * Catches all errors thrown/passed via next() and sends standardized response.
 * MUST be the last middleware registered in Express.
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];
  let isOperational = err.isOperational !== undefined ? err.isOperational : false;

  // Handle specific error types

  // Knex/MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
    // Extract field name from error message
    const match = err.message.match(/for key '(.+?)'/);
    if (match) {
      const field = match[1].split('.').pop();
      errors = [{ field, message: `${field} already exists` }];
    }
    isOperational = true;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
    isOperational = true;
  }

  if (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    message = 'Cannot delete this record as it is referenced by other data.';
    isOperational = true;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
    isOperational = true;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please refresh your session.';
    isOperational = true;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = `File too large. Maximum allowed size is ${Math.round(env.MAX_FILE_SIZE / (1024 * 1024))}MB.`;
    isOperational = true;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = 'Too many files uploaded.';
    isOperational = true;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field.';
    isOperational = true;
  }

  // Zod validation error (fallback if not caught by validate middleware)
  if (err.name === 'ZodError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    isOperational = true;
  }

  // CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Invalid or missing CSRF token.';
    isOperational = true;
  }

  // Log the error
  if (!isOperational || statusCode >= 500) {
    logger.error('Unhandled Error:', {
      statusCode,
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });
  } else {
    logger.warn('Operational Error:', {
      statusCode,
      message,
      path: req.originalUrl,
      method: req.method,
    });
  }

  // Build response
  const response = {
    success: false,
    statusCode,
    message,
  };

  // Include errors array if present
  if (errors.length > 0) {
    response.errors = errors;
  }

  // Include stack trace ONLY in development
  if (env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
