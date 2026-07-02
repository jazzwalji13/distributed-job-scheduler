class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function notFound(entity = 'Resource') {
  return new AppError(`${entity} not found`, 404, 'NOT_FOUND');
}

function forbidden(message = 'Forbidden') {
  return new AppError(message, 403, 'FORBIDDEN');
}

function unauthorized(message = 'Unauthorized') {
  return new AppError(message, 401, 'UNAUTHORIZED');
}

module.exports = {
  AppError,
  notFound,
  forbidden,
  unauthorized
};
