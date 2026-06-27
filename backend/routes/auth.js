const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { createAuditLog } = require('../middleware/audit');
const { generateFingerprint, parseDeviceInfo } = require('../utils/fingerprint');
const { sendCredentialsEmail } = require('../utils/email');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      await AuditLog.create({
        event: 'login_failed',
        userName: email,
        ipAddress: req.ip,
        deviceInfo: parseDeviceInfo(req),
        details: { reason: 'Invalid credentials' },
      });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.isActive || user.isSuspended) {
      await AuditLog.create({
        event: 'login_failed',
        user: user._id,
        userName: user.name,
        userRole: user.role,
        ipAddress: req.ip,
        deviceInfo: parseDeviceInfo(req),
        details: { reason: 'Account suspended or inactive' },
      });
      return res.status(403).json({ message: 'Account is suspended. Contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuditLog.create({
        event: 'login_failed',
        user: user._id,
        userName: user.name,
        userRole: user.role,
        ipAddress: req.ip,
        deviceInfo: parseDeviceInfo(req),
        details: { reason: 'Invalid password' },
      });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const fingerprint = generateFingerprint(req);
    const deviceInfo = parseDeviceInfo(req);

    if (user.role === 'cashier' && user.branch) {
      const branch = await Branch.findById(user.branch);
      if (branch && branch.allowedIpRanges && branch.allowedIpRanges.length > 0) {
        const clientIp = req.ip || req.connection?.remoteAddress;
        const ipAllowed = branch.allowedIpRanges.some(range => {
          if (range.includes('/')) {
            const [base, bits] = range.split('/');
            return clientIp?.startsWith(base.substring(0, base.lastIndexOf('.')));
          }
          return clientIp === range;
        });
        if (!ipAllowed) {
          await AuditLog.create({
            event: 'login_failed',
            user: user._id,
            userName: user.name,
            userRole: user.role,
            ipAddress: req.ip,
            deviceInfo,
            fingerprint,
            details: { reason: 'IP not in allowed ranges', clientIp },
          });
          return res.status(403).json({ message: 'Access restricted. IP not authorized for this branch.' });
        }
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '8h' }
    );

    user.sessions.push({
      token,
      deviceInfo,
      ipAddress: req.ip,
      fingerprint,
      lastActivity: new Date(),
      loginAt: new Date(),
      isActive: true,
    });

    if (user.sessions.length > 50) {
      user.sessions = user.sessions.slice(-25);
    }

    await user.save();

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    });

    await AuditLog.create({
      event: 'login',
      user: user._id,
      userName: user.name,
      userRole: user.role,
      ipAddress: req.ip,
      deviceInfo,
      fingerprint,
      details: { loginComplete: true },
    });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    const user = req.user;
    const session = user.sessions.id(req.session?._id);

    if (session) {
      session.isActive = false;
    } else {
      user.sessions = user.sessions.map(s => {
        if (s.token === req.token) s.isActive = false;
        return s;
      });
    }

    await user.save();

    await AuditLog.create({
      event: 'logout',
      user: user._id,
      userName: user.name,
      userRole: user.role,
      ipAddress: req.ip,
    });

    res.clearCookie('token');
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed.', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/check-inactivity', auth, async (req, res) => {
  const user = req.user;
  const session = user.sessions.id(req.session?._id);
  if (session) {
    session.lastActivity = new Date();
    await user.save();
  }
  res.json({ ok: true });
});

router.post('/register', auth, rbac('administrator'), async (req, res) => {
  try {
    const { name, email, password, role, branch } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    const validRoles = ['administrator', 'manager', 'cashier', 'storekeeper'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    let username = emailPrefix;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${emailPrefix}${counter}`;
      counter++;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      username,
      password,
      role,
      branch: branch || null,
    });

    await AuditLog.create({
      event: 'user_created',
      user: user._id,
      userName: user.name,
      userRole: user.role,
      ipAddress: req.ip,
      details: { action: 'admin_creation', createdBy: req.user?.name },
    });

    sendCredentialsEmail({ name, email, username, password, role }).catch(err => {
      console.error('Failed to send credential email:', err.message);
    });

    res.status(201).json({
      message: 'Staff account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        tempPassword: password,
      },
    });
  } catch (error) {
    console.error('Staff creation error:', error);
    res.status(500).json({ message: 'Staff creation failed.', error: error.message });
  }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      event: 'password_changed',
      user: user._id,
      userName: user.name,
      userRole: user.role,
      ipAddress: req.ip,
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Password change failed.', error: error.message });
  }
});

module.exports = router;
