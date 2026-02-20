const db = require('../db/pool');

function createError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function getSubjectLink(userId, subjectId) {
  const result = await db.query(
    `SELECT user_subject_id, user_id, subject_id, role
     FROM user_subject
     WHERE user_id = $1 AND subject_id = $2
     LIMIT 1`,
    [userId, subjectId]
  );

  return result.rows[0] || null;
}

async function assertSubjectAccess(userId, subjectId, mainOnly = false) {
  const link = await getSubjectLink(userId, subjectId);
  if (!link) {
    throw createError(403, 'No access to this subject.', 'SUBJECT_ACCESS_DENIED');
  }

  if (mainOnly && link.role !== 'MAIN') {
    throw createError(403, 'MAIN role required.', 'SUBJECT_MAIN_REQUIRED');
  }

  return link;
}

async function getDeviceWithSubject(deviceId) {
  const result = await db.query(
    `SELECT device_id, subject_id
     FROM device
     WHERE device_id = $1
     LIMIT 1`,
    [deviceId]
  );

  return result.rows[0] || null;
}

async function assertDeviceAccess(userId, deviceId) {
  const device = await getDeviceWithSubject(deviceId);
  if (!device) {
    throw createError(404, 'Device not found.', 'DEVICE_NOT_FOUND');
  }

  await assertSubjectAccess(userId, device.subject_id);
  return device;
}

async function assertAnalysisAccess(userId, analysisId) {
  const result = await db.query(
    `SELECT ar.analysis_id
     FROM analysis_result ar
     JOIN video v ON v.video_id = ar.video_id
     JOIN device d ON d.device_id = v.device_id
     JOIN user_subject us ON us.subject_id = d.subject_id
     WHERE ar.analysis_id = $1 AND us.user_id = $2
     LIMIT 1`,
    [analysisId, userId]
  );

  if (result.rowCount === 0) {
    throw createError(403, 'No access to this analysis.', 'ANALYSIS_ACCESS_DENIED');
  }
}

module.exports = {
  createError,
  assertSubjectAccess,
  assertDeviceAccess,
  assertAnalysisAccess,
};