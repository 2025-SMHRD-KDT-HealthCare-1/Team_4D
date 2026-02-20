const express = require('express');
const db = require('../db/pool');
const { requireAuth } = require('../middlewares/auth');
const { assertSubjectAccess, createError } = require('../services/accessService');

const router = express.Router();

router.post('/subjects', requireAuth, async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    const name = String(req.body?.name || '').trim();
    const age = Number(req.body?.age);
    const gender = String(req.body?.gender || '').trim().toUpperCase();
    const linkRole = String(req.body?.role || 'MAIN').trim().toUpperCase();

    if (!name || Number.isNaN(age) || !['M', 'F'].includes(gender)) {
      throw createError(400, 'name, age, gender are required.', 'VALIDATION_ERROR');
    }

    if (!linkRole) {
      throw createError(400, 'role is required.', 'VALIDATION_ERROR');
    }

    await client.query('BEGIN');

    const subjectResult = await client.query(
      `INSERT INTO subject (name, age, gender, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [name, age, gender]
    );

    const subject = subjectResult.rows[0];

    const userSubjectResult = await client.query(
      `INSERT INTO user_subject (user_id, subject_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.auth.user_id, subject.subject_id, linkRole]
    );

    await client.query('COMMIT');

    res.status(201).json({
      subject,
      user_subject: userSubjectResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.get('/subjects', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.*, us.role AS link_role
       FROM user_subject us
       JOIN subject s ON s.subject_id = us.subject_id
       WHERE us.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.auth.user_id]
    );

    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/subjects/:subjectId', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    await assertSubjectAccess(req.auth.user_id, subjectId);

    const result = await db.query('SELECT * FROM subject WHERE subject_id = $1 LIMIT 1', [subjectId]);

    if (result.rowCount === 0) {
      throw createError(404, 'Subject not found.', 'SUBJECT_NOT_FOUND');
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/subjects/:subjectId', requireAuth, async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    await assertSubjectAccess(req.auth.user_id, subjectId, true);

    const deleted = await db.query('DELETE FROM subject WHERE subject_id = $1 RETURNING subject_id', [subjectId]);

    if (deleted.rowCount === 0) {
      throw createError(404, 'Subject not found.', 'SUBJECT_NOT_FOUND');
    }

    res.json({ subject_id: deleted.rows[0].subject_id, deleted: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;