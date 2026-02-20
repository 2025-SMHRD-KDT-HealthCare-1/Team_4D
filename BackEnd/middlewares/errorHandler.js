// 404 handler
function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: "Not Found",
  });
}

// Common error handler
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  console.error("[error]", err);

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
