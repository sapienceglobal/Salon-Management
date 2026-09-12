import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt a string value using AES-256-CBC.
 * Used for sensitive data like GST numbers, phone numbers, etc.
 *
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string in format: iv:encrypted (hex encoded)
 */
export function encrypt(text) {
  if (!text) return text;
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an AES-256-CBC encrypted string.
 *
 * @param {string} encryptedText - Encrypted string in format: iv:encrypted
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a SHA-256 hash of a string.
 * Used for hashing refresh tokens before storage.
 *
 * @param {string} token - String to hash
 * @returns {string} - SHA-256 hex hash
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure random string.
 *
 * @param {number} [length=32] - Number of random bytes
 * @returns {string} - Random hex string
 */
export function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a UUID v4.
 *
 * @returns {string}
 */
export function generateUUID() {
  return crypto.randomUUID();
}
