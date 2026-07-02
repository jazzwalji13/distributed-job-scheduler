const logger = require('../utils/logger');
const { startScheduler } = require('../services/schedulerService');

async function main() {
  await startScheduler();
  logger.info('scheduler-process-running');
}

main().catch((error) => {
  logger.error('scheduler-fatal', { message: error.message, stack: error.stack });
  process.exit(1);
});
