const { Prisma } = require('@prisma/client');
const cron = require('node-cron');
const prisma = require('../models/prisma');
const { AppError } = require('../utils/errors');
const { verifyOrganizationAccess } = require('./organizationService');
const { getQueueById } = require('./queueService');

const JOB_STATUSES = ['QUEUED', 'SCHEDULED', 'CLAIMED', 'RUNNING', 'COMPLETED', 'FAILED', 'DEAD_LETTER'];

function normalizeRetryPolicy(policy) {
  return {
    strategy: policy?.strategy || 'EXPONENTIAL',
    maxAttempts: policy?.maxAttempts || 3,
    initialDelaySeconds: policy?.initialDelaySeconds || 30,
    multiplier: policy?.multiplier || 2,
    maxDelaySeconds: policy?.maxDelaySeconds || 3600,
    jitter: policy?.jitter ?? true
  };
}

function calculateRetryDelay(policy, attemptNumber) {
  const retryPolicy = normalizeRetryPolicy(policy);
  let delaySeconds = retryPolicy.initialDelaySeconds;

  if (retryPolicy.strategy === 'LINEAR') {
    delaySeconds = retryPolicy.initialDelaySeconds * attemptNumber;
  } else if (retryPolicy.strategy === 'EXPONENTIAL') {
    delaySeconds = retryPolicy.initialDelaySeconds * (retryPolicy.multiplier ** Math.max(attemptNumber - 1, 0));
  }

  delaySeconds = Math.min(delaySeconds, retryPolicy.maxDelaySeconds);

  if (retryPolicy.jitter) {
    const jitter = Math.random() * 0.2 + 0.9;
    delaySeconds = Math.max(1, Math.floor(delaySeconds * jitter));
  }

  return delaySeconds;
}

async function loadJob(jobId) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      organization: true,
      project: true,
      queue: {
        include: { retryPolicy: true }
      },
      retryPolicy: true,
      executions: {
        orderBy: { attemptNumber: 'desc' },
        take: 1
      },
      scheduledJob: true,
      deadLetter: true
    }
  });

  if (!job) {
    throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
  }

  return job;
}

async function createSingleJob(user, payload) {
  await verifyOrganizationAccess(user, payload.organizationId);
  const queue = await getQueueById(payload.queueId);
  if (queue.organizationId !== payload.organizationId) {
    throw new AppError('Queue does not belong to the organization', 400, 'QUEUE_MISMATCH');
  }

  const retryPolicy = payload.retryPolicyId
    ? await prisma.retryPolicy.findUnique({ where: { id: payload.retryPolicyId } })
    : queue.retryPolicy;

  const normalizedPolicy = normalizeRetryPolicy(retryPolicy || queue.retryPolicy);
  const baseRunAt = payload.runAt ? new Date(payload.runAt) : new Date();
  const isDelayed = payload.type === 'DELAYED';
  const isScheduled = payload.type === 'SCHEDULED';
  const isRecurring = payload.type === 'RECURRING';
  const isImmediate = payload.type === 'IMMEDIATE';

  if (isRecurring && !payload.cronExpression) {
    throw new AppError('Recurring jobs require a cron expression', 400, 'INVALID_JOB_SCHEDULE');
  }

  if (isRecurring && !cron.validate(payload.cronExpression)) {
    throw new AppError('Invalid cron expression', 400, 'INVALID_CRON_EXPRESSION');
  }

  const status = isImmediate ? 'QUEUED' : 'SCHEDULED';
  const runAt = isImmediate ? new Date() : baseRunAt;

  const job = await prisma.job.create({
    data: {
      organizationId: payload.organizationId,
      projectId: payload.projectId,
      queueId: payload.queueId,
      retryPolicyId: payload.retryPolicyId || queue.retryPolicyId || null,
      createdById: user.id,
      type: payload.type,
      status,
      priority: payload.priority ?? 0,
      payload: payload.payload,
      maxAttempts: payload.maxAttempts || normalizedPolicy.maxAttempts,
      runAt,
      scheduledFor: isDelayed || isScheduled || isRecurring ? runAt : null,
      shardKey: payload.shardKey ?? queue.shardKey ?? null,
      dependencyJobId: payload.dependencyJobId || null
    },
    include: {
      organization: true,
      project: true,
      queue: true,
      retryPolicy: true,
      scheduledJob: true
    }
  });

  if (isRecurring) {
    await prisma.scheduledJob.create({
      data: {
        queueId: payload.queueId,
        jobId: job.id,
        cronExpression: payload.cronExpression,
        timezone: payload.timezone || 'UTC',
        nextRunAt: runAt,
        enabled: true
      }
    });
  }

  return job;
}

