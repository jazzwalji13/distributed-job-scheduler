const prisma = require('../models/prisma');
const { AppError } = require('../utils/errors');
const { createSlug } = require('../utils/security');

async function buildUniqueOrganizationSlug(name, preferredSlug) {
  const base = createSlug(preferredSlug || name || 'organization');
  let candidate = base;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

async function verifyOrganizationAccess(user, organizationId) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: true
    }
  });

  if (!organization) {
    throw new AppError('Organization not found', 404, 'ORGANIZATION_NOT_FOUND');
  }

  if (user.role === 'SUPER_ADMIN' || organization.ownerId === user.id) {
    return organization;
  }

  const membership = organization.members.find((member) => member.userId === user.id);
  if (!membership) {
    throw new AppError('Access denied for this organization', 403, 'FORBIDDEN');
  }

  return organization;
}

async function listOrganizations(user, pagination) {
  if (user.role === 'SUPER_ADMIN') {
    const [total, items] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          owner: true,
          members: true,
          _count: {
            select: { projects: true, queues: true, jobs: true }
          }
        }
      })
    ]);

    return { total, items };
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    select: { organizationId: true }
  });
  const organizationIds = memberships.map((membership) => membership.organizationId);

  const [total, items] = await Promise.all([
    prisma.organization.count({ where: { id: { in: organizationIds } } }),
    prisma.organization.findMany({
      where: { id: { in: organizationIds } },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      include: {
        owner: true,
        members: true,
        _count: {
          select: { projects: true, queues: true, jobs: true }
        }
      }
    })
  ]);

  return { total, items };
}

async function createOrganization(user, data) {
  const slug = await buildUniqueOrganizationSlug(data.name, data.slug);
  const organization = await prisma.organization.create({
    data: {
      name: data.name,
      slug,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER'
        }
      }
    },
    include: {
      owner: true,
      members: true
    }
  });

  return organization;
}

async function updateOrganization(user, organizationId, data) {
  const organization = await verifyOrganizationAccess(user, organizationId);
  const slug = data.slug ? await buildUniqueOrganizationSlug(data.name || organization.name, data.slug) : undefined;

  return prisma.organization.update({
    where: { id: organization.id },
    data: {
      name: data.name ?? organization.name,
      slug: slug ?? organization.slug
    },
    include: {
      owner: true,
      members: true
    }
  });
}

async function deleteOrganization(user, organizationId) {
  const organization = await verifyOrganizationAccess(user, organizationId);
  if (user.role !== 'SUPER_ADMIN' && organization.ownerId !== user.id) {
    throw new AppError('Only the owner can delete the organization', 403, 'FORBIDDEN');
  }

  await prisma.organization.delete({ where: { id: organizationId } });
  return { deleted: true };
}

async function addMember(user, organizationId, userId, role = 'MEMBER') {
  const organization = await verifyOrganizationAccess(user, organizationId);

  return prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId
      }
    },
    create: {
      organizationId: organization.id,
      userId,
      role
    },
    update: {
      role
    }
  });
}

async function removeMember(user, organizationId, userId) {
  const organization = await verifyOrganizationAccess(user, organizationId);
  await prisma.organizationMember.delete({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId
      }
    }
  });

  return { removed: true };
}

async function updateMemberRole(user, organizationId, userId, role) {
  const organization = await verifyOrganizationAccess(user, organizationId);
  return prisma.organizationMember.update({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId
      }
    },
    data: { role }
  });
}

module.exports = {
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  addMember,
  removeMember,
  updateMemberRole,
  verifyOrganizationAccess
};
