const express = require('express');
const healthRoutes = require('./health');
const subjectsRoutes = require('./subjects');
const devicesRoutes = require('./devices');
const authRoutes = require('./auth');
const guardianRoutes = require('./guardian');
const adminRoutes = require('./admin');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/guardian', requireAuth, guardianRoutes);
router.use('/subjects', requireAuth, subjectsRoutes);
router.use('/devices', requireAuth, devicesRoutes);
router.use('/admin', requireAuth, requireAdmin, adminRoutes);

module.exports = router;
