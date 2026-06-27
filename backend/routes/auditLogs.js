const express = require('express');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const { rbac, permission } = require('../middleware/rbac');

const router = express.Router();

router.use(auth);
router.use(rbac('administrator'));

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.event) filter.event = req.query.event;
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }
    if (req.query.search) {
      filter.$or = [
        { userName: new RegExp(req.query.search, 'i') },
        { event: new RegExp(req.query.search, 'i') },
        { ipAddress: new RegExp(req.query.search, 'i') },
      ];
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.json({ data: logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs.', error: error.message });
  }
});

router.get('/events', async (req, res) => {
  try {
    const events = await AuditLog.distinct('event');
    res.json({ data: events });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch event types.', error: error.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalLogs, todayLogs, eventsByType, recentActivity] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      AuditLog.aggregate([
        { $group: { _id: '$event', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      AuditLog.find().sort({ createdAt: -1 }).limit(10)
        .populate('user', 'name'),
    ]);

    res.json({
      data: { totalLogs, todayLogs, eventsByType, recentActivity },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch summary.', error: error.message });
  }
});

module.exports = router;
