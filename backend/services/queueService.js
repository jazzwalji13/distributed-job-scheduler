const prisma = require('../models/prisma');
const { AppError } = require('../utils/errors');
const { createSlug } = require('../utils/security');
const { verifyOrganizationAccess } = require('./organizationService');

async function buildUniqueQueueSlug(projectId, preferredSlug, name) {
  const base = createSlug(preferredSlug || name || 'queue');
  let candidate = base;
  let counter = 1;

  while (await prisma.queue.findFirst({ where: { projectId, slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

async function getQueueById(queueId) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      project: true,
      organization: true,
      retryPolicy: true,
      _count: {
        select: { jobs: true, scheduledJobs: true }
      }
    }
  });

  if (!queue) {
    throw new AppError('Queue not found', 404, 'QUEUE_NOT_FOUND');
  }

  return queue;
}

async function listQueues(user, filters, pagination) {
  const where = {};
  if (filters.organizationId) {
    await verifyOrganizationAccess(user, filters.organizationId);
    where.organizationId = filters.organizationId;
  }
  if (filters.projectId) {
    where.projectId = filters.projectId;
  }

  const [total, items] = await Promise.all([
    prisma.queue.count({ where }),
    prisma.queue.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      include: {
        project: true,
        organization: true,
        retryPolicy: true,
        _count: {
          select: { jobs: true, scheduledJobs: true }
        }
      }
    })
  ]);

  return { total, items };
}

async function createQueue(user, data) {
  await verifyOrganizationAccess(user, data.organizationId);
  const slug = await buildUniqueQueueSlug(data.projectId, data.slug, data.name);

  return prisma.queue.create({
    data: {
      organizationId: data.organizationId,
      projectId: data.projectId,
      retryPolicyId: data.retryPolicyId || null,
      name: data.name,
      slug,
      description: data.description || null,
      priority: data.priority ?? 0,
      concurrencyLimit: data.concurrencyLimit ?? 5,
      rateLimitPerMinute: data.rateLimitPerMinute ?? null,
      shardKey: data.shardKey ?? null
    },
    include: {
      project: true,
      organization: true,
      retryPolicy: true
    }
  });
}

async function updateQueue(user, queueId, data) {
  const queue = await getQueueById(queueId);
  await verifyOrganizationAccess(user, queue.organizationId);
  const slug = data.slug ? await buildUniqueQueueSlug(queue.projectId, data.slug, data.name || queue.name) : queue.slug;

  return prisma.queue.update({
    where: { id: queueId },
    data: {
      name: data.name ?? queue.name,
      slug,
      description: data.description !== undefined ? data.description : queue.description,
      priority: data.priority ?? queue.priority,
      concurrencyLimit: data.concurrencyLimit ?? queue.concurrencyLimit,
      rateLimitPerMinute: data.rateLimitPerMinute !== undefined ? data.rateLimitPerMinute : queue.rateLimitPerMinute,
      shardKey: data.shardKey !== undefined ? data.shardKey : queue.shardKey
    },
    include: {
      project: true,
      organization: true,
      retryPolicy: true,
      _count: {
        select: { jobs: true, scheduledJobs: true }
      }
    }
  });
}

async function deleteQueue(user, queueId) {
  const queue = await getQueueById(queueId);
  await verifyOrganizationAccess(user, queue.organizationId);
  await prisma.queue.delete({ where: { id: queueId } });
  return { deleted: true };
}

async function pauseQueue(user, queueId, reason = 'Paused by operator') {
  const queue = await getQueueById(queueId);
  await verifyOrganizationAccess(user, queue.organizationId);

  return prisma.queue.update({
    where: { id: queueId },
    data: {
      status: 'PAUSED',
      pausedAt: new Date(),
      pausedReason: reason
    }
  });
}

async function resumeQueue(user, queueId) {
  const queue = await getQueueById(queueId);
  await verifyOrganizationAccess(user, queue.organizationId);

  return prisma.queue.update({
    where: { id: queueId },
    data: {
      status: 'ACTIVE',
      pausedAt: null,
      pausedReason: null
    }
  });
}

async function getQueueStats(user, queueId) {
  const queue = await getQueueById(queueId);
  await verifyOrganizationAccess(user, queue.organizationId);

  const [jobCounts, retryCount, completedCount, runningCount] = await Promise.all([
    prisma.job.groupBy({
      by: ['status'],
      where: { queueId },
      _count: { _all: true }
    }),
    prisma.job.count({ where: { queueId, attempts: { gt: 0 } } }),
    prisma.job.count({ where: { queueId, status: 'COMPLETED' } }),
    prisma.job.count({ where: { queueId, status: { in: ['CLAIMED', 'RUNNING'] } } })
  ]);

  const statusMap = jobCounts.reduce((accumulator, row) => {
    accumulator[row.status] = row._count._all;
    return accumulator;
  }, {});

  return {
    queue,
    stats: {
      queued: statusMap.QUEUED || 0,
      scheduled: statusMap.SCHEDULED || 0,
      claimed: statusMap.CLAIMED || 0,
      running: runningCount,
      completed: completedCount,
      failed: statusMap.FAILED || 0,
      deadLetter: statusMap.DEAD_LETTER || 0,
      retryCount
    }
  };
}

module.exports = {
  listQueues,
  createQueue,
  updateQueue,
  deleteQueue,
  pauseQueue,
  resumeQueue,
  getQueueStats,
  getQueueById
};
