const prisma = require('../models/prisma');
const { verifyOrganizationAccess } = require('./organizationService');

async function listJobLogs(user, filters, pagination) {
  if (filters.organizationId) {
    await verifyOrganizationAccess(user, filters.organizationId);
  }

  const where = {};
  if (filters.organizationId) {
    const jobIds = await prisma.job.findMany({
      where: { organizationId: filters.organizationId },
      select: { id: true }
    });
    where.jobId = { in: jobIds.map((job) => job.id) };
  }
  if (filters.jobId) {
    where.jobId = filters.jobId;
  }
  if (filters.level) {
    where.level = filters.level;
  }

  const [total, items] = await Promise.all([
    prisma.jobLog.count({ where }),
    prisma.jobLog.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: pagination.sortOrder },
      include: {
        job: true,
        execution: true
      }
    })
  ]);

  return { total, items };
}

module.exports = {
  listJobLogs
};
