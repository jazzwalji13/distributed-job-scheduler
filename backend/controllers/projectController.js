const asyncHandler = require('../utils/asyncHandler');
const { listProjects, createProject, updateProject, deleteProject } = require('../services/projectService');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const organizationId = req.query.organizationId || req.validated?.query?.organizationId;
  const result = await listProjects(req.user, organizationId, pagination);
  res.status(200).json({ success: true, ...buildPaginatedResponse(result.items, result.total, pagination) });
});

const create = asyncHandler(async (req, res) => {
  const project = await createProject(req.user, req.validated.body);
  res.status(201).json({ success: true, data: { project } });
});

const update = asyncHandler(async (req, res) => {
  const project = await updateProject(req.user, req.validated.params.projectId, req.validated.body);
  res.status(200).json({ success: true, data: { project } });
});

const remove = asyncHandler(async (req, res) => {
  const result = await deleteProject(req.user, req.validated.params.projectId);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  list,
  create,
  update,
  remove
};
