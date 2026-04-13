// ============================================
// Winston Logger Configuration
// Logs without sensitive data per OWASP
// ============================================
const winston = require('winston');
const { env } = require('./env');

const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'cookie', 'passwordHash'];

/**
 * Redact sensitive fields from log objects
 */
const redactSensitive = winston.format((info) => {
  if (typeof info.message === 'object') {
    for (const field of sensitiveFields) {
      if (info.message[field]) {
        info.message[field] = '[REDACTED]';
      }
    }
  }
  return info;
});

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    redactSensitive(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level}]: ${stack || (typeof message === 'object' ? JSON.stringify(message) : message)}`;
          })
        )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
  // Don't exit on unhandled errors
  exitOnError: false,
});

module.exports = { logger };
