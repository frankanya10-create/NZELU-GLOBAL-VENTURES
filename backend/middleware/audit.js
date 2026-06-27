const AuditLog = require('../models/AuditLog');

const auditLogger = (eventType, options = {}) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function(body) {
      if (res.statusCode < 400) {
        try {
          const details = typeof options.getDetails === 'function'
            ? options.getDetails(req, res, body)
            : options.details || {};

          const resource = options.resource || req.baseUrl || req.originalUrl;
          const resourceId = options.getResourceId
            ? options.getResourceId(req, res, body)
            : req.params?.id || body?._id || body?.data?._id;

          await AuditLog.create({
            event: eventType,
            user: req.user?._id,
            userName: req.user?.name || 'system',
            userRole: req.user?.role || 'system',
            ipAddress: req.ip,
            deviceInfo: req.session?.deviceInfo || {},
            fingerprint: req.session?.fingerprint,
            action: req.method,
            resource,
            resourceId,
            details,
            metadata: options.metadata || {},
          });
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

const createAuditLog = async (event, user, req, details = {}) => {
  try {
    await AuditLog.create({
      event,
      user: user._id,
      userName: user.name,
      userRole: user.role,
      ipAddress: req.ip,
      deviceInfo: req.session?.deviceInfo || {},
      fingerprint: req.session?.fingerprint,
      details,
    });
  } catch (err) {
    console.error('Audit log creation error:', err.message);
  }
};

module.exports = { auditLogger, createAuditLog };
