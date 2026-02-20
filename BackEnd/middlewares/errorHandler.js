function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: 'Not Found',
    code: 'NOT_FOUND',
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');

  console.error('[error]', err);

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    code,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};