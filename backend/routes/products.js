const express = require('express');
const Product = require('../models/Product');
const Roll = require('../models/Roll');
const auth = require('../middleware/auth');
const { rbac, permission } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/audit');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { sku: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
      ];
    }

    const products = await Product.find(filter)
      .populate('branch', 'name code')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    const restrictedRoles = ['cashier', 'storekeeper'];
    const filteredProducts = req.user && restrictedRoles.includes(req.user.role)
      ? products.map(p => {
          const obj = p.toObject();
          if (!req.user.hasPermission('canViewCostPrice')) {
            if (obj.prices) {
              obj.prices.cost = undefined;
              obj.prices.minimumSelling = undefined;
            }
          }
          if (!req.user.hasPermission('canEditPrice')) {
            obj.prices = undefined;
          }
          return obj;
        })
      : products;

    res.json({
      data: filteredProducts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('branch', 'name code');
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const rolls = await Roll.find({ product: req.params.id, status: 'active' })
      .sort({ createdAt: -1 });

    const result = product.toObject();
    if (req.user && !req.user.hasPermission('canViewCostPrice') && result.prices) {
      result.prices.cost = undefined;
      result.prices.minimumSelling = undefined;
    }

    res.json({ data: { ...result, rolls } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product.', error: error.message });
  }
});

router.post('/', rbac('administrator'), auditLogger('product_created'), async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ message: 'Product created successfully.', data: product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product.', error: error.message });
  }
});

router.put('/:id', rbac('administrator', 'manager'), auditLogger('product_updated'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product updated successfully.', data: product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product.', error: error.message });
  }
});

router.delete('/:id', rbac('administrator'), auditLogger('product_deleted'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product.', error: error.message });
  }
});

router.put('/prices/:id', rbac('administrator'), auditLogger('price_updated'), async (req, res) => {
  try {
    const { cost, selling, minimumSelling, wholesale, retail } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id,
      { prices: { cost, selling, minimumSelling, wholesale, retail } },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Prices updated successfully.', data: product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update prices.', error: error.message });
  }
});

module.exports = router;
