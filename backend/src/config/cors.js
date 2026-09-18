import { env } from './env.js';

/**
 * CORS configuration with strict origin allowlist.
 * NEVER use wildcard (*) in production.
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());

    // Allow requests with no origin (mobile apps, curl). 
    // Mobile apps are further protected by x-api-key in secureApi middleware.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true, // Allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  maxAge: 86400, // Cache preflight for 24 hours
  optionsSuccessStatus: 204,
};

export { corsOptions };
