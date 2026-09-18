import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../config/firebase-admin.json');

let messaging;

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  const app = initializeApp({
    credential: cert(serviceAccount)
  });
  messaging = getMessaging(app);
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

    if (!messaging) {
      logger.error('FCM Messaging is not initialized');
      return null;
    }
    const response = await messaging.send(message);
    logger.info(`Successfully sent FCM message to topic ${topic}: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Error sending FCM message to topic ${topic}: ${error.message}`);
    // Don't throw to avoid breaking the main flow
    return null;
  }
};
