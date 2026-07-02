const cron = require('node-cron');
const os = require('os');
const prisma = require('../models/prisma');
const logger = require('../utils/logger');
const { createRecurringJobRun, promoteDueJobs, recoverStaleJobs } = require('./jobService');
const { deactivateStaleWorkers } = require('./workerService');
const { acquireLock, renewLock, releaseLock } = require('./lockService');

const schedulerOwnerId = process.env.SCHEDULER_OWNER_ID || `scheduler:${os.hostname()}:${process.pid}`;
let schedulerLockTimer;

const scheduledTasks = new Map();
let promotionTask;

async function scheduleRecurringJobs() {
  const recurringJobs = await prisma.scheduledJob.findMany({
    where: { enabled: true },
    include: { job: true }
  });

  for (const scheduledJob of recurringJobs) {
    if (scheduledTasks.has(scheduledJob.id)) {
      continue;
    }

    const task = cron.schedule(scheduledJob.cronExpression, async () => {
      try {
        await createRecurringJobRun(scheduledJob.id);
      } catch (error) {
        logger.error('recurring-job-failed', {
          scheduledJobId: scheduledJob.id,
          message: error.message,
          stack: error.stack
        });
      }
    }, {
      timezone: scheduledJob.timezone || 'UTC'
    });

    scheduledTasks.set(scheduledJob.id, task);
  }
}

async function startScheduler() {
  const acquired = await acquireLock('scheduler-primary', schedulerOwnerId, 120000);
  if (!acquired) {
    logger.warn('scheduler-lock-unavailable', {
      ownerId: schedulerOwnerId
    });
    return;
  }

  await scheduleRecurringJobs();

  if (!promotionTask) {
    promotionTask = cron.schedule('* * * * *', async () => {
      try {
        await deactivateStaleWorkers();
        await recoverStaleJobs();
        await promoteDueJobs();
      } catch (error) {
        logger.error('promote-due-jobs-failed', {
          message: error.message,
          stack: error.stack
        });
      }
    });
  }

  if (!schedulerLockTimer) {
    schedulerLockTimer = setInterval(() => {
      renewLock('scheduler-primary', schedulerOwnerId, 120000)
        .then((renewed) => {
          if (!renewed) {
            logger.error('scheduler-lock-lost', {
              ownerId: schedulerOwnerId
            });
            void stopScheduler();
          }
        })
        .catch((error) => {
          logger.error('scheduler-lock-renewal-failed', {
            message: error.message,
            stack: error.stack
          });
          void stopScheduler();
        });
    }, 30000);
  }

  logger.info('scheduler-started', {
    recurringJobs: scheduledTasks.size
  });
}

async function stopScheduler() {
  for (const task of scheduledTasks.values()) {
    task.stop();
  }
  scheduledTasks.clear();

  if (promotionTask) {
    promotionTask.stop();
    promotionTask = null;
  }

  if (schedulerLockTimer) {
    clearInterval(schedulerLockTimer);
    schedulerLockTimer = null;
  }

  await releaseLock('scheduler-primary', schedulerOwnerId);
}

module.exports = {
  startScheduler,
  stopScheduler,
  scheduleRecurringJobs
};
