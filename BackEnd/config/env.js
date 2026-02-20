// Environment helpers
function getPort() {
  return Number(process.env.PORT) || 3000;
}

function getCorsOrigin() {
  const origin = process.env.CORS_ORIGIN;
  if (!origin || origin === '*') {
    return '*';
  }

  return origin.split(',').map((value) => value.trim());
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL || '';
}

module.exports = {
  getPort,
  getCorsOrigin,
  getDatabaseUrl,
};
