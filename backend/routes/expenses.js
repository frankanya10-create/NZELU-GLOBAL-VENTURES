const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/audit');

const router = express.Router();

router.use(auth);

router.get('/', rbac('administrator', 'manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.category) filter.category = req.query.category;
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('recordedBy', 'name')
      .populate('branch', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(filter);

    res.json({ data: expenses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch expenses.', error: error.message });
  }
});

router.post('/', rbac('administrator', 'manager'), auditLogger('expense_logged'), async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      recordedBy: req.user._id,
    });
    res.status(201).json({ message: 'Expense recorded.', data: expense });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record expense.', error: error.message });
  }
});

module.exports = router;
