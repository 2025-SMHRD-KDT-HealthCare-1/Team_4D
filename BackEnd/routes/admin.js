const express = require('express');
const {
  getOverview,
  getEvents,
  getTargets,
  getDevices,
  getStatistics,
  reportFalsePositive,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/overview', getOverview);
router.get('/events', getEvents);
router.get('/targets', getTargets);
router.get('/devices', getDevices);
router.get('/statistics', getStatistics);
router.post('/events/:event_id/false-positive', reportFalsePositive);

module.exports = router;
