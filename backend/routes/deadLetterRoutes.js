const express = require('express');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { deadLetterListQuerySchema, deadLetterParamsSchema } = require('../utils/schemas');
const { list } = require('../controllers/deadLetterController');
const { requeue } = require('../controllers/jobController');

const router = express.Router();

router.use(authenticate);
router.get('/', validate(deadLetterListQuerySchema), list);
router.post('/:jobId/requeue', validate(deadLetterParamsSchema), requeue);

module.exports = router;
