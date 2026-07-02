const asyncHandler = require('../utils/asyncHandler');
const {
  createJob,
  listJobs,
  loadJob,
  claimJobs,
  getJobLogs,
  requeueDeadLetter,
  deleteJob
} = require('../services/jobService');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const result = await listJobs(req.user, req.query, pagination);
  res.status(200).json({ success: true, ...buildPaginatedResponse(result.items, result.total, pagination) });
});

const create = asyncHandler(async (req, res) => {
  const job = await createJob(req.user, req.validated.body);

  const io = req.app.get('io');
  if (io) {
    io.emit('job.created', {
      organizationId: req.validated.body.organizationId,
      projectId: req.validated.body.projectId,
      queueId: req.validated.body.queueId,
      type: Array.isArray(job.jobs) ? 'BATCH' : job.type
    });
  }

  res.status(201).json({ success: true, data: { job } });
});

const details = asyncHandler(async (req, res) => {
  const job = await loadJob(req.validated.params.jobId);
  res.status(200).json({ success: true, data: { job } });
});

const logs = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const result = await getJobLogs(req.validated.params.jobId, pagination);
  res.status(200).json({ success: true, ...buildPaginatedResponse(result.items, result.total, pagination) });
});

const claim = asyncHandler(async (req, res) => {
  const jobs = await claimJobs(req.validated.body);
  res.status(200).json({ success: true, data: { jobs } });
});

const requeue = asyncHandler(async (req, res) => {
  const job = await requeueDeadLetter(req.user, req.validated.params.jobId);

  const io = req.app.get('io');
  if (io) {
    io.emit('job.requeued', { jobId: req.validated.params.jobId });
  }

  res.status(200).json({ success: true, data: { job } });
});

const remove = asyncHandler(async (req, res) => {
  await deleteJob(req.user, req.validated.params.jobId);
  res.status(204).send();
});

module.exports = {
  list,
  create,
  details,
  logs,
  claim,
  requeue,
  remove
};
