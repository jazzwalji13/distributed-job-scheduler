const express = require('express');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  projectSchema,
  projectUpdateSchema,
  projectParamsSchema,
  projectListQuerySchema
} = require('../utils/schemas');
const { list, create, update, remove } = require('../controllers/projectController');

const router = express.Router();

router.use(authenticate);
router.get('/', validate(projectListQuerySchema), list);
router.post('/', validate(projectSchema), create);
router.put('/:projectId', validate(projectUpdateSchema), update);
router.delete('/:projectId', validate(projectParamsSchema), remove);

module.exports = router;
