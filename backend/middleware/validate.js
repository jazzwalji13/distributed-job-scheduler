const { AppError } = require('../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!parsed.success) {
      return next(
        new AppError('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten())
      );
    }

    req.validated = parsed.data;
    return next();
  };
}

module.exports = validate;
