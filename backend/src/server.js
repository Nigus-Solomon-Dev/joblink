// Server entry point
const http = require('http');
const app = require('./app');
const config = require('./config/env');
const Logger = require('./utils/logger');
const websocketService = require('./services/websocketService');
const telegramBotService = require('./services/telegramBotService');

const PORT = config.PORT;

const server = http.createServer(app);

websocketService.initialize(server);

server.listen(PORT, () => {
  Logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  telegramBotService.start()
    .then((result) => {
      Logger.info('Telegram bot startup', result);
    })
    .catch((error) => {
      Logger.error('Failed to start Telegram bot', { error: error.message });
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  Logger.error('UNHANDLED REJECTION! 💥 Shutting down...', { error: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  Logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received. Shutting down gracefully...');
  telegramBotService.stop();
  server.close(() => {
    Logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle SIGINT
process.on('SIGINT', () => {
  Logger.info('SIGINT received. Shutting down gracefully...');
  telegramBotService.stop();
  server.close(() => {
    Logger.info('Process terminated');
    process.exit(0);
  });
});