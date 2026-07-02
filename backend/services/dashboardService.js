const prisma = require('../models/prisma');
const { verifyOrganizationAccess } = require('./organizationService');

async function getDashboardMetrics(user, organizationId) {
  await verifyOrganizationAccess(user, organizationId);

  const organizationJobs = await prisma.job.findMany({
    where: { organizationId },
    select: { id: true }
  });

  const organizationJobIds = organizationJobs.map((job) => job.id);

  const [queueStatuses, workerStatuses, jobStatuses, recentExecutions] = await Promise.all([
    prisma.queue.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { _all: true }
    }),
    prisma.worker.groupBy({
      by: ['status'],
      _count: { _all: true }
    }),
    prisma.job.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { _all: true }
    }),
    prisma.jobExecution.groupBy({
      by: ['status'],
      where: {
        jobId: { in: organizationJobIds }
      },
      _count: { _all: true }
    })
  ]);

  const queueMap = queueStatuses.reduce((accumulator, row) => {
    accumulator[row.status] = row._count._all;
    return accumulator;
  }, {});

  const workerMap = workerStatuses.reduce((accumulator, row) => {
    accumulator[row.status] = row._count._all;
    return accumulator;
  }, {});

  const jobMap = jobStatuses.reduce((accumulator, row) => {
    accumulator[row.status] = row._count._all;
    return accumulator;
  }, {});

  const recentJobs = await prisma.job.findMany({
    where: { organizationId },
    take: 12,
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      status: true,
      type: true
    }
  });

  return {
    queueHealth: {
      active: queueMap.ACTIVE || 0,
      paused: queueMap.PAUSED || 0
    },
    workerStatus: {
      online: workerMap.ONLINE || 0,
      draining: workerMap.DRAINING || 0,
      offline: workerMap.OFFLINE || 0
    },
    jobCounts: {
      queued: jobMap.QUEUED || 0,
      scheduled: jobMap.SCHEDULED || 0,
      claimed: jobMap.CLAIMED || 0,
      running: jobMap.RUNNING || 0,
      completed: jobMap.COMPLETED || 0,
      failed: jobMap.FAILED || 0,
      deadLetter: jobMap.DEAD_LETTER || 0
    },
    executionStatus: recentExecutions.reduce((accumulator, row) => {
      accumulator[row.status] = row._count._all;
      return accumulator;
    }, {}),
    recentJobs
  };
}

module.exports = {
  getDashboardMetrics
};
