const express = require('express');
const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/audit');
const { generateTransferCode } = require('../utils/helpers');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.fromBranch) filter.fromBranch = req.query.fromBranch;
    if (req.query.toBranch) filter.toBranch = req.query.toBranch;

    const transfers = await Transfer.find(filter)
      .populate('fromBranch', 'name code')
      .populate('toBranch', 'name code')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    res.json({ data: transfers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transfers.', error: error.message });
  }
});

router.post('/', rbac('storekeeper', 'administrator'), auditLogger('transfer_created'), async (req, res) => {
  try {
    const transfer = await Transfer.create({
      ...req.body,
      transferCode: await generateTransferCode(Transfer),
      requestedBy: req.user._id,
    });
    res.status(201).json({ message: 'Transfer request created.', data: transfer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create transfer.', error: error.message });
  }
});

router.put('/:id/approve', rbac('administrator', 'manager'), auditLogger('transfer_approved'), async (req, res) => {
  try {
    const transfer = await Transfer.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date(),
    }, { new: true });
    if (!transfer) return res.status(404).json({ message: 'Transfer not found.' });
    res.json({ message: 'Transfer approved.', data: transfer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve transfer.', error: error.message });
  }
});

router.put('/:id/status', rbac('storekeeper', 'administrator'), async (req, res) => {
  try {
    const updates = { status: req.body.status };
    if (req.body.status === 'completed') updates.completedAt = new Date();

    const transfer = await Transfer.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!transfer) return res.status(404).json({ message: 'Transfer not found.' });
    res.json({ message: `Transfer status updated to ${req.body.status}.`, data: transfer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update transfer status.', error: error.message });
  }
});

module.exports = router;
