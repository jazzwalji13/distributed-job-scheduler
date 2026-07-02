const express = require('express');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  createJobSchema,
  jobListQuerySchema,
  jobParamsSchema,
  updateJobSchema,
  claimJobsSchema
} = require('../utils/schemas');
const { list, create, details, logs, claim, requeue, remove, update } = require('../controllers/jobController');

const router = express.Router();

router.use(authenticate);
router.get('/', validate(jobListQuerySchema), list);
router.post('/', validate(createJobSchema), create);
router.post('/claim', validate(claimJobsSchema), claim);
router.get('/:jobId', validate(jobParamsSchema), details);
router.put('/:jobId', validate(updateJobSchema), update);
router.get('/:jobId/logs', validate(jobParamsSchema), logs);
router.post('/:jobId/requeue', validate(jobParamsSchema), requeue);
router.delete('/:jobId', validate(jobParamsSchema), remove);

module.exports = router;
