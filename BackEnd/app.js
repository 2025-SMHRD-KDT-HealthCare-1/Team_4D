const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSessionFactory = require('connect-pg-simple');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { getCorsOrigins, getSessionConfig } = require('./config/env');
const { pool } = require('./db/pool');
const logger = require('./middlewares/logger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();
const PgSession = pgSessionFactory(session);
const sessionConfig = getSessionConfig();
const corsOrigins = getCorsOrigins();
const preferPgSession = String(process.env.SESSION_STORE || '').toLowerCase() === 'pg';

app.set('trust proxy', 1);
app.set('etag', false);

app.use(express.json());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

const sessionOptions = {
  name: sessionConfig.cookieName,
  secret: sessionConfig.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: sessionConfig.secure,
    sameSite: 'lax',
    maxAge: sessionConfig.maxAgeMs,
  },
};

if (preferPgSession) {
  sessionOptions.store = new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: false,
  });
} else {
  console.log('[session] using MemoryStore (set SESSION_STORE=pg to use PostgreSQL session store)');
}

app.use(session(sessionOptions));

app.use(logger);

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.use('/api', routes);
app.use('/', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
