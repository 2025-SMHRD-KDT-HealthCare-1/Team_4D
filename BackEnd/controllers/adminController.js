const adminService = require('../services/adminService');

async function getOverview(req, res, next) {
  try {
    const result = await adminService.getOverview();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getEvents(req, res, next) {
  try {
    const result = await adminService.getEvents();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getTargets(req, res, next) {
  try {
    const result = await adminService.getTargets();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getDevices(req, res, next) {
  try {
    const result = await adminService.getDevices();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getStatistics(req, res, next) {
  try {
    const result = await adminService.getStatistics(req.query.period);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function reportFalsePositive(req, res, next) {
  try {
    const eventId = req.params.event_id;
    const reason = req.body?.reason;
    const result = await adminService.reportFalsePositive(eventId, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getEvents,
  getTargets,
  getDevices,
  getStatistics,
  reportFalsePositive,
};
