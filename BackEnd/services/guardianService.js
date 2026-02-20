const db = require('../db/pool');

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function getOverview() {
  const subjectResult = await db.query(
    `SELECT target_id AS "subjectId", name AS "subjectName"
     FROM subjects
     WHERE is_deleted = FALSE
     ORDER BY created_at ASC
     LIMIT 1`
  );

  const subject = subjectResult.rows[0];
  if (!subject) {
    return {
      subjectId: '',
      subjectName: '',
      status: 'SAFE',
      deviceStatus: 'OFFLINE',
      lastSeenAt: new Date().toISOString(),
      temperature: 0,
      humidity: 0,
      recentEventCount: 0,
    };
  }

  const metrics = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE is_read = FALSE AND is_false_positive = FALSE) AS unread_count,
       BOOL_OR(risk_level = 'HIGH' AND is_read = FALSE AND is_false_positive = FALSE) AS has_high,
       BOOL_OR(risk_level = 'MEDIUM' AND is_read = FALSE AND is_false_positive = FALSE) AS has_medium
     FROM alerts
     WHERE target_id = $1`,
    [subject.subjectId]
  );

  const device = await db.query(
    `SELECT
       status AS "deviceStatus",
       COALESCE(last_seen_at, NOW()) AS "lastSeenAt"
     FROM devices
     WHERE target_id = $1 AND is_deleted = FALSE
     ORDER BY installed_at DESC
     LIMIT 1`,
    [subject.subjectId]
  );

  const env = await db.query(
    `SELECT
       temperature,
       humidity
     FROM environment_readings
     WHERE target_id = $1
     ORDER BY measured_at DESC
     LIMIT 1`,
    [subject.subjectId]
  );

  const m = metrics.rows[0];
  const status = m?.has_high ? 'DANGER' : m?.has_medium ? 'WARNING' : 'SAFE';

  return {
    subjectId: subject.subjectId,
    subjectName: subject.subjectName,
    status,
    deviceStatus: device.rows[0]?.deviceStatus || 'OFFLINE',
    lastSeenAt: device.rows[0]?.lastSeenAt || new Date().toISOString(),
    temperature: Number(env.rows[0]?.temperature ?? 0),
    humidity: Number(env.rows[0]?.humidity ?? 0),
    recentEventCount: Number(m?.unread_count ?? 0),
  };
}

async function getAlerts(limit = 20) {
  const parsedLimit = Number(limit) > 0 ? Number(limit) : 20;
  const result = await db.query(
    `SELECT
       alert_id AS id,
       alert_type AS type,
       risk_level AS "riskLevel",
       title,
       description,
       location,
       occurred_at AS "occurredAt",
       is_read AS "isRead"
     FROM alerts
     WHERE is_false_positive = FALSE
     ORDER BY occurred_at DESC
     LIMIT $1`,
    [parsedLimit]
  );

  return { items: result.rows };
}

async function createAlert(payload) {
  const targetId = String(payload.targetId || '').trim();
  const deviceId = String(payload.deviceId || '').trim();
  const type = String(payload.type || '').trim();
  const riskLevel = String(payload.riskLevel || '').trim();
  const title = String(payload.title || '').trim();
  const description = String(payload.description || '').trim();
  const location = String(payload.location || '').trim();

  if (!targetId || !type || !riskLevel || !title || !description || !location) {
    const error = new Error('targetId, type, riskLevel, title, description, location are required.');
    error.statusCode = 400;
    throw error;
  }

  const alertId = genId('alert');
  const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date();

  const result = await db.query(
    `INSERT INTO alerts (
       alert_id, target_id, device_id, alert_type, risk_level, title, description, location,
       occurred_at, is_read, status, memo, guardian_notified, is_false_positive, created_at, updated_at
     )
     VALUES ($1,$2,NULLIF($3,''),$4,$5,$6,$7,$8,$9,FALSE,'UNCONFIRMED','',FALSE,FALSE,NOW(),NOW())
     RETURNING
       alert_id AS id,
       alert_type AS type,
       risk_level AS "riskLevel",
       title,
       description,
       location,
       occurred_at AS "occurredAt",
       is_read AS "isRead"`,
    [alertId, targetId, deviceId, type, riskLevel, title, description, location, occurredAt.toISOString()]
  );

  return result.rows[0];
}

async function updateAlert(alertId, payload) {
  const updates = [];
  const params = [];

  const map = {
    title: 'title',
    description: 'description',
    location: 'location',
    isRead: 'is_read',
    memo: 'memo',
    status: 'status',
    guardianNotified: 'guardian_notified',
    riskLevel: 'risk_level',
    type: 'alert_type',
  };

  Object.entries(map).forEach(([key, column]) => {
    if (payload[key] !== undefined) {
      params.push(payload[key]);
      updates.push(`${column} = $${params.length}`);
    }
  });

  if (updates.length === 0) {
    const error = new Error('No fields to update.');
    error.statusCode = 400;
    throw error;
  }

  params.push(alertId);

  const result = await db.query(
    `UPDATE alerts
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE alert_id = $${params.length}
     RETURNING
       alert_id AS id,
       alert_type AS type,
       risk_level AS "riskLevel",
       title,
       description,
       location,
       occurred_at AS "occurredAt",
       is_read AS "isRead"`,
    params
  );

  if (result.rowCount === 0) {
    const error = new Error('Alert not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function deleteAlert(alertId) {
  const result = await db.query('DELETE FROM alerts WHERE alert_id = $1 RETURNING alert_id AS id', [alertId]);

  if (result.rowCount === 0) {
    const error = new Error('Alert not found.');
    error.statusCode = 404;
    throw error;
  }

  return { id: result.rows[0].id, deleted: true };
}

async function markAlertAsRead(alertId) {
  const result = await db.query(
    `UPDATE alerts
     SET is_read = TRUE, updated_at = NOW()
     WHERE alert_id = $1
     RETURNING alert_id AS "alertId", is_read AS "isRead"`,
    [alertId]
  );

  if (result.rowCount === 0) {
    const error = new Error('Alert not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function getSubjects() {
  const result = await db.query(
    `SELECT
       target_id AS "targetId",
       name,
       age,
       gender,
       is_deleted AS "isDeleted"
     FROM subjects
     ORDER BY created_at DESC`
  );
  return { items: result.rows };
}

async function createSubject(payload, guardianId) {
  const name = String(payload.name || '').trim();
  const age = Number(payload.age || 75);
  const gender = payload.gender === 'M' ? 'M' : 'F';

  if (!name) {
    const error = new Error('name is required.');
    error.statusCode = 400;
    throw error;
  }

  const targetId = genId('target');
  const owner = guardianId || 'guardian01';

  const result = await db.query(
    `INSERT INTO subjects (target_id, guardian_id, name, age, gender, created_at, is_deleted)
     VALUES ($1,$2,$3,$4,$5,NOW(),FALSE)
     RETURNING target_id AS "targetId", name, age, gender, is_deleted AS "isDeleted"`,
    [targetId, owner, name, age, gender]
  );

  return result.rows[0];
}

async function updateSubject(subjectId, payload) {
  const updates = [];
  const params = [];

  if (payload.name !== undefined) {
    params.push(String(payload.name));
    updates.push(`name = $${params.length}`);
  }
  if (payload.age !== undefined) {
    params.push(Number(payload.age));
    updates.push(`age = $${params.length}`);
  }
  if (payload.gender !== undefined) {
    params.push(payload.gender === 'M' ? 'M' : 'F');
    updates.push(`gender = $${params.length}`);
  }

  if (updates.length === 0) {
    const error = new Error('No fields to update.');
    error.statusCode = 400;
    throw error;
  }

  params.push(subjectId);

  const result = await db.query(
    `UPDATE subjects
     SET ${updates.join(', ')}
     WHERE target_id = $${params.length}
     RETURNING target_id AS "targetId", name, age, gender, is_deleted AS "isDeleted"`,
    params
  );

  if (result.rowCount === 0) {
    const error = new Error('Subject not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function softDeleteSubject(subjectId) {
  const deletedAt = new Date().toISOString();

  const result = await db.query(
    `UPDATE subjects
     SET is_deleted = TRUE, deleted_at = $2
     WHERE target_id = $1 AND is_deleted = FALSE
     RETURNING target_id AS "subjectId"`,
    [subjectId, deletedAt]
  );

  if (result.rowCount === 0) {
    const error = new Error('Subject not found.');
    error.statusCode = 404;
    throw error;
  }

  await db.query(
    `UPDATE devices
     SET is_deleted = TRUE, deleted_at = $2
     WHERE target_id = $1 AND is_deleted = FALSE`,
    [subjectId, deletedAt]
  );

  return {
    subjectId,
    isDeleted: true,
    deletedAt,
    devicesDeleted: true,
  };
}

async function getDevices() {
  const result = await db.query(
    `SELECT
       device_id AS "deviceId",
       serial_number AS "serialNumber",
       target_id AS "targetId",
       status,
       COALESCE(last_seen_at, NOW()) AS "lastSeenAt",
       installed_at AS "installedAt",
       firmware,
       is_deleted AS "isDeleted"
     FROM devices
     ORDER BY installed_at DESC`
  );

  return { items: result.rows };
}

async function connectDevice(payload) {
  const targetId = String(payload.targetId || '').trim();
  const serialNumber = String(payload.serialNumber || payload.deviceId || '').trim();

  if (!targetId || !serialNumber) {
    const error = new Error('targetId and serialNumber are required.');
    error.statusCode = 400;
    throw error;
  }

  const subject = await db.query(
    'SELECT 1 FROM subjects WHERE target_id = $1 AND is_deleted = FALSE LIMIT 1',
    [targetId]
  );
  if (subject.rowCount === 0) {
    const error = new Error('Target not found.');
    error.statusCode = 404;
    throw error;
  }

  const deviceId = genId('device');

  const result = await db.query(
    `INSERT INTO devices (
       device_id, serial_number, target_id, status, last_seen_at, installed_at, firmware, is_deleted
     )
     VALUES ($1,$2,$3,'ONLINE',NOW(),NOW(),'v1.0.0',FALSE)
     RETURNING
       device_id AS "deviceId",
       target_id AS "targetId",
       status,
       installed_at AS "installedAt"`,
    [deviceId, serialNumber, targetId]
  );

  return result.rows[0];
}

async function disconnectDevice(payload) {
  const deviceId = String(payload.deviceId || '').trim();
  if (!deviceId) {
    const error = new Error('deviceId is required.');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    `UPDATE devices
     SET target_id = NULL, status = 'OFFLINE', last_seen_at = NOW()
     WHERE device_id = $1 AND is_deleted = FALSE
     RETURNING device_id AS "deviceId"`,
    [deviceId]
  );

  if (result.rowCount === 0) {
    const error = new Error('Device not found.');
    error.statusCode = 404;
    throw error;
  }

  return { deviceId, disconnected: true };
}

async function updateDevice(deviceId, payload) {
  const updates = [];
  const params = [];

  if (payload.status !== undefined) {
    params.push(payload.status);
    updates.push(`status = $${params.length}`);
  }
  if (payload.firmware !== undefined) {
    params.push(payload.firmware);
    updates.push(`firmware = $${params.length}`);
  }
  if (payload.targetId !== undefined) {
    params.push(payload.targetId || null);
    updates.push(`target_id = $${params.length}`);
  }

  if (updates.length === 0) {
    const error = new Error('No fields to update.');
    error.statusCode = 400;
    throw error;
  }

  params.push(deviceId);

  const result = await db.query(
    `UPDATE devices
     SET ${updates.join(', ')}, last_seen_at = NOW()
     WHERE device_id = $${params.length} AND is_deleted = FALSE
     RETURNING
       device_id AS "deviceId",
       target_id AS "targetId",
       status,
       installed_at AS "installedAt"`,
    params
  );

  if (result.rowCount === 0) {
    const error = new Error('Device not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function softDeleteDevice(deviceId) {
  const deletedAt = new Date().toISOString();

  const result = await db.query(
    `UPDATE devices
     SET is_deleted = TRUE, deleted_at = $2
     WHERE device_id = $1 AND is_deleted = FALSE
     RETURNING device_id AS "deviceId"`,
    [deviceId, deletedAt]
  );

  if (result.rowCount === 0) {
    const error = new Error('Device not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    deviceId,
    isDeleted: true,
    deletedAt,
  };
}

async function getActivity(date) {
  const selectedDate = date || new Date().toISOString().slice(0, 10);

  const timelineResult = await db.query(
    `SELECT
       alert_id AS id,
       TO_CHAR(occurred_at, 'HH24:MI') AS time,
       title,
       CASE
         WHEN risk_level = 'HIGH' THEN 'warning'
         WHEN risk_level = 'LOW' THEN 'success'
         ELSE 'normal'
       END AS type
     FROM alerts
     WHERE DATE(occurred_at) = $1::date
       AND is_false_positive = FALSE
     ORDER BY occurred_at ASC
     LIMIT 20`,
    [selectedDate]
  );

  const chartResult = await db.query(
    `WITH hours AS (
       SELECT generate_series(0, 23) AS hour
     ), counts AS (
       SELECT EXTRACT(HOUR FROM occurred_at)::int AS hour, COUNT(*)::int AS activity
       FROM alerts
       WHERE DATE(occurred_at) = $1::date AND is_false_positive = FALSE
       GROUP BY 1
     )
     SELECT
       LPAD(hours.hour::text, 2, '0') AS time,
       COALESCE(counts.activity, 0) AS activity
     FROM hours
     LEFT JOIN counts ON counts.hour = hours.hour
     WHERE hours.hour % 3 = 0
     ORDER BY hours.hour`,
    [selectedDate]
  );

  return {
    date: selectedDate,
    timeline: timelineResult.rows,
    chart: chartResult.rows,
  };
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
  softDeleteSubject,
  getDevices,
  connectDevice,
  disconnectDevice,
  updateDevice,
  softDeleteDevice,
  getActivity,
};