async function createJob(user, payload) {
  if (payload.batch?.items?.length) {
    const batchGroupId = payload.batch.batchGroupId || `batch_${Date.now()}`;
    const jobs = [];

    for (const item of payload.batch.items) {
      const job = await createSingleJob(user, {
        ...payload,
        payload: item,
        type: payload.type === 'IMMEDIATE' ? 'BATCH' : payload.type,
        batch: undefined,
        shardKey: payload.shardKey || null
      });
      jobs.push(job);
    }

    await prisma.job.updateMany({
      where: { id: { in: jobs.map((job) => job.id) } },
      data: { batchGroupId }
    });

    return {
      batchGroupId,
      jobs
    };
  }

  return createSingleJob(user, payload);
}

async function listJobs(user, filters, pagination) {
  const where = {};
  if (filters.organizationId) {
    await verifyOrganizationAccess(user, filters.organizationId);
    where.organizationId = filters.organizationId;
  }
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.queueId) where.queueId = filters.queueId;
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.search) {
    where.OR = [
      { id: { contains: filters.search, mode: 'insensitive' } },
      { batchGroupId: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const [total, items] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      include: {
        organization: true,
        project: true,
        queue: true,
        retryPolicy: true,
        executions: {
          orderBy: { attemptNumber: 'desc' },
          take: 1
        },
        deadLetter: true
      }
    })
  ]);

  return { total, items };
}

async function claimJobs({ workerId, queueIds = [], limit = 5 }) {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) {
    throw new AppError('Worker not found', 404, 'WORKER_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    const queues = await tx.queue.findMany({
      where: {
        status: 'ACTIVE',
        ...(queueIds.length ? { id: { in: queueIds } } : {})
      },
      include: { retryPolicy: true },
      orderBy: { priority: 'desc' }
    });

    const claimedJobs = [];
    const now = new Date();

    for (const queue of queues) {
      if (claimedJobs.length >= limit) {
        break;
      }

      const activeCount = await tx.job.count({
        where: {
          queueId: queue.id,
          status: { in: ['CLAIMED', 'RUNNING'] }
        }
      });

      const available = Math.min(limit - claimedJobs.length, Math.max(queue.concurrencyLimit - activeCount, 0));
      if (available <= 0) {
        continue;
      }

      const rows = await tx.$queryRaw(
        Prisma.sql`
          WITH candidates AS (
            SELECT j.id
            FROM "Job" j
            WHERE j."queueId" = ${queue.id}
              AND j."status" IN ('QUEUED', 'SCHEDULED')
              AND j."runAt" <= ${now}
              AND NOT EXISTS (
                SELECT 1
                FROM "Job" dependency
                WHERE dependency.id = j."dependencyJobId"
                  AND dependency."status" <> 'COMPLETED'
              )
              ${queue.shardKey ? Prisma.sql`AND (j."shardKey" IS NULL OR j."shardKey" = ${queue.shardKey})` : Prisma.empty}
            ORDER BY j."priority" DESC, j."runAt" ASC, j."createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT ${available}
          )
          UPDATE "Job" j
          SET "status" = 'CLAIMED',
              "claimedAt" = ${now},
              "claimedByWorkerId" = ${workerId},
              "updatedAt" = ${now}
          FROM candidates
          WHERE j.id = candidates.id
          RETURNING j.*;
        `
      );

      claimedJobs.push(...rows);
    }

    return claimedJobs;
  });
}

