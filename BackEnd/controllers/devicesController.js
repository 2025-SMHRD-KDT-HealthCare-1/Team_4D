const devicesService = require('../services/devicesService');

async function createDevice(req, res, next) {
  try {
    const result = await devicesService.connectDevice(req.body || {});
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteDevice(req, res, next) {
  try {
    const { device_id: deviceId } = req.params;
    const result = await devicesService.softDeleteDevice(deviceId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDevice,
  deleteDevice,
};
