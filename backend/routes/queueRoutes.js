const express = require('express');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  queueSchema,
  queueListQuerySchema,
  queueParamsSchema,
  queuePauseSchema,
  queueResumeSchema,
  updateQueueSchema
} = require('../utils/schemas');
const { list, create, update, remove, pause, resume, stats } = require('../controllers/queueController');

const router = express.Router();

router.use(authenticate);
router.get('/', validate(queueListQuerySchema), list);
router.post('/', validate(queueSchema), create);
router.put('/:queueId', validate(queueParamsSchema), validate(updateQueueSchema), update);
router.delete('/:queueId', validate(queueParamsSchema), remove);
router.post('/:queueId/pause', validate(queuePauseSchema), pause);
router.post('/:queueId/resume', validate(queueResumeSchema), resume);
router.get('/:queueId/stats', validate(queueParamsSchema), stats);

module.exports = router;