async function markRunning(jobId, workerId) {
  const job = await loadJob(jobId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.job.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        attempts: { increment: 1 },
        claimedByWorkerId: workerId
      }
    });

    const execution = await tx.jobExecution.create({
      data: {
        jobId,
        workerId,
        attemptNumber: job.attempts + 1,
        status: 'RUNNING',
        startedAt: new Date(),
        input: job.payload
      }
    });

    return {
      job: updated,
      execution
    };
  });
}

async function addJobLog(jobId, level, message, metadata = null, executionId = null) {
  return prisma.jobLog.create({
    data: {
      jobId,
      executionId,
      level,
      message,
      metadata
    }
  });
}

async function completeJob(jobId, executionId, output) {
  const execution = await prisma.jobExecution.findUnique({ where: { id: executionId } });
  const finishedAt = new Date();
  await prisma.jobExecution.update({
    where: { id: executionId },
    data: {
      status: 'COMPLETED',
      finishedAt,
      durationMs: execution?.startedAt ? finishedAt.getTime() - new Date(execution.startedAt).getTime() : null,
      output
    }
  });

  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      result: output,
      finishedAt,
      error: null
    }
  });
}

async function moveToDeadLetter(job, executionId, reason, error) {
  const execution = await prisma.jobExecution.findUnique({ where: { id: executionId } });
  const finishedAt = new Date();
  await prisma.jobExecution.update({
    where: { id: executionId },
    data: {
      status: 'FAILED',
      finishedAt,
      durationMs: execution?.startedAt ? finishedAt.getTime() - new Date(execution.startedAt).getTime() : null,
      error
    }
  });

  await prisma.deadLetterQueue.upsert({
    where: { jobId: job.id },
    create: {
      jobId: job.id,
      reason,
      lastError: error
    },
    update: {
      reason,
      lastError: error,
      failedAt: finishedAt
    }
  });

  return prisma.job.update({
    where: { id: job.id },
    data: {
      status: 'DEAD_LETTER',
      finishedAt,
      error
    }
  });
}

async function failJob(jobId, executionId, error) {
  const job = await loadJob(jobId);
  const retryPolicy = normalizeRetryPolicy(job.retryPolicy || job.queue?.retryPolicy);
  const nextAttempt = job.attempts;
  const shouldRetry = nextAttempt < Math.min(job.maxAttempts, retryPolicy.maxAttempts);
  const failurePayload = {
    message: error?.message || 'Job failed',
    stack: error?.stack || null,
    code: error?.code || 'JOB_FAILED'
  };

  if (shouldRetry) {
    const delaySeconds = calculateRetryDelay(retryPolicy, nextAttempt);
    const nextRunAt = new Date(Date.now() + delaySeconds * 1000);
    const execution = await prisma.jobExecution.findUnique({ where: { id: executionId } });

    await prisma.jobExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        durationMs: execution?.startedAt ? new Date().getTime() - new Date(execution.startedAt).getTime() : null,
        error: failurePayload
      }
    });

    return prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'SCHEDULED',
        nextRetryAt: nextRunAt,
        runAt: nextRunAt,
        error: failurePayload,
        claimedByWorkerId: null,
        claimedAt: null,
        startedAt: null
      }
    });
  }

  return moveToDeadLetter(job, executionId, failurePayload.message, failurePayload);
}

async function promoteDueJobs() {
  const now = new Date();
  return prisma.job.updateMany({
    where: {
      status: 'SCHEDULED',
      runAt: { lte: now },
      scheduledJob: { is: null }
    },
    data: {
      status: 'QUEUED'
    }
  });
}

async function createRecurringJobRun(scheduledJobId) {
  const scheduledJob = await prisma.scheduledJob.findUnique({
    where: { id: scheduledJobId },
    include: {
      job: true,
      queue: true
    }
  });

  if (!scheduledJob || !scheduledJob.enabled) {
    return null;
  }

  const templateJob = scheduledJob.job;
  const run = await prisma.job.create({
    data: {
      organizationId: templateJob.organizationId,
      projectId: templateJob.projectId,
      queueId: templateJob.queueId,
      retryPolicyId: templateJob.retryPolicyId,
      createdById: templateJob.createdById,
      parentJobId: templateJob.parentJobId,
      dependencyJobId: templateJob.dependencyJobId,
      batchGroupId: templateJob.batchGroupId,
      type: 'RECURRING',
      status: 'QUEUED',
      priority: templateJob.priority,
      payload: templateJob.payload,
      maxAttempts: templateJob.maxAttempts,
      runAt: new Date(),
      shardKey: templateJob.shardKey
    }
  });

  await prisma.scheduledJob.update({
    where: { id: scheduledJobId },
    data: {
      lastRunAt: new Date()
    }
  });

  return run;
}

