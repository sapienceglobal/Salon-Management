import { ApiError } from '../utils/ApiError.js';
import { isOriginAllowed } from '../config/cors.js';

export const secureApi = (req, res, next) => {
  // Allow requests from recognized web frontends (including any tenant subdomain)
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin && isOriginAllowed(origin)) {
    return next();
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isOriginAllowed(refererOrigin)) {
        return next();
      }
    } catch {
      // ignore parse error and proceed to check api key
    }
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
