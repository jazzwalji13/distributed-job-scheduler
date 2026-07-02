const asyncHandler = require('../utils/asyncHandler');
const { getDashboardMetrics } = require('../services/dashboardService');

const metrics = asyncHandler(async (req, res) => {
  const organizationId = req.query.organizationId;
  const result = await getDashboardMetrics(req.user, organizationId);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
  metrics
};
