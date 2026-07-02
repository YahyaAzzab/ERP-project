const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const getModuleFromPath = (path = '') => {
  if (path.startsWith('/api/auth')) return 'AUTH';
  if (path.startsWith('/api/comptabilite')) return 'COMPTABILITE';
  if (path.startsWith('/api/rh')) return 'RH';
  if (path.startsWith('/api/stocks')) return 'STOCKS';
  if (path.startsWith('/api/dashboard')) return 'DASHBOARD';
  if (path.startsWith('/api/clients')) return 'CLIENTS';
  if (path.startsWith('/api/messages')) return 'MESSAGERIE';
  if (path.startsWith('/api/notifications')) return 'NOTIFICATIONS';
  if (path.startsWith('/api/logs')) return 'PARAMETRES';
  return 'GENERAL';
};

const normalizePathForAction = (path = '') => path
  .split('?')[0]
  .split('/')
  .map((chunk) => (OBJECT_ID_REGEX.test(chunk) ? ':id' : chunk))
  .join('/');

const getUserFromToken = (req) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'erp-pme-api',
      audience: 'erp-pme-front',
    });

    return {
      _id: decoded._id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    return null;
  }
};

const shouldLogRequest = (req) => {
  if (!req.originalUrl?.startsWith('/api/')) return false;
  if (req.originalUrl.startsWith('/api/health')) return false;
  if (req.method === 'OPTIONS') return false;
  return true;
};

const auditLogMiddleware = (req, res, next) => {
  if (!shouldLogRequest(req)) return next();

  const startedAt = Date.now();

  res.on('finish', async () => {
    try {
      const currentUser = req.user || getUserFromToken(req);
      const path = req.originalUrl?.split('?')[0] || req.path || '/';
      const actionPath = normalizePathForAction(path);
      const method = String(req.method || 'GET').toUpperCase();
      const statusCode = Number(res.statusCode || 0);

      await AuditLog.create({
        user: currentUser?._id || null,
        email: currentUser?.email || '',
        role: currentUser?.role || 'ANONYME',
        module: getModuleFromPath(path),
        action: `${method} ${actionPath}`,
        method,
        path,
        statusCode,
        success: statusCode >= 200 && statusCode < 400,
        durationMs: Math.max(0, Date.now() - startedAt),
        ip: req.ip || req.headers['x-forwarded-for'] || '',
        userAgent: req.headers['user-agent'] || '',
        query: req.query || {},
      });
    } catch (err) {
      // No-op: logging failures should never break API responses.
    }
  });

  return next();
};

module.exports = auditLogMiddleware;
