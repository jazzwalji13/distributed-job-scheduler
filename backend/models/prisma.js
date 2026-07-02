const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
    });

    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (event) => {
        logger.debug('prisma-query', {
          query: event.query,
          params: event.params,
          duration: event.duration,
          target: event.target
        });
      });
    }
  }

  return prisma;
}

module.exports = getPrismaClient();
module.exports.getPrismaClient = getPrismaClient;
