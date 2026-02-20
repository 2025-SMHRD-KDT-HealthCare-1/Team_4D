const express = require('express');
const db = require('../db/pool');
const { requireAuth } = require('../middlewares/auth');
const { assertSubjectAccess, assertDeviceAccess, createError } = require('../services/accessService');

const router = express.Router();

router.post('/subjects/:subjectId/devices', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const deviceType = String(req.body?.device_type || '').trim();
    const location = String(req.body?.location || '').trim();

    if (!deviceType || !location) {
      throw createError(400, 'device_type and location are required.', 'VALIDATION_ERROR');
    }

    await assertSubjectAccess(req.auth.user_id, subjectId);

    const inserted = await db.query(
      `INSERT INTO device (subject_id, device_type, location, status, health_status, created_at)
       VALUES ($1, $2, $3, 'OFFLINE', 'NORMAL', NOW())
       RETURNING *`,
      [subjectId, deviceType, location]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/subjects/:subjectId/devices', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    await assertSubjectAccess(req.auth.user_id, subjectId);

    const result = await db.query(
      `SELECT *
       FROM device
       WHERE subject_id = $1
       ORDER BY created_at DESC`,
      [subjectId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.patch('/devices/:deviceId', requireAuth, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    await assertDeviceAccess(req.auth.user_id, deviceId);

    const updates = [];
    const params = [];

    if (req.body?.status !== undefined) {
      params.push(String(req.body.status));
      updates.push(`status = $${params.length}`);
    }

    if (req.body?.health_status !== undefined) {
      params.push(String(req.body.health_status));
      updates.push(`health_status = $${params.length}`);
    }

    if (req.body?.last_seen_at !== undefined) {
      params.push(req.body.last_seen_at ? new Date(req.body.last_seen_at) : null);
      updates.push(`last_seen_at = $${params.length}`);
    }

    if (req.body?.location !== undefined) {
      params.push(String(req.body.location));
      updates.push(`location = $${params.length}`);
    }

    if (updates.length === 0) {
      throw createError(400, 'No updatable fields.', 'VALIDATION_ERROR');
    }

    params.push(deviceId);

    const result = await db.query(
      `UPDATE device
       SET ${updates.join(', ')}
       WHERE device_id = $${params.length}
       RETURNING *`,
      params
    );

    if (result.rowCount === 0) {
      throw createError(404, 'Device not found.', 'DEVICE_NOT_FOUND');
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/devices/:deviceId', requireAuth, async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    await assertDeviceAccess(req.auth.user_id, deviceId);

    const deleted = await db.query('DELETE FROM device WHERE device_id = $1 RETURNING device_id', [deviceId]);
    if (deleted.rowCount === 0) {
      throw createError(404, 'Device not found.', 'DEVICE_NOT_FOUND');
    }

    res.json({ device_id: deleted.rows[0].device_id, deleted: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;