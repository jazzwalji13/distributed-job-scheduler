const prisma = require('../models/prisma');

async function acquireLock(lockKey, ownerId, ttlMs = 60000) {
  const now = new Date();
  const expiresAt = new Date(Date.now() + ttlMs);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.distributedLock.findUnique({ where: { lockKey } });

    if (!existing) {
      await tx.distributedLock.create({
        data: {
          lockKey,
          ownerId,
          expiresAt
        }
      });
      return true;
    }

    if (existing.ownerId === ownerId || existing.expiresAt <= now) {
      await tx.distributedLock.update({
        where: { lockKey },
        data: {
          ownerId,
          expiresAt
        }
      });
      return true;
    }

    return false;
  });
}

async function renewLock(lockKey, ownerId, ttlMs = 60000) {
  const expiresAt = new Date(Date.now() + ttlMs);
  const updated = await prisma.distributedLock.updateMany({
    where: {
      lockKey,
      ownerId,
      expiresAt: { gt: new Date() }
    },
    data: { expiresAt }
  });

  return updated.count > 0;
}

async function releaseLock(lockKey, ownerId) {
  const result = await prisma.distributedLock.deleteMany({
    where: {
      lockKey,
      ownerId
    }
  });

  return result.count > 0;
}

module.exports = {
  acquireLock,
  renewLock,
  releaseLock
};