async function getJobLogs(jobId, pagination) {
  const [total, items] = await Promise.all([
    prisma.jobLog.count({ where: { jobId } }),
    prisma.jobLog.findMany({
      where: { jobId },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: pagination.sortOrder }
    })
  ]);

  return { total, items };
}

async function getDeadLetterJobs(user, filters, pagination) {
  const where = {};
  if (filters.organizationId) {
    await verifyOrganizationAccess(user, filters.organizationId);
    const jobIds = await prisma.job.findMany({
      where: { organizationId: filters.organizationId },
      select: { id: true }
    });
    where.jobId = { in: jobIds.map((job) => job.id) };
  }

  const [total, items] = await Promise.all([
    prisma.deadLetterQueue.count({ where }),
    prisma.deadLetterQueue.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { failedAt: pagination.sortOrder },
      include: { job: true }
    })
  ]);

  return { total, items };
}

async function requeueDeadLetter(user, jobId) {
  const deadLetter = await prisma.deadLetterQueue.findUnique({
    where: { jobId },
    include: { job: true }
  });

  if (!deadLetter) {
    throw new AppError('Dead letter job not found', 404, 'DEAD_LETTER_NOT_FOUND');
  }

  await verifyOrganizationAccess(user, deadLetter.job.organizationId);

  return prisma.$transaction(async (tx) => {
    await tx.deadLetterQueue.delete({ where: { jobId } });
    return tx.job.update({
      where: { id: jobId },
      data: {
        status: 'QUEUED',
        attempts: 0,
        nextRetryAt: null,
        error: null,
        claimedAt: null,
        claimedByWorkerId: null,
        startedAt: null,
        finishedAt: null
      }
    });
  });
}

async function deleteJob(user, jobId) {
  const job = await loadJob(jobId);
  await verifyOrganizationAccess(user, job.organizationId);

  return prisma.$transaction(async (tx) => {
    await tx.deadLetterQueue.deleteMany({ where: { jobId } });
    await tx.jobLog.deleteMany({ where: { jobId } });
    await tx.jobExecution.deleteMany({ where: { jobId } });
    await tx.scheduledJob.deleteMany({ where: { jobId } });
    return tx.job.delete({ where: { id: jobId } });
  });
}

async function recoverStaleJobs(timeoutMs = 60000) {
  const threshold = new Date(Date.now() - timeoutMs);
  const staleWorkers = await prisma.worker.findMany({
    where: {
      lastSeenAt: { lt: threshold },
      status: { in: ['ONLINE', 'DRAINING'] }
    },
    select: { id: true }
  });

  const staleWorkerIds = staleWorkers.map((worker) => worker.id);
  if (!staleWorkerIds.length) {
    return { recovered: 0 };
  }

  const result = await prisma.job.updateMany({
    where: {
      claimedByWorkerId: { in: staleWorkerIds },
      status: { in: ['CLAIMED', 'RUNNING'] }
    },
    data: {
      status: 'QUEUED',
      claimedAt: null,
      claimedByWorkerId: null,
      startedAt: null,
      finishedAt: null
    }
  });

  return {
    recovered: result.count
  };
}

module.exports = {
  JOB_STATUSES,
  createJob,
  listJobs,
  loadJob,
  claimJobs,
  markRunning,
  completeJob,
  failJob,
  addJobLog,
  getJobLogs,
  promoteDueJobs,
  createRecurringJobRun,
  getDeadLetterJobs,
  requeueDeadLetter,
  deleteJob,
  calculateRetryDelay,
  recoverStaleJobs
};
