import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../config/firebase-admin.json');

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  logger.info('Firebase Admin initialized successfully');
} catch (error) {
  logger.error(`Error initializing Firebase Admin: ${error.message}`);
}

/**
 * Send a push notification to a specific topic
 * @param {string} topic - The FCM topic (e.g., 'business_1')
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 */
export const sendTopicNotification = async (topic, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      topic,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'high_importance_channel',
          icon: '@mipmap/ic_launcher',
          color: '#e74a8a', // Brand color
          defaultSound: true,
          defaultVibrateTimings: true,
          notificationCount: 1,
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    logger.info(`Successfully sent FCM message to topic ${topic}: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Error sending FCM message to topic ${topic}: ${error.message}`);
    // Don't throw to avoid breaking the main flow
    return null;
  }
};
