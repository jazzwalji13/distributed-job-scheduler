const asyncHandler = require('../utils/asyncHandler');
const {
  listQueues,
  createQueue,
  updateQueue,
  deleteQueue,
  pauseQueue,
  resumeQueue,
  getQueueStats
} = require('../services/queueService');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const result = await listQueues(req.user, req.query, pagination);
  res.status(200).json({ success: true, ...buildPaginatedResponse(result.items, result.total, pagination) });
});

const create = asyncHandler(async (req, res) => {
  const queue = await createQueue(req.user, req.validated.body);
  const io = req.app.get('io');
  if (io) {
    io.emit('queue.updated', { queueId: queue.id, organizationId: queue.organizationId, projectId: queue.projectId });
  }
  res.status(201).json({ success: true, data: { queue } });
});

const update = asyncHandler(async (req, res) => {
  const queue = await updateQueue(req.user, req.validated.params.queueId || req.validated.params.id, req.validated.body);
  const io = req.app.get('io');
  if (io) {
    io.emit('queue.updated', { queueId: queue.id, organizationId: queue.organizationId, projectId: queue.projectId });
  }
  res.status(200).json({ success: true, data: { queue } });
});

const remove = asyncHandler(async (req, res) => {
  const result = await deleteQueue(req.user, req.validated.params.queueId);
  const io = req.app.get('io');
  if (io) {
    io.emit('queue.deleted', { queueId: req.validated.params.queueId });
  }
  res.status(200).json({ success: true, data: result });
});

const pause = asyncHandler(async (req, res) => {
  const queue = await pauseQueue(req.user, req.validated.params.queueId, req.validated.body?.reason);
  const io = req.app.get('io');
  if (io) {
    io.emit('queue.updated', { queueId: queue.id, status: queue.status });
  }
  res.status(200).json({ success: true, data: { queue } });
});

const resume = asyncHandler(async (req, res) => {
  const queue = await resumeQueue(req.user, req.validated.params.queueId);
  const io = req.app.get('io');
  if (io) {
    io.emit('queue.updated', { queueId: queue.id, status: queue.status });
  }
  res.status(200).json({ success: true, data: { queue } });
});

const stats = asyncHandler(async (req, res) => {
  const result = await getQueueStats(req.user, req.validated.params.queueId);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  list,
  create,
  update,
  remove,
  pause,
  resume,
  stats
};
