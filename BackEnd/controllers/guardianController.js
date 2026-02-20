const guardianService = require('../services/guardianService');

async function getOverview(req, res, next) {
  try {
    const result = await guardianService.getOverview();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getAlerts(req, res, next) {
  try {
    const result = await guardianService.getAlerts(req.query.limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createAlert(req, res, next) {
  try {
    const result = await guardianService.createAlert(req.body || {});
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function updateAlert(req, res, next) {
  try {
    const result = await guardianService.updateAlert(req.params.id, req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteAlert(req, res, next) {
  try {
    const result = await guardianService.deleteAlert(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function markAlertAsRead(req, res, next) {
  try {
    const alertId = req.params.alert_id;
    const result = await guardianService.markAlertAsRead(alertId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getSubjects(req, res, next) {
  try {
    const result = await guardianService.getSubjects();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createSubject(req, res, next) {
  try {
    const result = await guardianService.createSubject(req.body || {}, req.auth?.userId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function updateSubject(req, res, next) {
  try {
    const result = await guardianService.updateSubject(req.params.id, req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteSubject(req, res, next) {
  try {
    const result = await guardianService.softDeleteSubject(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getDevices(req, res, next) {
  try {
    const result = await guardianService.getDevices();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function connectDevice(req, res, next) {
  try {
    const result = await guardianService.connectDevice(req.body || {});
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function disconnectDevice(req, res, next) {
  try {
    const result = await guardianService.disconnectDevice(req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateDevice(req, res, next) {
  try {
    const result = await guardianService.updateDevice(req.params.id, req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getActivity(req, res, next) {
  try {
    const { date } = req.query;
    const result = await guardianService.getActivity(date);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
