const http = require('http');
const { Server } = require('socket.io');
const config = require('./utils/config');
const logger = require('./utils/logger');
const createApp = require('./app');

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      credentials: true
    }
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    logger.info('socket-connected', { socketId: socket.id });

    socket.on('disconnect', () => {
      logger.info('socket-disconnected', { socketId: socket.id });
    });
  });

  server.listen(config.port, () => {
    logger.info('server-started', {
      port: config.port,
      env: config.env
    });
  });
}

startServer().catch((error) => {
  logger.error('server-failed-to-start', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});
