const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[db] DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString,
});

pool.on('error', (error) => {
  console.error('[db] unexpected idle client error', error);
});

async function checkDbConnection() {
  const result = await pool.query('SELECT NOW() AS now');
  console.log(`[db] connected at ${result.rows[0].now}`);
  return result.rows[0];
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  checkDbConnection,
};
