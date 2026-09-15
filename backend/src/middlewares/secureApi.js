import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const secureApi = (req, res, next) => {
  // Allow requests from our own web frontend based on Origin
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = env.CORS_ALLOWED_ORIGINS ? env.CORS_ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  
  if (origin && allowedOrigins.some(o => origin.startsWith(o))) {
    return next();
  }

  // If not from a recognized web origin, it must be the mobile app or another client.
  // Require a valid API key.
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.MOBILE_APP_API_KEY || 'SALON_MOBILE_SECURE_2026';

  if (!apiKey || apiKey !== validKey) {
    return next(ApiError.unauthorized('Invalid or missing API Key. Access denied.'));
  }

  next();
};
