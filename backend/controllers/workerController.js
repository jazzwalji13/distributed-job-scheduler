const asyncHandler = require('../utils/asyncHandler');
const {
  registerWorker,
  updateHeartbeat,
  listWorkers,
  updateWorkerStatus,
  updateWorker,
  deleteWorker
} = require('../services/workerService');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

const register = asyncHandler(async (req, res) => {
  const worker = await registerWorker(req.validated.body);
  const io = req.app.get('io');
  if (io) {
    io.emit('worker.registered', { workerId: worker.id, status: worker.status });
  }
  res.status(201).json({ success: true, data: { worker } });
});

const heartbeat = asyncHandler(async (req, res) => {
  const worker = await updateHeartbeat(req.validated.body.workerId, req.validated.body);
  const io = req.app.get('io');
  if (io) {
    io.emit('worker.heartbeat', { workerId: worker.id, status: worker.status });
  }
  res.status(200).json({ success: true, data: { worker } });
});

const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const result = await listWorkers(pagination, req.query);
  res.status(200).json({ success: true, ...buildPaginatedResponse(result.items, result.total, pagination) });
});

const status = asyncHandler(async (req, res) => {
  const worker = await updateWorkerStatus(req.validated.params.workerId, req.validated.body.status);
  const io = req.app.get('io');
  if (io) {
    io.emit('worker.status', { workerId: worker.id, status: worker.status });
  }
  res.status(200).json({ success: true, data: { worker } });
});

const update = asyncHandler(async (req, res) => {
  const worker = await updateWorker(req.validated.params.workerId, req.validated.body);
  res.status(200).json({ success: true, data: { worker } });
});

const remove = asyncHandler(async (req, res) => {
  await deleteWorker(req.validated.params.workerId);
  res.status(204).send();
});

module.exports = {
  register,
  heartbeat,
  list,
  status,
  update,
  remove
};
