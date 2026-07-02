const prisma = require('../models/prisma');
const { AppError } = require('../utils/errors');
const { createSlug } = require('../utils/security');
const { verifyOrganizationAccess } = require('./organizationService');

async function buildUniqueProjectKey(organizationId, preferredKey, name) {
  const base = createSlug(preferredKey || name || 'project').replace(/-/g, '_');
  let candidate = base;
  let counter = 1;

  while (await prisma.project.findFirst({ where: { organizationId, key: candidate } })) {
    candidate = `${base}_${counter}`;
    counter += 1;
  }

  return candidate;
}

async function listProjects(user, organizationId, pagination) {
  await verifyOrganizationAccess(user, organizationId);

  const [total, items] = await Promise.all([
    prisma.project.count({ where: { organizationId } }),
    prisma.project.findMany({
      where: { organizationId },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      include: {
        organization: true,
        createdBy: true,
        _count: { select: { queues: true, jobs: true } }
      }
    })
  ]);

  return { total, items };
}

async function createProject(user, data) {
  await verifyOrganizationAccess(user, data.organizationId);
  const key = await buildUniqueProjectKey(data.organizationId, data.key, data.name);

  return prisma.project.create({
    data: {
      organizationId: data.organizationId,
      createdById: user.id,
      name: data.name,
      key,
      description: data.description || null
    },
    include: {
      organization: true,
      createdBy: true
    }
  });
}

async function updateProject(user, projectId, data) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  await verifyOrganizationAccess(user, project.organizationId);
  const key = data.key ? await buildUniqueProjectKey(project.organizationId, data.key, data.name || project.name) : project.key;

  return prisma.project.update({
    where: { id: projectId },
    data: {
      name: data.name ?? project.name,
      key,
      description: data.description !== undefined ? data.description : project.description
    },
    include: {
      organization: true,
      createdBy: true
    }
  });
}

async function deleteProject(user, projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  await verifyOrganizationAccess(user, project.organizationId);
  await prisma.project.delete({ where: { id: projectId } });
  return { deleted: true };
}

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject
};
