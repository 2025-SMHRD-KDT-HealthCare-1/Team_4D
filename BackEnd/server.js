require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const http = require('http');

const app = require('./app');
const { getPort } = require('./config/env');
const { checkDbConnection } = require('./db/pool');
const { initSocket } = require('./socket');

const port = getPort();
const server = http.createServer(app);

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`[server] port ${port} is already in use. Stop the existing process or change PORT.`);
    process.exit(1);
  }
  console.error('[server] failed to start', error);
  process.exit(1);
});

async function bootstrap() {
  try {
    await checkDbConnection();
  } catch (error) {
    console.error('[server] database connection failed', error);
    process.exit(1);
  }

  initSocket(server);

  server.listen(port, () => {
    console.log(`[server] listening on port ${port}`);
  });
}

void bootstrap();
