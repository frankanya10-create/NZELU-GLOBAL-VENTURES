const express = require('express');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Roll = require('../models/Roll');
const User = require('../models/User');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');

const router = express.Router();

router.use(auth);

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const role = req.user.role;
    const branchFilter = req.user.branch ? { branch: req.user.branch } : {};

    const filter = { isDeleted: { $ne: true }, status: { $ne: 'draft' }, ...branchFilter };

    const [
      todaySales,
      monthlySales,
      yearlySales,
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      totalProducts,
      totalCustomers,
      activeRolls,
      lowStockProducts,
      totalExpenses,
      recentInvoices,
      topCustomers,
    ] = await Promise.all([
      Invoice.aggregate([
        { $match: { ...filter, date: { $gte: todayStart }, type: 'cash_sales', status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { ...filter, date: { $gte: monthStart }, type: 'cash_sales', status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { ...filter, date: { $gte: yearStart }, type: 'cash_sales', status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Invoice.countDocuments(filter),
      Invoice.countDocuments({ ...filter, paymentStatus: 'unpaid' }),
      Invoice.countDocuments({ ...filter, paymentStatus: 'paid' }),
      Product.countDocuments({ isActive: true, ...(role !== 'administrator' ? {} : {}) }),
      Customer.countDocuments({ isActive: true }),
      Roll.countDocuments({ status: 'active', remainingBalance: { $gt: 0 }, ...branchFilter }),
      Product.aggregate([
        { $match: { isActive: true } },
        { $match: { $expr: { $lte: ['$stock', '$minStockLevel'] } } },
        { $count: 'count' },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: monthStart }, ...branchFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer', 'name telephone')
        .populate('createdBy', 'name'),
      Invoice.aggregate([
        { $match: { ...filter, 'items.product': { $ne: null } } },
        { $unwind: '$items' },
        { $match: { 'items.product': { $ne: null } } },
        { $group: { _id: '$items.product', totalQty: { $sum: '$items.quantity' }, totalAmount: { $sum: '$items.total' }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$product.name', sku: '$product.sku', unit: '$product.unit', totalQty: 1, totalAmount: 1, count: 1 } },
      ]),
    ]);

    const data = {
      todaySales: todaySales[0]?.total || 0,
      todaySalesCount: todaySales[0]?.count || 0,
      monthlySales: monthlySales[0]?.total || 0,
      monthlySalesCount: monthlySales[0]?.count || 0,
      yearlySales: yearlySales[0]?.total || 0,
      yearlySalesCount: yearlySales[0]?.count || 0,
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      totalProducts,
      totalCustomers,
      activeRolls,
      lowStockProducts: lowStockProducts[0]?.count || 0,
      monthlyExpenses: totalExpenses[0]?.total || 0,
      recentInvoices,
      topProducts,
    };

    if (role === 'administrator' || role === 'manager') {
      data.profitEstimate = data.monthlySales - (totalExpenses[0]?.total || 0);
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data.', error: error.message });
  }
});

module.exports = router;
