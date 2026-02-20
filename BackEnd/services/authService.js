const db = require('../db/pool');

function tokenFor(user) {
  return `mock-token-${user.role}-${user.userId}`;
}

async function login(payload) {
  const userIdOrEmail = String(payload.userId || payload.email || '').trim();
  const password = String(payload.password || '');

  if (!userIdOrEmail || !password) {
    const error = new Error('userId/email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    `SELECT
       user_id AS "userId",
       name,
       email,
       role
     FROM users
     WHERE (user_id = $1 OR email = $1)
       AND password = $2
       AND is_deleted = FALSE
     LIMIT 1`,
    [userIdOrEmail, password]
  );

  const user = result.rows[0];
  if (!user) {
    const error = new Error('Invalid userId or password.');
    error.statusCode = 401;
    throw error;
  }

  await db.query('UPDATE users SET last_login_at = NOW() WHERE user_id = $1', [user.userId]);

  return {
    accessToken: tokenFor(user),
    user,
  };
}

async function signup(payload) {
  const userId = String(payload.userId || '').trim();
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const password = String(payload.password || '');

  if (!userId || !name || !email || !password) {
    const error = new Error('userId, name, email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const exists = await db.query(
    'SELECT 1 FROM users WHERE (user_id = $1 OR email = $2) AND is_deleted = FALSE LIMIT 1',
    [userId, email]
  );
  if (exists.rowCount > 0) {
    const error = new Error('User already exists.');
    error.statusCode = 409;
    throw error;
  }

  const inserted = await db.query(
    `INSERT INTO users (user_id, name, email, password, role, created_at, last_login_at, is_deleted)
     VALUES ($1, $2, $3, $4, 'GUARDIAN', NOW(), NOW(), FALSE)
     RETURNING user_id AS "userId", created_at AS "createdAt"`,
    [userId, name, email, password]
  );

  return inserted.rows[0];
}

async function findId(payload) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();

  const result = await db.query(
    `SELECT user_id AS "userId"
     FROM users
     WHERE name = $1 AND email = $2 AND is_deleted = FALSE
     LIMIT 1`,
    [name, email]
  );

  if (result.rowCount === 0) {
    const error = new Error('No account found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function findPassword(payload) {
  const userId = String(payload.userId || '').trim();
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();

  const result = await db.query(
    `SELECT 1
     FROM users
     WHERE user_id = $1 AND name = $2 AND email = $3 AND is_deleted = FALSE
     LIMIT 1`,
    [userId, name, email]
  );

  if (result.rowCount === 0) {
    const error = new Error('No account found.');
    error.statusCode = 404;
    throw error;
  }

  return { temporaryPasswordIssued: true };
}

async function withdrawMe(userId) {
  if (!userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  const updated = await db.query(
    `UPDATE users
     SET is_deleted = TRUE, deleted_at = NOW()
     WHERE user_id = $1 AND is_deleted = FALSE
     RETURNING user_id`,
    [userId]
  );

  if (updated.rowCount === 0) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  return { deleted: true };
}

module.exports = {
  login,
  signup,
  findId,
  findPassword,
  withdrawMe,
};
