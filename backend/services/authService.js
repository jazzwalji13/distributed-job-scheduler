const prisma = require('../models/prisma');
const { AppError } = require('../utils/errors');
const { hashPassword, verifyPassword, signAccessToken, createSlug, generateId } = require('../utils/security');

async function buildUniqueOrganizationSlug(name) {
  const base = createSlug(name || 'organization');
  let candidate = base;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

async function register({ email, password, fullName, organizationName }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(password);
  const organizationSlug = await buildUniqueOrganizationSlug(organizationName || `${fullName}'s Workspace`);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: 'MEMBER'
    }
  });

  const organization = await prisma.organization.create({
    data: {
      name: organizationName || `${fullName}'s Workspace`,
      slug: organizationSlug,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER'
        }
      }
    }
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  const hydratedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      memberships: {
        include: {
          organization: true
        }
      },
      ownedOrganizations: true
    }
  });

  return {
    user: hydratedUser,
    organization,
    accessToken
  };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          organization: true
        }
      },
      ownedOrganizations: true
    }
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  return {
    user,
    accessToken
  };
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: true
        }
      },
      ownedOrganizations: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
}

module.exports = {
  register,
  login,
  getCurrentUser
};
