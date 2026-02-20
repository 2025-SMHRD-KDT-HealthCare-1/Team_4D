const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { getCorsOrigin, getPort } = require("./config/env");
const logger = require("./middlewares/logger");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");
const routes = require("./routes");

const app = express();

// Parse JSON bodies
app.use(express.json());

// CORS
app.use(
  cors({
    origin: getCorsOrigin(),
  })
);

// Request logging
app.use(logger);

// Routes
app.use("/api", routes);
app.use("/", routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

if (require.main === module) {
  require("dotenv").config({ path: require("path").join(__dirname, ".env") });
  const port = getPort();
  app.listen(port, () => {
    console.log(`[server] listening on port ${port}`);
  });
}

module.exports = app;
