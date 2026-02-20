require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./app');
const { getPort } = require('./config/env');
const { checkDbConnection } = require('./db/pool');

const port = getPort();

async function bootstrap() {
  try {
    await checkDbConnection();
  } catch (error) {
    console.error('[server] database connection failed', error);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`[server] listening on port ${port}`);
  });
}

void bootstrap();
