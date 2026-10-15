import { env } from './env.js';

/**
 * Checks whether an incoming origin is allowed.
 * Supports:
 * - Empty origin (mobile apps, server-to-server, curl)
 * - Exact matches from env.CORS_ALLOWED_ORIGINS
 * - Wildcard root and subdomains of salontime.co.in (*.salontime.co.in, salontime.co.in)
 * - Wildcards specified in CORS_ALLOWED_ORIGINS (e.g., *.example.com)
 * - Localhost / 127.0.0.1 for local testing
 */
export function isOriginAllowed(origin) {
  if (!origin) return true;

  const allowedOrigins = env.CORS_ALLOWED_ORIGINS
    ? env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();

    // Always permit salontime.co.in and any tenant subdomain (*.salontime.co.in)
    if (hostname === 'salontime.co.in' || hostname.endsWith('.salontime.co.in')) {
      return true;
    }

    // Permit local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // Check wildcard patterns defined in allowedOrigins (e.g. *.domain.com)
    for (const allowed of allowedOrigins) {
      if (allowed.startsWith('*.')) {
        const root = allowed.slice(2).toLowerCase();
        if (hostname === root || hostname.endsWith(`.${root}`)) {
          return true;
        }
      }
      try {
        const allowedParsed = new URL(allowed);
        if (allowedParsed.hostname.startsWith('*.')) {
          const root = allowedParsed.hostname.slice(2).toLowerCase();
          if (hostname === root || hostname.endsWith(`.${root}`)) {
            return true;
          }
        }
      } catch {
        // ignore malformed allowed origin
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * CORS configuration with strict origin allowlist supporting tenant subdomains.
 */
const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true, // Allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'x-csrf-token',
    'x-api-key',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  maxAge: 86400, // Cache preflight for 24 hours
  optionsSuccessStatus: 204,
};

export { corsOptions };
