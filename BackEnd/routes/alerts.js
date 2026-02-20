const express = require('express');
const db = require('../db/pool');
const { requireAuth } = require('../middlewares/auth');
const { assertSubjectAccess, createError } = require('../services/accessService');

const router = express.Router();

router.get('/subjects/:subjectId/alerts', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    await assertSubjectAccess(req.auth.user_id, subjectId);

    const result = await db.query(
      `SELECT
         ar.analysis_id,
         ar.event_type,
         ar.risk_level,
         ar.confidence,
         ar.analyzed_at,
         n.notification_id,
         n.message,
         n.sent_at,
         n.is_read,
         n.channel
       FROM analysis_result ar
       JOIN video v ON v.video_id = ar.video_id
       JOIN device d ON d.device_id = v.device_id
       LEFT JOIN notification n
         ON n.analysis_id = ar.analysis_id
        AND n.user_id = $2
       WHERE d.subject_id = $1
       ORDER BY ar.analyzed_at DESC`,
      [subjectId, req.auth.user_id]
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await db.query(
      `UPDATE notification
       SET is_read = TRUE
       WHERE notification_id = $1 AND user_id = $2
       RETURNING notification_id, is_read`,
      [id, req.auth.user_id]
    );

    if (updated.rowCount === 0) {
      throw createError(404, 'Notification not found.', 'NOTIFICATION_NOT_FOUND');
    }

    res.json(updated.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;