/**
 * Input sanitization middleware.
 * Removes potentially dangerous HTML/script content from request data.
 * This is a defense-in-depth measure alongside CSP headers.
 */

/**
 * Recursively sanitize all string values in an object.
 * Removes dangerous HTML tags and attributes.
 *
 * @param {*} value - Value to sanitize
 * @returns {*} - Sanitized value
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers (onclick, onerror, etc.)
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: protocol
      .replace(/javascript\s*:/gi, '')
      // Remove data: protocol in src/href (potential XSS vector)
      .replace(/data\s*:[^,]*,/gi, '')
      // Trim whitespace
      .trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params.
 */
export const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key]);
    }
  }
  if (req.params) {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeValue(req.params[key]);
    }
  }
  next();
};
