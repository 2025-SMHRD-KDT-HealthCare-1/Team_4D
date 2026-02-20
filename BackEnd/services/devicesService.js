const guardianService = require('./guardianService');

async function connectDevice(payload) {
  return guardianService.connectDevice(payload);
}

async function softDeleteDevice(deviceId) {
  return guardianService.softDeleteDevice(deviceId);
}

module.exports = {
  connectDevice,
  softDeleteDevice,
};
