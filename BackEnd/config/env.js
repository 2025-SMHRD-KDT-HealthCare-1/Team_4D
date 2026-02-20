function getPort() {
  return Number(process.env.PORT) || 3000;
}

function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD ?? ''),
  };
}

function getCorsOrigins() {
  const raw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSessionConfig() {
  return {
    secret: process.env.SESSION_SECRET || 'team5d-dev-session-secret',
    cookieName: process.env.SESSION_COOKIE_NAME || 'team5d.sid',
    maxAgeMs: Number(process.env.SESSION_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000),
    secure: process.env.NODE_ENV === 'production',
  };
}

module.exports = {
  getPort,
  getDbConfig,
  getCorsOrigins,
  getSessionConfig,
};