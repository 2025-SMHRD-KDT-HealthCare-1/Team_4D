const express = require('express');
const {
  getOverview,
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  markAlertAsRead,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getDevices,
  connectDevice,
  disconnectDevice,
  updateDevice,
  getActivity,
} = require('../controllers/guardianController');

const router = express.Router();

router.get('/overview', getOverview);

router.get('/alerts', getAlerts);
router.post('/alerts', createAlert);
router.patch('/alerts/:id', updateAlert);
router.delete('/alerts/:id', deleteAlert);
router.patch('/alerts/:alert_id/read', markAlertAsRead);

router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.patch('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

router.get('/devices', getDevices);
router.post('/devices/connect', connectDevice);
router.post('/devices/disconnect', disconnectDevice);
router.patch('/devices/:id', updateDevice);

router.get('/activity', getActivity);

module.exports = router;
