const path = require('path')

// app.js
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const sanitizeRequest = require('@middleware/sanitizeRequest');
const categoryApi = require('@api/categoryApi');
const subCategoryApi = require('@api/subCategoryApi');
const brandApi = require('@api/brandApi');
const productApi = require('@api/productApi');
const ApiError = require('@utils/ApiError');
const globalError = require('@middleware/errorMiddleware');
const logger = require('@utils/logger');

module.exports = function createApp(env) {
  const app = express();

  // Security headers
  app.use(helmet());
  app.disable('x-powered-by');

  // Rate limiter (apply to API routes)
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
    })
  );

  // CORS - support comma-separated whitelist from env
  const allowedOrigins = (env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: function (origin, callback) {
        if (
          !origin ||
          allowedOrigins.length === 0 ||
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin)
        ) {
          callback(null, true);
        } else {
          callback(new ApiError('Not allowed by CORS', 403));
        }
      },
    })
  );

  // Body parser
  app.use(express.json({ limit: '50kb' }));

  // Sanitize input
  app.use(sanitizeRequest);
  app.use(express.static(path.join(__dirname,'uploads')))

  // Dev logging using morgan
  if (env.NODE_ENV === 'development') {
    // stream morgan to winston
    app.use(
      morgan('dev', {
        stream: { write: (msg) => logger.info(msg.trim()) },
      })
    );
    logger.info('🧪 Running in development mode');
  }

  // Routes
  app.use('/api/v1/categories', categoryApi);
  app.use('/api/v1/sub-categories', subCategoryApi);
  app.use('/api/v1/brands', brandApi);
  app.use('/api/v1/products', productApi);
  app.get('/health', (req, res, next) => {
    const dbReady = mongoose.connection.readyState === 1;
    if (!dbReady) {
      return next(new ApiError(`Database is not Ready`, 500));
    }
    res.status(200).json({ status: dbReady ? 'ok' : 'error', dbReady });
  });
  app.use((req, res, next) => {
    next(new ApiError(`Could not Find the Route ${req.originalUrl}`, 404));
  });
  // Global error handler
  app.use(globalError);

  return app;
};
