const express = require('express');
const db = require('../db/pool');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { assertAnalysisAccess, createError } = require('../services/accessService');

const router = express.Router();

router.post('/analysis/:analysisId/false-positive', requireAuth, async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const reason = String(req.body?.reason || '').trim();
    const note = String(req.body?.note || '').trim();

    if (!reason) {
      throw createError(400, 'reason is required.', 'VALIDATION_ERROR');
    }

    await assertAnalysisAccess(req.auth.user_id, analysisId);

    const inserted = await db.query(
      `INSERT INTO false_positive_log (analysis_id, reported_by, reason, status, note, reported_at)
       VALUES ($1, $2, $3, 'PENDING', $4, NOW())
       RETURNING *`,
      [analysisId, req.auth.user_id, reason, note]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/false-positives', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const status = String(req.query?.status || '').trim().toUpperCase();
    const params = [];
    let whereClause = '';

    if (status) {
      params.push(status);
      whereClause = `WHERE fpl.status = $${params.length}`;
    }

    const result = await db.query(
      `SELECT fpl.*, u.name AS reported_by_name
       FROM false_positive_log fpl
       LEFT JOIN users u ON u.user_id = fpl.reported_by
       ${whereClause}
       ORDER BY fpl.reported_at DESC`,
      params
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.patch('/false-positives/:fpId', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { fpId } = req.params;
    const status = req.body?.status !== undefined ? String(req.body.status).trim().toUpperCase() : undefined;
    const note = req.body?.note !== undefined ? String(req.body.note) : undefined;

    const updates = [];
    const params = [];

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (note !== undefined) {
      params.push(note);
      updates.push(`note = $${params.length}`);
    }

    if (updates.length === 0) {
      throw createError(400, 'status or note is required.', 'VALIDATION_ERROR');
    }

    params.push(fpId);

    const result = await db.query(
      `UPDATE false_positive_log
       SET ${updates.join(', ')}
       WHERE fp_id = $${params.length}
       RETURNING *`,
      params
    );

    if (result.rowCount === 0) {
      throw createError(404, 'False positive report not found.', 'FALSE_POSITIVE_NOT_FOUND');
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;