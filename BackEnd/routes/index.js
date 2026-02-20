const express = require('express');

const healthRoutes = require('./health');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const subjectsRoutes = require('./subjects');
const devicesRoutes = require('./devices');
const alertsRoutes = require('./alerts');
const falsePositivesRoutes = require('./falsePositives');
const envRoutes = require('./env');
const absenceRoutes = require('./absence');
const medicationsRoutes = require('./medications');
const { requireRole } = require('../middlewares/auth');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', requireRole('ADMIN'), adminRoutes);
router.use('/', subjectsRoutes);
router.use('/', devicesRoutes);
router.use('/', alertsRoutes);
router.use('/', falsePositivesRoutes);
router.use('/', envRoutes);
router.use('/', absenceRoutes);
router.use('/', medicationsRoutes);

module.exports = router;
