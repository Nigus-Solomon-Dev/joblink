// Logger utility - can be extended with Winston or Pino in production
const { NODE_ENV } = require('../config/env');

class Logger {
  static info(message, meta = {}) {
    if (NODE_ENV !== 'test') {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
    }
  }

  static warn(message, meta = {}) {
    if (NODE_ENV !== 'test') {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
    }
  }

  static error(message, meta = {}) {
    if (NODE_ENV !== 'test') {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta);
    }
  }

  static debug(message, meta = {}) {
    if (NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
}

module.exports = Logger;