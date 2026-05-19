import crypto from 'node:crypto';

export function requireAdmin(req, res, next) {
  if (!req.session?.adminUser) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  return next();
}

export function requireCsrf(req, res, next) {
  const token = req.get('X-CSRF-Token');
  if (!token || token !== req.session?.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  return next();
}

export function createCsrfToken(req) {
  req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  return req.session.csrfToken;
}
