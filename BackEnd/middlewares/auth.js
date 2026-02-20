function parseToken(authorizationHeader) {
  if (!authorizationHeader) return null;

  const [scheme, token] = String(authorizationHeader).split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  const match = token.match(/^mock-token-(ADMIN|GUARDIAN)-(.+)$/);
  if (!match) return null;

  return {
    role: match[1],
    userId: match[2],
  };
}

function requireAuth(req, res, next) {
  const auth = parseToken(req.headers.authorization);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.auth = auth;
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
