const express = require('express');
const authRoutes = require('./authRoutes');
const organizationRoutes = require('./organizationRoutes');
const projectRoutes = require('./projectRoutes');
const queueRoutes = require('./queueRoutes');
const jobRoutes = require('./jobRoutes');
const workerRoutes = require('./workerRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const logRoutes = require('./logRoutes');
const deadLetterRoutes = require('./deadLetterRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/projects', projectRoutes);
router.use('/queues', queueRoutes);
router.use('/jobs', jobRoutes);
router.use('/workers', workerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/logs', logRoutes);
router.use('/dead-letter', deadLetterRoutes);

module.exports = router;
