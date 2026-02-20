const db = require('../db/pool');

async function check() {
  const ping = await db.query('SELECT 1 AS ok');
  return {
    status: 'ok',
    database: ping.rows[0]?.ok === 1,
  };
}

module.exports = {
  check,
};
