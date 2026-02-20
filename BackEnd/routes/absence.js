const express = require('express');
const db = require('../db/pool');
const { requireAuth } = require('../middlewares/auth');
const { assertSubjectAccess, createError } = require('../services/accessService');

const router = express.Router();

router.post('/subjects/:subjectId/absence', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const startTime = req.body?.start_time;
    const endTime = req.body?.end_time;
    const durationSec = Number(req.body?.duration_sec);
    const reason = String(req.body?.reason || '').trim();

    if (!startTime || !endTime || Number.isNaN(durationSec)) {
      throw createError(400, 'start_time, end_time, duration_sec are required.', 'VALIDATION_ERROR');
    }

    await assertSubjectAccess(req.auth.user_id, subjectId);

    const inserted = await db.query(
      `INSERT INTO absence_log (subject_id, start_time, end_time, duration_sec, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [subjectId, new Date(startTime), new Date(endTime), durationSec, reason || null]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/subjects/:subjectId/absence', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    await assertSubjectAccess(req.auth.user_id, subjectId);

    const result = await db.query(
      `SELECT *
       FROM absence_log
       WHERE subject_id = $1
       ORDER BY start_time DESC`,
      [subjectId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;