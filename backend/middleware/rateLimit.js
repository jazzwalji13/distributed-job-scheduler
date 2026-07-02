const { AppError } = require('../utils/errors');

const buckets = new Map();

function rateLimit(options = {}) {
  const windowMs = options.windowMs || Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const maxRequests = options.maxRequests || Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300);

  return (req, res, next) => {
    const key = `${req.ip}:${req.method}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      return next(new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'));
    }

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(maxRequests - bucket.count, 0)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    return next();
  };
}

module.exports = rateLimit;
