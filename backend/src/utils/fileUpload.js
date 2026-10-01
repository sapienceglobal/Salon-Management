import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from './ApiError.js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed MIME types for different upload types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Deterministically resolves and ensures the upload directory exists on disk.
 * Safe for local development and live VPS (Hostinger) deployments.
 * @returns {string} Absolute path to upload directory
 */
export function getUploadDir() {
  const dir = env.UPLOAD_DIR || './uploads';
  const resolvedPath = path.isAbsolute(dir)
    ? dir
    : path.resolve(__dirname, '../../', dir);

  if (!fs.existsSync(resolvedPath)) {
    try {
      fs.mkdirSync(resolvedPath, { recursive: true });
    } catch (err) {
      console.error(`Failed to create uploads directory at ${resolvedPath}:`, err);
    }
  }
  return resolvedPath;
}

// Ensure the directory exists on module load
getUploadDir();

/**
 * Multer disk storage with UUID-based filenames to prevent collisions and sanitize names.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir());
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
 * Max file size from env, accepts JPEG/PNG/WebP/GIF/SVG.
 */
export const uploadImage = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
  limits: {
    fileSize: env.MAX_FILE_SIZE || 5242880, // Default 5MB
    files: 5, // Max 5 files per request
  },
});

/**
 * Document upload middleware (for receipts, invoices).
 * Accepts PDF, JPEG, PNG, WebP.
 */
export const uploadDocument = multer({
  storage,
  fileFilter: fileFilter(ALLOWED_DOCUMENT_TYPES),
  limits: {
    fileSize: (env.MAX_FILE_SIZE || 5242880) * 2, // 10MB for documents
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

/**
 * Safely deletes an uploaded file from the local VPS disk.
 * Protects presets, public static assets, external URLs, and prevents directory traversal.
 * 
 * @param {string} fileUrlOrPath - File URL (e.g. "/uploads/abc.jpg" or full URL)
 * @returns {boolean} true if successfully removed, false otherwise
 */
export function deleteUploadedFile(fileUrlOrPath) {
  if (!fileUrlOrPath || typeof fileUrlOrPath !== 'string') return false;

  // Ignore data URIs or blob URLs
  if (fileUrlOrPath.startsWith('blob:') || fileUrlOrPath.startsWith('data:')) {
    return false;
  }

  // Ensure file is inside /uploads/
  const hasUploads = fileUrlOrPath.includes('/uploads/') || fileUrlOrPath.startsWith('uploads/');
  if (!hasUploads) {
    // Preset or public static asset (e.g. /service_women_haircut.png or /pos/prod.jpg)
    return false;
  }

  try {
    // Strip query parameters or hashes
    const cleanPath = fileUrlOrPath.split('?')[0].split('#')[0];
    const filename = path.basename(cleanPath);

    // Guard against directory traversal or root manipulation
    if (!filename || filename === '.' || filename === '..') {
      return false;
    }

    const fullFilePath = path.join(getUploadDir(), filename);

    if (fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
      return true;
    }
  } catch (err) {
    console.error(`[Upload Cleanup] Error removing file "${fileUrlOrPath}":`, err.message);
  }
  return false;
}

/**
 * Safely deletes multiple uploaded files from local storage.
 * @param {string[]} fileUrls - Array of file paths or URLs
 */
export function deleteUploadedFiles(fileUrls = []) {
  if (!Array.isArray(fileUrls)) return;
  for (const url of fileUrls) {
    deleteUploadedFile(url);
  }
}
