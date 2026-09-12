import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from './ApiError.js';
import { env } from '../config/env.js';

// Allowed MIME types for different upload types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * Multer disk storage with UUID-based filenames to prevent collisions.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(env.UPLOAD_DIR));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter — validates MIME type before accepting upload.
 * Prevents malicious file uploads.
 */
function fileFilter(allowedTypes) {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        ApiError.badRequest(
          `Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`
        ),
        false
      );
    }
  };
}

/**
 * Image upload middleware.
 * Max file size from env, accepts JPEG/PNG/WebP/GIF only.
 */
const uploadImage = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 5, // Max 5 files per request
  },
});

/**
 * Document upload middleware (for receipts, invoices).
 * Accepts PDF, JPEG, PNG.
 */
const uploadDocument = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_DOCUMENT_TYPES),
  limits: {
    fileSize: env.MAX_FILE_SIZE * 2, // 10MB for documents
    files: 3,
  },
});

/**
 * Single image upload handler.
 * @param {string} fieldName - Form field name
 * @returns {Function} Multer middleware
 */
export function singleImage(fieldName = 'image') {
  return uploadImage.single(fieldName);
}

/**
 * Multiple image upload handler.
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 * @returns {Function} Multer middleware
 */
export function multipleImages(fieldName = 'images', maxCount = 5) {
  return uploadImage.array(fieldName, maxCount);
}

/**
 * Single document upload handler.
 * @param {string} fieldName - Form field name
 * @returns {Function} Multer middleware
 */
export function singleDocument(fieldName = 'document') {
  return uploadDocument.single(fieldName);
}
