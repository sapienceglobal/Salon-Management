import nodemailer from 'nodemailer';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Nodemailer transporter configured for Gmail SMTP with app password.
 * Production-ready with connection pooling and retry logic.
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10, // Max 10 messages per second
  // Timeouts
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
});

/**
 * Verify SMTP connection on startup.
 * @returns {Promise<boolean>}
 */
async function verifyMailConnection() {
  try {
    await transporter.verify();
    logger.info('✅ SMTP mail server connected successfully');
    return true;
  } catch (error) {
    logger.warn('⚠️ SMTP connection failed (emails will not work):', error.message);
    return false;
  }
}

/**
 * Send an email with retry logic.
 * @param {Object} options - Mail options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text body
 * @param {Array} [options.attachments] - File attachments
 * @param {number} [retries=3] - Number of retry attempts
 * @returns {Promise<Object>} - Nodemailer send result
 */
async function sendEmail(options, retries = 3) {
  const mailOptions = {
    from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || '',
    attachments: options.attachments || [],
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to} (messageId: ${info.messageId})`);
      return info;
    } catch (error) {
      logger.error(`Email send attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        throw error;
      }
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
}

export { transporter, verifyMailConnection, sendEmail };
