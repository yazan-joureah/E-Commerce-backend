// shutdown.js
const mongoose = require('mongoose');

function setupGracefulShutdown(server, logger) {
  const shutdown = async (signal) => {
    try {
      logger.info('🔻 Shutting down gracefully... (signal=%s)', signal || 'manual');
      // stop accepting new connections
      server.close(async (err) => {
        if (err) {
          logger.error('Error closing server: %s', err.message);
          process.exit(1);
        }
        // close mongoose connection if open
        try {
          if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
          }
        } catch (e) {
          logger.error('Error closing MongoDB connection: %s', e.message);
        } finally {
          process.exit(0);
        }
      });
    } catch (err) {
      logger.error('Error during shutdown: %s', err.message);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(
      'Unhandled Rejection at: %o, reason: %s',
      promise,
      (reason && reason.message) || reason
    );
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception: %s', err.stack || err.message);
    shutdown('uncaughtException');
  });
}

module.exports = setupGracefulShutdown;
