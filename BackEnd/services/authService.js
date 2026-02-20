const db = require('../db/pool');

let usersMetaPromise;

function tokenFor(user) {
  return `mock-token-${user.role}-${user.userId}`;
}

function createBadRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function getUsersMeta() {
  if (usersMetaPromise) {
    return usersMetaPromise;
  }

  usersMetaPromise = db
    .query(
      `SELECT column_name, data_type, is_identity, identity_generation, column_default
       FROM information_schema.columns
       WHERE table_name = 'users'`
    )
    .then((result) => {
      const map = new Map(result.rows.map((row) => [row.column_name, row.data_type]));
      const userIdType = map.get('user_id') || 'text';
      const userIdColumn = result.rows.find((row) => row.column_name === 'user_id') || {};
      const userIdGeneratedAlways =
        userIdColumn.is_identity === 'YES' &&
        String(userIdColumn.identity_generation || '').toUpperCase() === 'ALWAYS';

      return {
        hasIsDeleted: map.has('is_deleted'),
        hasDeletedAt: map.has('deleted_at'),
        hasLastLoginAt: map.has('last_login_at'),
        hasCreatedAt: map.has('created_at'),
        userIdIsNumeric: ['smallint', 'integer', 'bigint', 'numeric', 'decimal'].includes(userIdType),
        userIdGeneratedAlways,
      };
    });

  return usersMetaPromise;
}

function normalizeUserId(rawUserId, usersMeta) {
  const userId = String(rawUserId || '').trim();

  if (!userId && !usersMeta.userIdGeneratedAlways) {
    throw createBadRequest('userId is required.');
  }

  return userId;
}

async function resolveSignupUserId(rawUserId, usersMeta) {
  const requestedUserId = normalizeUserId(rawUserId, usersMeta);

  if (!usersMeta.userIdIsNumeric || /^\d+$/.test(requestedUserId)) {
    return { requestedUserId, userId: requestedUserId };
  }

  if (usersMeta.userIdGeneratedAlways) {
    return { requestedUserId, userId: '' };
  }

  const nextIdResult = await db.query('SELECT COALESCE(MAX(user_id), 0) + 1 AS next_id FROM users');
  return {
    requestedUserId,
    userId: String(nextIdResult.rows[0].next_id),
  };
}

function softDeleteFilter(usersMeta, withAnd = true) {
  if (!usersMeta.hasIsDeleted) {
    return '';
  }

  return withAnd ? ' AND is_deleted = FALSE' : 'is_deleted = FALSE';
}

async function login(payload) {
  const userIdOrEmail = String(payload.userId || payload.email || '').trim();
  const password = String(payload.password || '');

  if (!userIdOrEmail || !password) {
    throw createBadRequest('userId/email and password are required.');
  }

  const usersMeta = await getUsersMeta();
  const allowEmailLocalPartLogin = usersMeta.userIdGeneratedAlways && !userIdOrEmail.includes('@');
  const idMatchCondition = allowEmailLocalPartLogin
    ? '(user_id::text = $1 OR email = $1 OR split_part(email, \'@\', 1) = $1)'
    : '(user_id::text = $1 OR email = $1)';

  const result = await db.query(
    `SELECT
       user_id::text AS "userId",
       name,
       email,
       role
     FROM users
     WHERE ${idMatchCondition}
       AND password = $2${softDeleteFilter(usersMeta)}
     LIMIT 1`,
    [userIdOrEmail, password]
  );

  const user = result.rows[0];
  if (!user) {
    const error = new Error('Invalid userId or password.');
    error.statusCode = 401;
    throw error;
  }

  if (usersMeta.hasLastLoginAt) {
    await db.query('UPDATE users SET last_login_at = NOW() WHERE user_id::text = $1', [user.userId]);
  }

  return {
    accessToken: tokenFor(user),
    user,
  };
}

async function signup(payload) {
  const usersMeta = await getUsersMeta();

  const { requestedUserId, userId } = await resolveSignupUserId(payload.userId, usersMeta);
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const password = String(payload.password || '');

  if (!name || !email || !password) {
    throw createBadRequest('userId, name, email and password are required.');
  }

  const requestedIsNonNumeric = usersMeta.userIdIsNumeric && !/^\d+$/.test(requestedUserId);
  const exists = requestedIsNonNumeric || usersMeta.userIdGeneratedAlways
    ? await db.query(
        `SELECT 1
         FROM users
         WHERE email = $1${softDeleteFilter(usersMeta)}
         LIMIT 1`,
        [email]
      )
    : await db.query(
        `SELECT 1
         FROM users
         WHERE (user_id::text = $1 OR email = $2)${softDeleteFilter(usersMeta)}
         LIMIT 1`,
        [userId, email]
      );

  if (exists.rowCount > 0) {
    const error = new Error('User already exists.');
    error.statusCode = 409;
    throw error;
  }

  const params = [];
  const columns = [];
  const values = [];

  if (!usersMeta.userIdGeneratedAlways) {
    params.push(userId);
    columns.push('user_id');
    values.push(usersMeta.userIdIsNumeric ? `$${params.length}::bigint` : `$${params.length}`);
  }

  params.push(name);
  columns.push('name');
  values.push(`$${params.length}`);

  params.push(email);
  columns.push('email');
  values.push(`$${params.length}`);

  params.push(password);
  columns.push('password');
  values.push(`$${params.length}`);

  columns.push('role');
  values.push("'GUARDIAN'");

  if (usersMeta.hasCreatedAt) {
    columns.push('created_at');
    values.push('NOW()');
  }

  if (usersMeta.hasLastLoginAt) {
    columns.push('last_login_at');
    values.push('NOW()');
  }

  if (usersMeta.hasIsDeleted) {
    columns.push('is_deleted');
    values.push('FALSE');
  }

  const inserted = await db.query(
    `INSERT INTO users (${columns.join(', ')})
     VALUES (${values.join(', ')})
     RETURNING user_id::text AS "userId", ${usersMeta.hasCreatedAt ? 'created_at' : 'NOW()'} AS "createdAt"`,
    params
  );

  return inserted.rows[0];
}

async function findId(payload) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();

  const usersMeta = await getUsersMeta();

  const result = await db.query(
    `SELECT user_id::text AS "userId"
     FROM users
     WHERE name = $1 AND email = $2${softDeleteFilter(usersMeta)}
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
  const usersMeta = await getUsersMeta();

  const userId = normalizeUserId(payload.userId, usersMeta);
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();

  const result = await db.query(
    `SELECT 1
     FROM users
     WHERE user_id::text = $1 AND name = $2 AND email = $3${softDeleteFilter(usersMeta)}
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

  const usersMeta = await getUsersMeta();

  const updated = usersMeta.hasIsDeleted
    ? await db.query(
        `UPDATE users
         SET is_deleted = TRUE${usersMeta.hasDeletedAt ? ', deleted_at = NOW()' : ''}
         WHERE user_id::text = $1 AND ${softDeleteFilter(usersMeta, false)}
         RETURNING user_id::text AS "userId"`,
        [String(userId)]
      )
    : await db.query(
        `DELETE FROM users
         WHERE user_id::text = $1
         RETURNING user_id::text AS "userId"`,
        [String(userId)]
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
