import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine log level based on NODE_ENV (can't use env.js here due to circular dependency)
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const logsDir = path.resolve(__dirname, '../../logs');

/**
 * Custom log format with timestamp, level, and message.
 * In production: JSON format for log aggregation tools.
 * In development: Colorized, human-readable format.
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      // Remove 'service' from console output for cleaner logs
      const { service, ...rest } = meta;
      if (Object.keys(rest).length > 0) {
        log += ` ${JSON.stringify(rest)}`;
      }
    }
    return log;
  })
);

/**
 * Winston logger instance.
 * - Console transport: always active
 * - File transports: combined.log (all), error.log (errors only)
 */
const logger = winston.createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { service: 'salon360-api' },
  transports: [
    // Console output
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
      format: productionFormat, // Always JSON in files
    }),
    // Error log file (errors only)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
      format: productionFormat,
    }),
  ],
  // Don't exit on uncaught exceptions — let graceful shutdown handle it
  exitOnError: false,
});

/**
 * Morgan stream for HTTP request logging via Winston.
 */
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export { logger, morganStream };
