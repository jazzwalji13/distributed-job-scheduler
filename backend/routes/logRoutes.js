const express = require('express');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { logListQuerySchema } = require('../utils/schemas');
const { list } = require('../controllers/logController');

const router = express.Router();

router.use(authenticate);
router.get('/', validate(logListQuerySchema), list);

module.exports = router;
