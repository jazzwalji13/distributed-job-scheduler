const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED');
  const isOperational = err instanceof AppError || err.isOperational;

  if (!isOperational) {
    logger.error('unhandled-error', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'Unexpected error',
      details: err.details || null
    }
  });
}

module.exports = errorHandler;
