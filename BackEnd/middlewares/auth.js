function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  if (req.session.user.status !== 'ACTIVE') {
    return res.status(403).json({ message: 'Account is not active.', code: 'ACCOUNT_NOT_ACTIVE' });
  }

  req.auth = req.session.user;
  return next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    if (req.session.user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Account is not active.', code: 'ACCOUNT_NOT_ACTIVE' });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' });
    }

    req.auth = req.session.user;
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
