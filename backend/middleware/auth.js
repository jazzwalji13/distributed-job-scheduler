const prisma = require('../models/prisma');
const { unauthorized, forbidden } = require('../utils/errors');
const { verifyAccessToken } = require('../utils/security');

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token || header.toLowerCase().indexOf('bearer ') !== 0) {
    return next(unauthorized('Missing bearer token'));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      return next(unauthorized('Invalid token subject'));
    }

    req.user = user;
    req.tokenPayload = payload;
    return next();
  } catch (error) {
    return next(unauthorized('Invalid or expired token'));
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized());
    }

    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return next(forbidden('Insufficient role'));
  };
}

function requireOrgAccess(paramName = 'organizationId') {
  return async (req, res, next) => {
    if (!req.user) {
      return next(unauthorized());
    }

    const organizationId = req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (!organizationId) {
      return next(forbidden('Organization context is required'));
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: req.user.id
        }
      }
    });

    if (!membership) {
      return next(forbidden('Access denied for this organization'));
    }

    req.organizationMembership = membership;
    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  requireOrgAccess
};
