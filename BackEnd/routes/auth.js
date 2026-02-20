const express = require('express');
const crypto = require('crypto');
const db = require('../db/pool');
const { getSessionConfig } = require('../config/env');
const { requireAuth } = require('../middlewares/auth');
const { createError } = require('../services/accessService');

const router = express.Router();

// DB users_password_check currently enforces 8~12 chars.
// Use deterministic hash that fits the constraint.
function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('base64url').slice(0, 12);
}

function verifyPassword(input, stored) {
  return hashPassword(input) === String(stored || '');
}

function normalizeRole(roleRaw) {
  return String(roleRaw || 'GUARDIAN').trim().toUpperCase();
}

function validateLoginId(loginIdRaw) {
  const loginId = String(loginIdRaw || '').trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(loginId)) {
    throw createError(400, 'login_id must be 4~20 chars (a-z, A-Z, 0-9, _).', 'INVALID_LOGIN_ID');
  }
  return loginId;
}

function validateEmail(emailRaw) {
  const email = String(emailRaw || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError(400, 'Invalid email format.', 'INVALID_EMAIL');
  }
  return email;
}

function validatePassword(passwordRaw) {
  const password = String(passwordRaw || '');
  if (password.length < 8 || password.length > 12) {
    throw createError(400, 'password must be 8~12 characters.', 'INVALID_PASSWORD_LENGTH');
  }
  return password;
}

function sanitizeUser(row) {
  return {
    user_id: String(row.user_id),
    login_id: String(row.login_id),
    email: String(row.email),
    name: String(row.name),
    role: String(row.role),
    status: String(row.status),
    created_at: row.created_at,
    last_login_at: row.last_login_at ?? null,
  };
}

function mapUniqueViolation(error) {
  if (!error || error.code !== '23505') return null;
  if (error.constraint === 'users_login_id_key') {
    return createError(409, 'login_id already exists.', 'LOGIN_ID_CONFLICT');
  }
  if (error.constraint === 'users_email_key') {
    return createError(409, 'email already exists.', 'EMAIL_CONFLICT');
  }
  return createError(409, 'Account already exists.', 'ACCOUNT_CONFLICT');
}

router.post('/signup', async (req, res, next) => {
  try {
    const login_id = validateLoginId(req.body?.login_id ?? req.body?.loginId ?? req.body?.userId);
    const email = validateEmail(req.body?.email);
    const password = validatePassword(req.body?.password);
    const name = String(req.body?.name || '').trim();
    const role = normalizeRole(req.body?.role);

    console.log('[auth][signup] request', { login_id, email, name, role, passwordLength: password.length });

    if (!name) {
      throw createError(400, 'name is required.', 'VALIDATION_ERROR');
    }
    if (!['GUARDIAN', 'ADMIN'].includes(role)) {
      throw createError(400, "role must be 'GUARDIAN' or 'ADMIN'.", 'INVALID_ROLE');
    }

    const hashed = hashPassword(password);

    const inserted = await db.query(
      `INSERT INTO users (login_id, email, password, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, login_id, email, name, role, status, created_at`,
      [login_id, email, hashed, name, role]
    );

    return res.status(201).json(sanitizeUser(inserted.rows[0]));
  } catch (error) {
    const mapped = mapUniqueViolation(error);
    return next(mapped || error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const login_id = validateLoginId(req.body?.login_id ?? req.body?.loginId ?? req.body?.userId);
    const password = String(req.body?.password || '');

    console.log('[auth][login] request', { login_id, passwordLength: password.length });

    if (!password) {
      throw createError(400, 'password is required.', 'VALIDATION_ERROR');
    }

    const userResult = await db.query(
      `SELECT user_id, login_id, email, password, name, role, status, created_at, last_login_at
       FROM users
       WHERE login_id = $1
       LIMIT 1`,
      [login_id]
    );

    const user = userResult.rows[0];
    if (!user || !verifyPassword(password, user.password)) {
      throw createError(401, 'Invalid login_id or password.', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'SUSPENDED') {
      throw createError(403, '정지된 계정', 'ACCOUNT_SUSPENDED');
    }
    if (user.status === 'WITHDRAWN') {
      throw createError(403, '탈퇴한 계정', 'ACCOUNT_WITHDRAWN');
    }
    if (user.status !== 'ACTIVE') {
      throw createError(403, '계정 상태로 인해 로그인할 수 없습니다.', 'ACCOUNT_NOT_ACTIVE');
    }

    const updated = await db.query(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE user_id = $1
       RETURNING user_id, login_id, email, name, role, status, created_at, last_login_at`,
      [user.user_id]
    );

    const safeUser = sanitizeUser(updated.rows[0]);
    req.session.user = safeUser;

    return res.json({ user: safeUser });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (!req.session?.user) {
      throw createError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    return res.json({ authenticated: true, user: req.session.user });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const { cookieName } = getSessionConfig();

    req.session.destroy((destroyError) => {
      if (destroyError) {
        return next(destroyError);
      }

      res.clearCookie(cookieName, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return res.json({ message: 'Logged out', code: 'OK' });
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/find-id', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = validateEmail(req.body?.email);

    const result = await db.query(
      `SELECT login_id
       FROM users
       WHERE name = $1 AND email = $2
       LIMIT 1`,
      [name, email]
    );

    if (result.rowCount === 0) {
      throw createError(404, 'No account found.', 'ACCOUNT_NOT_FOUND');
    }

    return res.json({ userId: String(result.rows[0].login_id) });
  } catch (error) {
    return next(error);
  }
});

router.post('/find-password', async (req, res, next) => {
  try {
    const login_id = validateLoginId(req.body?.userId ?? req.body?.login_id ?? req.body?.loginId);
    const name = String(req.body?.name || '').trim();
    const email = validateEmail(req.body?.email);

    const result = await db.query(
      `SELECT 1
       FROM users
       WHERE login_id = $1 AND name = $2 AND email = $3
       LIMIT 1`,
      [login_id, name, email]
    );

    if (result.rowCount === 0) {
      throw createError(404, 'No account found.', 'ACCOUNT_NOT_FOUND');
    }

    return res.json({ temporaryPasswordIssued: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
