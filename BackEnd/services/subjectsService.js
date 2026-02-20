const guardianService = require('./guardianService');

async function createSubject(payload, guardianId) {
  return guardianService.createSubject(payload, guardianId);
}

async function softDeleteSubject(subjectId) {
  return guardianService.softDeleteSubject(subjectId);
}

module.exports = {
  createSubject,
  softDeleteSubject,
};
