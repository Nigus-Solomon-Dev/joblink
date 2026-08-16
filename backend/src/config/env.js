// Environment configuration
// Defaults are safe only for development and test. Production fails fast on
// missing or insecure configuration rather than silently using weak defaults.

const path = require('path');
// Load .env relative to the project root (backend/.env) regardless of the
// current working directory, so `cd src && nodemon server.js` works.
require('dotenv').config({ path: path.resolve(__dirname, '../..', '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const REQUIRED_IN_PRODUCTION = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const INSECURE_DEFAULTS = ['dev-only-insecure-jwt-secret', 'dev-only-insecure-refresh-secret'];

if (isProduction) {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables in production: ${missing.join(', ')}. ` +
      'Set them in your deployment configuration before starting.'
    );
  }

  const insecure = ['JWT_SECRET', 'JWT_REFRESH_SECRET'].filter((key) =>
    INSECURE_DEFAULTS.includes(process.env[key])
  );

  if (insecure.length > 0) {
    throw new Error(
      `[env] Refusing to start in production with insecure default values for: ${insecure.join(', ')}. ` +
      'Generate strong secrets (e.g. openssl rand -hex 64).'
    );
  }
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/joblink',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-only-insecure-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@joblink.et',
  REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL,
};