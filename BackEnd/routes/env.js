const express = require('express');
const db = require('../db/pool');
const { requireAuth } = require('../middlewares/auth');
const { assertSubjectAccess, assertDeviceAccess, createError } = require('../services/accessService');

const router = express.Router();

router.post('/devices/:deviceId/env', requireAuth, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const temperature = Number(req.body?.temperature);
    const humidity = Number(req.body?.humidity);
    const status = String(req.body?.status || '').trim();
    const durationSec = Number(req.body?.duration_sec);

    if ([temperature, humidity, durationSec].some(Number.isNaN) || !status) {
      throw createError(400, 'temperature, humidity, status, duration_sec are required.', 'VALIDATION_ERROR');
    }

    await assertDeviceAccess(req.auth.user_id, deviceId);

    const inserted = await db.query(
      `INSERT INTO env_sensor_log (device_id, temperature, humidity, status, duration_sec, recorded_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [deviceId, temperature, humidity, status, durationSec]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/subjects/:subjectId/env', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit || 50)));

    await assertSubjectAccess(req.auth.user_id, subjectId);

    const result = await db.query(
      `SELECT esl.*
       FROM env_sensor_log esl
       JOIN device d ON d.device_id = esl.device_id
       WHERE d.subject_id = $1
       ORDER BY esl.recorded_at DESC
       LIMIT $2`,
      [subjectId, limit]
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;