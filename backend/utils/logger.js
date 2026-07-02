const winston = require('winston');
const config = require('./config');

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'distributed-job-scheduler'
  },
  transports: [new winston.transports.Console()]
});

module.exports = logger;
