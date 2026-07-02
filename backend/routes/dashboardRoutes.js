const express = require('express');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { dashboardQuerySchema } = require('../utils/schemas');
const { metrics } = require('../controllers/dashboardController');

const router = express.Router();

router.use(authenticate);
router.get('/metrics', validate(dashboardQuerySchema), metrics);

module.exports = router;
