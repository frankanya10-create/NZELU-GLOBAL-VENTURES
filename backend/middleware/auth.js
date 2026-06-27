const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -twoFactorSecret -otpCode -otpExpiry');

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!user.isActive || user.isSuspended) {
      await AuditLog.create({
        event: 'login_failed',
        user: user._id,
        userName: user.name,
        userRole: user.role,
        ipAddress: req.ip,
        details: { reason: 'Account suspended or inactive' },
      });
      return res.status(403).json({ message: 'Account is suspended or inactive. Contact administrator.' });
    }

    const session = user.sessions.find(s => s.token === token && s.isActive === true);
    if (!session) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    const now = Date.now();
    const inactivityMs = process.env.INACTIVITY_TIMEOUT || 900000;
    if (session.lastActivity && (now - new Date(session.lastActivity).getTime() > inactivityMs)) {
      session.isActive = false;
      await user.save();
      await AuditLog.create({
        event: 'session_timeout',
        user: user._id,
        userName: user.name,
        userRole: user.role,
        ipAddress: req.ip,
      });
      return res.status(401).json({ message: 'Session timed out due to inactivity. Please login again.', timeout: true });
    }

    session.lastActivity = new Date();
    await user.save();

    req.user = user;
    req.token = token;
    req.session = session;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    return res.status(500).json({ message: 'Authentication error.', error: error.message });
  }
};

module.exports = auth;
