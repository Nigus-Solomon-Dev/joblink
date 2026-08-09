// Middleware index file - exports all middleware
const errorHandler = require('./errorHandler');
const notFound = require('./notFound');
const requestLogger = require('./requestLogger');
const corsOptions = require('./cors');
const rateLimiter = require('./rateLimiter');
const securityHeaders = require('./securityHeaders');
const optimization = require('./optimization');

module.exports = {
  errorHandler,
  notFound,
  requestLogger,
  corsOptions,
  rateLimiter,
  securityHeaders,
  optimization,
};