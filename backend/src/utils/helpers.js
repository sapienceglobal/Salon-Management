/**
 * General helper functions used across the application.
 */

/**
 * Remove undefined/null values from an object.
 * Useful for building dynamic UPDATE queries.
 *
 * @param {Object} obj - Input object
 * @returns {Object} - Object with only defined values
 */
export function cleanObject(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Generate a formatted invoice number.
 * Format: PREFIX-YYYYMMDD-COUNTER (e.g., INV-20260901-0042)
 *
 * @param {string} prefix - Invoice prefix
 * @param {number} counter - Sequential counter
 * @returns {string}
 */
export function generateInvoiceNumber(prefix = 'INV', counter = 1) {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const counterStr = String(counter).padStart(4, '0');
  return `${prefix}-${dateStr}-${counterStr}`;
}

/**
 * Calculate tax split (CGST + SGST).
 * For Indian GST: total tax is split equally.
 *
 * @param {number} amount - Taxable amount
 * @param {number} taxPercentage - Total tax percentage (e.g., 18)
 * @returns {Object} - { cgst, sgst, totalTax, amountWithTax }
 */
export function calculateGST(amount, taxPercentage) {
  const safeAmount = Number(amount) || 0;
  const safeTax = Number(taxPercentage) || 0;
  const totalTax = (safeAmount * safeTax) / 100;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  return {
    cgst: parseFloat(cgst.toFixed(2)),
    sgst: parseFloat(sgst.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    amountWithTax: parseFloat((amount + totalTax).toFixed(2)),
  };
}

/**
 * Create a URL-friendly slug from a string.
 *
 * @param {string} text - Input text
 * @returns {string} - Slugified text
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Format a phone number to a consistent format.
 * Removes spaces, dashes, and non-digit characters except leading +.
 *
 * @param {string} phone - Raw phone number
 * @returns {string} - Cleaned phone number
 */
export function formatPhone(phone) {
  if (!phone) return phone;
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Mask sensitive data for logging/display.
 * e.g., "john@example.com" → "j***@example.com"
 *
 * @param {string} email - Email address
 * @returns {string} - Masked email
 */
export function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Parse a duration string like "15m", "7d", "2h" into milliseconds.
 *
 * @param {string} duration - Duration string
 * @returns {number} - Duration in milliseconds
 */
export function parseDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

/**
 * Check if a date falls on today.
 *
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
export function isToday(date) {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}
