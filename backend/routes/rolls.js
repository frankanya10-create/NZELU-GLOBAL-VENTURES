const express = require('express');
const Roll = require('../models/Roll');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/audit');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.search) {
      filter.$or = [
        { rollId: new RegExp(req.query.search, 'i') },
      ];
    }

    const rolls = await Roll.find(filter)
      .populate('product', 'name sku category')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 });

    res.json({ data: rolls });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rolls.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const roll = await Roll.findById(req.params.id)
      .populate('product', 'name sku category prices')
      .populate('branch', 'name code');
    if (!roll) return res.status(404).json({ message: 'Roll not found.' });
    res.json({ data: roll });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch roll.', error: error.message });
  }
});

router.post('/', rbac('administrator', 'storekeeper'), auditLogger('roll_created'), async (req, res) => {
  try {
    const roll = await Roll.create({
      ...req.body,
      receivedBy: req.user._id,
    });

    const product = await Product.findById(req.body.product);
    if (product) {
      product.stock = (product.stock || 0) + req.body.initialBalance;
      product.hasRollTracking = true;
      await product.save();
    }

    res.status(201).json({ message: 'Roll created successfully.', data: roll });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create roll.', error: error.message });
  }
});

router.put('/:id', rbac('administrator', 'storekeeper'), auditLogger('roll_updated'), async (req, res) => {
  try {
    const roll = await Roll.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!roll) return res.status(404).json({ message: 'Roll not found.' });
    res.json({ message: 'Roll updated successfully.', data: roll });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update roll.', error: error.message });
  }
});

router.get('/product/:productId/active', async (req, res) => {
  try {
    const rolls = await Roll.find({
      product: req.params.productId,
      status: 'active',
      remainingBalance: { $gt: 0 },
    }).sort({ createdAt: -1 });

    res.json({ data: rolls });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active rolls.', error: error.message });
  }
});

module.exports = router;
