require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',
  workerPollIntervalMs: Number(process.env.WORKER_POLL_INTERVAL_MS || 2000),
  workerHeartbeatIntervalMs: Number(process.env.WORKER_HEARTBEAT_INTERVAL_MS || 15000),
  workerBatchSize: Number(process.env.WORKER_BATCH_SIZE || 5),
  defaultRetryPolicy: {
    strategy: 'EXPONENTIAL',
    maxAttempts: 3,
    initialDelaySeconds: 30,
    multiplier: 2,
    maxDelaySeconds: 3600,
    jitter: true
  }
};

module.exports = config;
