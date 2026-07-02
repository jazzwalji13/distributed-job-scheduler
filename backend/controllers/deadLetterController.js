const asyncHandler = require('../utils/asyncHandler');
const { getDeadLetterJobs } = require('../services/jobService');
const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const result = await getDeadLetterJobs(req.user, req.query, pagination);
  res.status(200).json({ success: true, ...buildPaginatedResponse(result.items, result.total, pagination) });
});

module.exports = {
  list
};
