const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { rbac, permission } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/audit');

const router = express.Router();

router.use(auth);
router.use(rbac('administrator'));

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { username: new RegExp(req.query.search, 'i') },
      ];
    }

    const users = await User.find(filter)
      .select('-password -twoFactorSecret -otpCode -otpExpiry -sessions')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -twoFactorSecret -otpCode -otpExpiry')
      .populate('branch', 'name code address');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user.', error: error.message });
  }
});

router.post('/', auditLogger('user_created'), async (req, res) => {
  try {
    const { name, email, username, password, role, branch, allowedIps } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email or username already exists.' });
    }

    const user = await User.create({
      name, email, username, password, role, branch, allowedIps,
    });

    const userData = await User.findById(user._id)
      .select('-password -twoFactorSecret -otpCode -otpExpiry');

    res.status(201).json({ message: 'User created successfully.', data: userData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user.', error: error.message });
  }
});

router.put('/:id', auditLogger('user_updated'), async (req, res) => {
  try {
    const updates = {};
    const allowed = ['name', 'email', 'role', 'branch', 'allowedIps', 'isActive', 'isSuspended'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.password) {
      updates.password = req.body.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .select('-password -twoFactorSecret -otpCode -otpExpiry');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'User updated successfully.', data: user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user.', error: error.message });
  }
});

router.delete('/:id', auditLogger('user_deleted'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted permanently.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user.', error: error.message });
  }
});

module.exports = router;
