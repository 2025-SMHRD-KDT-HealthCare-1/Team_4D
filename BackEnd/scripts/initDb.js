require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');

async function run() {
  const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
  const seedSql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'seed.sql'), 'utf8');

  try {
    await pool.query('BEGIN');
    await pool.query(schemaSql);
    await pool.query(seedSql);
    await pool.query('COMMIT');
    console.log('[db:init] schema and seed applied successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('[db:init] failed', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
