const express = require('express');
const validate = require('../middleware/validate');
const { authenticate, requireOrgAccess } = require('../middleware/auth');
const {
  organizationSchema,
  organizationIdParamSchema,
  updateOrganizationSchema,
  organizationMemberSchema
} = require('../utils/schemas');
const {
  list,
  create,
  update,
  remove,
  addOrganizationMember,
  updateOrganizationMember,
  removeOrganizationMember
} = require('../controllers/organizationController');

const router = express.Router();

router.use(authenticate);
router.get('/', list);
router.post('/', validate(organizationSchema), create);
router.put('/:organizationId', validate(updateOrganizationSchema), update);
router.delete('/:organizationId', validate(organizationIdParamSchema), remove);
router.post('/:organizationId/members', validate(organizationMemberSchema), addOrganizationMember);
router.patch('/:organizationId/members', validate(organizationMemberSchema), updateOrganizationMember);
router.delete('/:organizationId/members', validate(organizationMemberSchema), removeOrganizationMember);

module.exports = router;
