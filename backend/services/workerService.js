const prisma = require('../models/prisma');
const { AppError } = require('../utils/errors');

async function registerWorker(data) {
  const worker = await prisma.worker.create({
    data: {
      name: data.name,
      host: data.host,
      pid: data.pid,
      capacity: data.capacity ?? 5,
      version: data.version || null,
      status: 'ONLINE',
      lastSeenAt: new Date()
    }
  });

  return worker;
}

async function updateHeartbeat(workerId, payload = {}) {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) {
    throw new AppError('Worker not found', 404, 'WORKER_NOT_FOUND');
  }

  await prisma.workerHeartbeat.create({
    data: {
      workerId,
      cpuUsage: payload.cpuUsage ?? null,
      memoryUsage: payload.memoryUsage ?? null,
      details: payload.details || null
    }
  });

  return prisma.worker.update({
    where: { id: workerId },
    data: {
      lastSeenAt: new Date(),
      status: 'ONLINE',
      concurrencyRunning: payload.concurrencyRunning ?? worker.concurrencyRunning
    }
  });
}

async function listWorkers(pagination, filters = {}) {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  const [total, items] = await Promise.all([
    prisma.worker.count({ where }),
    prisma.worker.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      include: {
        heartbeats: {
          orderBy: { seenAt: 'desc' },
          take: 1
        },
        _count: {
          select: { executions: true }
        }
      }
    })
  ]);

  console.log("Workers from DB:");
  console.table(
    items.map((w) => ({
      id: w.id,
      name: w.name,
      host: w.host,
      status: w.status
    }))
  );

  return { total, items };
}

async function updateWorkerStatus(workerId, status) {
  return prisma.worker.update({
    where: { id: workerId },
    data: { status, stoppingAt: status === 'OFFLINE' ? new Date() : null }
  });
}

async function updateWorker(workerId, updates) {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) {
    throw new AppError('Worker not found', 404, 'WORKER_NOT_FOUND');
  }

  const allowed = {};
  if (updates.name !== undefined) allowed.name = updates.name;
  if (updates.host !== undefined) allowed.host = updates.host;
  if (updates.capacity !== undefined) allowed.capacity = updates.capacity;
  if (updates.version !== undefined) allowed.version = updates.version;

  return prisma.worker.update({
    where: { id: workerId },
    data: allowed
  });
}

async function deleteWorker(workerId) {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) {
    throw new AppError('Worker not found', 404, 'WORKER_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    await tx.workerHeartbeat.deleteMany({ where: { workerId } });
    await tx.jobExecution.updateMany({ where: { workerId }, data: { workerId: null } });
    return tx.worker.delete({ where: { id: workerId } });
  });
}

async function deactivateStaleWorkers(timeoutMs = 60000) {
  const threshold = new Date(Date.now() - timeoutMs);
  return prisma.worker.updateMany({
    where: {
      lastSeenAt: { lt: threshold },
      status: { in: ['ONLINE', 'DRAINING'] }
    },
    data: {
      status: 'OFFLINE'
    }
  });
}

module.exports = {
  registerWorker,
  updateHeartbeat,
  listWorkers,
  updateWorkerStatus,
  updateWorker,
  deleteWorker,
  deactivateStaleWorkers
};
