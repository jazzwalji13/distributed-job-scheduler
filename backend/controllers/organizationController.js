const asyncHandler = require('../utils/asyncHandler');
const {
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  addMember,
  removeMember,
  updateMemberRole
} = require('../services/organizationService');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const result = await listOrganizations(req.user, pagination);

  res.status(200).json({ success: true, ...buildPaginatedResponse(result.items, result.total, pagination) });
});

const create = asyncHandler(async (req, res) => {
  const organization = await createOrganization(req.user, req.validated.body);
  res.status(201).json({ success: true, data: { organization } });
});

const update = asyncHandler(async (req, res) => {
  const organization = await updateOrganization(req.user, req.validated.params.organizationId, req.validated.body);
  res.status(200).json({ success: true, data: { organization } });
});

const remove = asyncHandler(async (req, res) => {
  const result = await deleteOrganization(req.user, req.validated.params.organizationId);
  res.status(200).json({ success: true, data: result });
});

const addOrganizationMember = asyncHandler(async (req, res) => {
  const member = await addMember(req.user, req.validated.params.organizationId, req.validated.body.userId, req.validated.body.role);
  res.status(201).json({ success: true, data: { member } });
});

const updateOrganizationMember = asyncHandler(async (req, res) => {
  const member = await updateMemberRole(req.user, req.validated.params.organizationId, req.validated.body.userId, req.validated.body.role);
  res.status(200).json({ success: true, data: { member } });
});

const removeOrganizationMember = asyncHandler(async (req, res) => {
  const result = await removeMember(req.user, req.validated.params.organizationId, req.validated.body.userId);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  list,
  create,
  update,
  remove,
  addOrganizationMember,
  updateOrganizationMember,
  removeOrganizationMember
};
