import { doubleCsrf } from 'csrf-csrf';
import { env } from '../config/env.js';

/**
 * CSRF protection using the Double Submit Cookie pattern.
 * Uses csrf-csrf package (modern replacement for deprecated csurf).
 *
 * How it works:
 * 1. Server generates a CSRF token and stores it in a signed, httpOnly cookie
 * 2. Client reads the token from a separate non-httpOnly cookie or header
 * 3. Client sends the token back in the X-CSRF-Token header with each mutating request
 * 4. Server compares the cookie value with the header value
 */
const {
  generateToken, // Function to generate CSRF token
  doubleCsrfProtection, // Middleware to validate CSRF token
} = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  getTokenFromRequest: (req) => {
    // Check X-CSRF-Token header first, then body._csrf
    return req.headers['x-csrf-token'] || req.body?._csrf;
  },
});

export { generateToken, doubleCsrfProtection };
