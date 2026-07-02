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
router.get('/', validate(workerListQuerySchema), requireRole('ADMIN', 'SUPER_ADMIN'), list);
router.post('/register', validate(workerRegisterSchema), requireRole('ADMIN', 'SUPER_ADMIN'), register);
router.post('/heartbeat', validate(workerHeartbeatSchema), heartbeat);
router.patch('/:workerId/status', validate(workerStatusSchema), status);
router.put('/:workerId', validate(updateWorkerSchema), requireRole('ADMIN', 'SUPER_ADMIN'), update);
router.delete('/:workerId', validate(workerIdParamSchema), requireRole('ADMIN', 'SUPER_ADMIN'), remove);

module.exports = router;
