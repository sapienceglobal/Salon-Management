import morgan from 'morgan';
import { morganStream } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * HTTP request logger middleware using Morgan.
 * - Development: Detailed colored output
 * - Production: Combined format piped through Winston
 *
 * Sensitive headers (Authorization, Cookie) are NEVER logged.
 */

// Custom token to mask sensitive info
morgan.token('masked-url', (req) => {
  // Mask any token/password query parameters
  const url = req.originalUrl || req.url;
  return url.replace(/([?&](token|password|secret|key)=)[^&]*/gi, '$1[REDACTED]');
});

morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

// Custom format for production
const productionFormat = ':remote-addr - :user-id [:date[clf]] ":method :masked-url HTTP/:http-version" :status :res[content-length] ":referrer" :response-time ms';

// Development: colorful, concise format
const developmentFormat = ':method :masked-url :status :response-time ms - :res[content-length]';

export const requestLogger = env.NODE_ENV === 'production'
  ? morgan(productionFormat, {
      stream: morganStream,
      // Skip logging for health checks in production
      skip: (req) => req.path === '/api/health',
    })
  : morgan(developmentFormat, {
      // Skip logging for static files in development
      skip: (req) => req.path.startsWith('/uploads'),
    });
