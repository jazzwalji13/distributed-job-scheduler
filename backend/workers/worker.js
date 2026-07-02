const os = require('os');
const config = require('../utils/config');
const logger = require('../utils/logger');
const { registerWorker, updateHeartbeat, updateWorkerStatus } = require('../services/workerService');
const { claimJobs, markRunning, completeJob, failJob, addJobLog } = require('../services/jobService');
const { executeJob } = require('./executor');
const { io: createSocketClient } = require('socket.io-client');

class WorkerRuntime {
  constructor() {
    this.worker = null;
    this.runningJobIds = new Set();
    this.pollTimer = null;
    this.heartbeatTimer = null;
    this.shuttingDown = false;
    this.polling = false;
  }

  async start() {
    this.worker = await registerWorker({
      name: process.env.WORKER_NAME || `${os.hostname()}-${process.pid}`,
      host: os.hostname(),
      pid: process.pid,
      capacity: config.workerBatchSize,
      version: process.env.APP_VERSION || '1.0.0'
    });

    logger.info('worker-registered', { workerId: this.worker.id, capacity: this.worker.capacity });
    this.socket = createSocketClient(process.env.SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      logger.info('worker-socket-connected', { workerId: this.worker.id, socketId: this.socket.id });
    });

    await this.sendHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat().catch((error) => {
        logger.error('worker-heartbeat-failed', { message: error.message, stack: error.stack });
      });
    }, config.workerHeartbeatIntervalMs);

    const pollLoop = async () => {
      if (this.shuttingDown) {
        return;
      }

      if (!this.polling) {
        this.polling = true;
        try {
          await this.pollOnce();
        } catch (error) {
          logger.error('worker-poll-failed', { message: error.message, stack: error.stack });
        } finally {
          this.polling = false;
        }
      }

      this.pollTimer = setTimeout(pollLoop, config.workerPollIntervalMs);
    };

    pollLoop().catch((error) => {
      logger.error('worker-loop-failed', { message: error.message, stack: error.stack });
    });

    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async sendHeartbeat() {
    if (!this.worker) {
      return;
    }

    const memoryUsage = process.memoryUsage();
    await updateHeartbeat(this.worker.id, {
      concurrencyRunning: this.runningJobIds.size,
      cpuUsage: null,
      memoryUsage: Number(((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)),
      details: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      }
    });

    if (this.socket?.connected) {
      this.socket.emit('worker.heartbeat', {
        workerId: this.worker.id,
        concurrencyRunning: this.runningJobIds.size,
        memoryUsage: Number(((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2))
      });
    }
  }

  async pollOnce() {
    if (!this.worker || this.shuttingDown) {
      return;
    }

    const availableSlots = Math.max(this.worker.capacity - this.runningJobIds.size, 0);
    if (availableSlots <= 0) {
      return;
    }

    const jobs = await claimJobs({
      workerId: this.worker.id,
      limit: availableSlots
    });

    if (!jobs.length) {
      return;
    }

    await Promise.all(jobs.map((job) => this.executeClaimedJob(job)));
  }

  async executeClaimedJob(job) {
    this.runningJobIds.add(job.id);
    await this.sendHeartbeat();

    const { execution } = await markRunning(job.id, this.worker.id);
    await addJobLog(job.id, 'INFO', 'Job execution started', { executionId: execution.id }, execution.id);

    if (this.socket?.connected) {
      this.socket.emit('job.started', {
        workerId: this.worker.id,
        jobId: job.id,
        executionId: execution.id
      });
    }

    try {
      const result = await executeJob(job);
      await completeJob(job.id, execution.id, result);
      await addJobLog(job.id, 'INFO', 'Job completed successfully', { result }, execution.id);
      logger.info('job-completed', { jobId: job.id, executionId: execution.id });

      if (this.socket?.connected) {
        this.socket.emit('job.completed', {
          workerId: this.worker.id,
          jobId: job.id,
          executionId: execution.id,
          result
        });
      }
    } catch (error) {
      await failJob(job.id, execution.id, error);
      await addJobLog(job.id, 'ERROR', 'Job failed', { message: error.message, stack: error.stack }, execution.id);
      logger.error('job-failed', { jobId: job.id, executionId: execution.id, message: error.message });

      if (this.socket?.connected) {
        this.socket.emit('job.failed', {
          workerId: this.worker.id,
          jobId: job.id,
          executionId: execution.id,
          message: error.message
        });
      }
    } finally {
      this.runningJobIds.delete(job.id);
      await this.sendHeartbeat();
    }
  }

  async shutdown() {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;
    logger.info('worker-shutdown-started', { workerId: this.worker?.id });

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.worker) {
      await updateWorkerStatus(this.worker.id, 'DRAINING');
      while (this.runningJobIds.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      await updateHeartbeat(this.worker.id, { concurrencyRunning: 0 });
      await updateWorkerStatus(this.worker.id, 'OFFLINE');
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    logger.info('worker-shutdown-complete', { workerId: this.worker?.id });
    process.exit(0);
  }
}

async function main() {
  const runtime = new WorkerRuntime();
  await runtime.start();
}

main().catch((error) => {
  logger.error('worker-fatal', { message: error.message, stack: error.stack });
  process.exit(1);
});
