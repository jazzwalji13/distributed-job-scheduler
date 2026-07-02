const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./utils/config');
const logger = require('./utils/logger');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { AppError } = require('./utils/errors');
const rateLimit = require('./middleware/rateLimit');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  // app.use(rateLimit());

  app.use((req, res, next) => {
    logger.info('http-request', {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip
    });
    next();
  });

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  });

  app.use('/api', apiRoutes);

  app.use((req, res, next) => {
    next(new AppError('Route not found', 404, 'ROUTE_NOT_FOUND'));
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
