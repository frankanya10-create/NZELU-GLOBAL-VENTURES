const express = require('express');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/audit');
const { calculateAgeing } = require('../utils/helpers');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: new RegExp(escaped, 'i') },
        { telephone: new RegExp(escaped, 'i') },
        { email: new RegExp(escaped, 'i') },
      ];
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(filter);

    res.json({
      data: customers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customers.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });

    const invoices = await Invoice.find({ customer: req.params.id, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(20);

    const ageing = calculateAgeing(customer.outstandingInvoices || []);

    res.json({ data: { ...customer.toObject(), invoices, ageing } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customer.', error: error.message });
  }
});

router.post('/', auditLogger('customer_created'), async (req, res) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ message: 'Customer created successfully.', data: customer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create customer.', error: error.message });
  }
});

router.put('/:id', auditLogger('customer_updated'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json({ message: 'Customer updated successfully.', data: customer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update customer.', error: error.message });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'Search query required.' });

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const customers = await Customer.find({
      isActive: true,
      $or: [
        { name: new RegExp(escaped, 'i') },
        { telephone: new RegExp(escaped, 'i') },
        { email: new RegExp(escaped, 'i') },
      ],
    }).limit(10);

    res.json({ data: customers });
  } catch (error) {
    res.status(500).json({ message: 'Search failed.', error: error.message });
  }
});

module.exports = router;
