const { Pool } = require('pg');
const { getDbConfig } = require('../config/env');

const pool = new Pool(getDbConfig());

pool.on('error', (error) => {
  console.error('[db] unexpected idle client error', error);
});

async function checkDbConnection() {
  const result = await pool.query('SELECT NOW() AS now');
  console.log(`[db] connected at ${result.rows[0].now}`);
  return result.rows[0];
}

function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  pool,
  query,
  checkDbConnection,
};