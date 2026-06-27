const express = require('express');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Roll = require('../models/Roll');
const Customer = require('../models/Customer');
const CuttingHistory = require('../models/CuttingHistory');
const auth = require('../middleware/auth');
const { rbac, permission } = require('../middleware/rbac');
const { calculateAgeing } = require('../utils/helpers');

const router = express.Router();

router.use(auth);

router.get('/daily-sales', rbac('administrator', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, branch } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));
    const match = { isDeleted: { $ne: true }, type: 'cash_sales', status: 'paid', date: { $gte: start, $lte: end } };
    if (branch) match.branch = branch;

    const sales = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalSales: { $sum: '$grandTotal' },
          totalDiscount: { $sum: '$discount' },
          totalVat: { $sum: '$vatAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const summary = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          grandTotal: { $sum: '$grandTotal' },
          totalDiscount: { $sum: '$discount' },
          totalVat: { $sum: '$vatAmount' },
          totalPaid: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ data: { sales, summary: summary[0] || {} } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report.', error: error.message });
  }
});

router.get('/monthly-sales', rbac('administrator', 'manager'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const match = {
      isDeleted: { $ne: true },
      type: 'cash_sales',
      status: 'paid',
      date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) },
    };
    if (req.query.branch) match.branch = req.query.branch;

    const sales = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $month: '$date' },
          totalSales: { $sum: '$grandTotal' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data: sales });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report.', error: error.message });
  }
});

router.get('/pnl', rbac('administrator'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month);
    const branch = req.query.branch;

    const dateFilter = { $gte: new Date(year, (month || 1) - 1, 1) };
    if (month) {
      const nextMonth = month === 12 ? 0 : month;
      const nextYear = month === 12 ? year + 1 : year;
      dateFilter.$lte = new Date(nextYear, nextMonth, 0, 23, 59, 59);
    } else {
      dateFilter.$lte = new Date(year, 11, 31, 23, 59, 59);
    }

    const match = { date: dateFilter };
    if (branch) match.branch = branch;

    const [salesData, expensesData] = await Promise.all([
      Invoice.aggregate([
        { $match: { ...match, isDeleted: { $ne: true }, type: 'cash_sales', status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const revenue = salesData[0]?.total || 0;
    const expenses = expensesData[0]?.total || 0;

    res.json({
      data: {
        revenue,
        expenses,
        grossProfit: revenue,
        netProfit: revenue - expenses,
        expenseRatio: revenue > 0 ? ((expenses / revenue) * 100).toFixed(2) : 0,
        period: month ? `${month}/${year}` : String(year),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate P&L.', error: error.message });
  }
});

router.get('/stock-valuation', rbac('administrator', 'manager'), async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('prices');
    const rolls = await Roll.find({ status: 'active', remainingBalance: { $gt: 0 } });

    const totalStockValue = products.reduce((sum, p) => {
      return sum + ((p.stock || 0) * (p.prices?.cost || 0));
    }, 0);

    const totalRollValue = rolls.reduce((sum, r) => {
      return sum + (r.remainingBalance * (r.prices?.cost || 0));
    }, 0);

    res.json({
      data: {
        totalProducts: products.length,
        totalRolls: rolls.length,
        totalStockValue,
        totalRollValue,
        combinedValue: totalStockValue + totalRollValue,
        lowStockItems: products.filter(p => p.stock <= p.minStockLevel),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate valuation.', error: error.message });
  }
});

router.get('/ageing', rbac('administrator', 'manager'), async (req, res) => {
  try {
    const customers = await Customer.find({
      isActive: true,
      'outstandingInvoices.0': { $exists: true },
    });

    const ageingData = customers.reduce((acc, customer) => {
      const ageing = calculateAgeing(customer.outstandingInvoices || []);
      ageing.forEach(bucket => {
        if (!acc[bucket.range]) acc[bucket.range] = { total: 0, customers: [] };
        acc[bucket.range].total += bucket.total;
        acc[bucket.range].customers.push({
          name: customer.name,
          telephone: customer.telephone,
          amount: bucket.total,
        });
      });
      return acc;
    }, {});

    res.json({ data: ageingData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate ageing report.', error: error.message });
  }
});

router.get('/cutting-history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const cuts = await CuttingHistory.find()
      .populate('product', 'name sku')
      .populate('cutBy', 'name')
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CuttingHistory.countDocuments();

    res.json({ data: cuts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cutting history.', error: error.message });
  }
});

module.exports = router;
