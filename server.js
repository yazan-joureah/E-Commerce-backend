// server.js
require('module-alias/register'); // must be first if you use aliases
const path = require('path');
const dotenv = require('dotenv');


// Load env from root config.env
dotenv.config({ path: path.join(__dirname, 'config.env') });

const validateEnv = require('@config/env');
const dbConnection = require('@config/database');
const createApp = require('./app');
const logger = require('@utils/logger');
const setupGracefulShutdown = require('./shutdown');

// Validate env (throws on missing/invalid required vars)
const env = validateEnv();

// Connect to DB (supports sync or Promise-returning dbConnection)
(async function bootstrap() {
  try {
    const maybePromise = dbConnection(); // keep existing API
    await Promise.resolve(maybePromise);
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed: %s', err.message);
    process.exit(1);
  }

  // Create configured app
  const app = createApp(env);

  // Start server
  const PORT = env.PORT || 8080;
  const server = app.listen(PORT, () => {
    logger.info('🚀 Server running on port %d in %s mode', PORT, env.NODE_ENV);
  });

  // setup graceful shutdown handlers
  setupGracefulShutdown(server, logger);
})();
