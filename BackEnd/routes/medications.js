const express = require('express');
const db = require('../db/pool');
const { requireAuth } = require('../middlewares/auth');
const { assertSubjectAccess, createError } = require('../services/accessService');

const router = express.Router();

router.post('/subjects/:subjectId/medications/schedule', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const medicineName = String(req.body?.medicine_name || '').trim();
    const scheduledTime = req.body?.scheduled_time;

    if (!medicineName || !scheduledTime) {
      throw createError(400, 'medicine_name and scheduled_time are required.', 'VALIDATION_ERROR');
    }

    await assertSubjectAccess(req.auth.user_id, subjectId);

    const inserted = await db.query(
      `INSERT INTO medication_schedule (subject_id, medicine_name, scheduled_time, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [subjectId, medicineName, new Date(scheduledTime)]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/subjects/:subjectId/medications/schedule', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    await assertSubjectAccess(req.auth.user_id, subjectId);

    const result = await db.query(
      `SELECT *
       FROM medication_schedule
       WHERE subject_id = $1
       ORDER BY scheduled_time ASC`,
      [subjectId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/medications/log', requireAuth, async (req, res, next) => {
  try {
    const scheduleId = req.body?.schedule_id;
    const subjectId = req.body?.subject_id;
    const acknowledged = Boolean(req.body?.acknowledged);

    if (!scheduleId || !subjectId) {
      throw createError(400, 'schedule_id and subject_id are required.', 'VALIDATION_ERROR');
    }

    await assertSubjectAccess(req.auth.user_id, String(subjectId));

    const inserted = await db.query(
      `INSERT INTO medication_log (schedule_id, subject_id, sent_at, acknowledged)
       VALUES ($1, $2, NOW(), $3)
       RETURNING *`,
      [scheduleId, subjectId, acknowledged]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;