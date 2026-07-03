const express = require('express');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  workerRegisterSchema,
  workerHeartbeatSchema,
  workerListQuerySchema,
  workerIdParamSchema,
  workerStatusSchema,
  updateWorkerSchema
} = require('../utils/schemas');
const { register, heartbeat, list, status, update, remove } = require('../controllers/workerController');

const router = express.Router();

router.use(authenticate);
router.get('/', validate(workerListQuerySchema), list);

router.post('/register', validate(workerRegisterSchema), register);
router.patch(
  '/:workerId/status',
  validate(workerStatusSchema),
  status
);
router.put('/:workerId', validate(updateWorkerSchema), update);

router.delete('/:workerId', validate(workerIdParamSchema), remove);

module.exports = router;
