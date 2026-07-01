const express = require('express');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Roll = require('../models/Roll');
const CuttingHistory = require('../models/CuttingHistory');
const User = require('../models/User');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { rbac, permission } = require('../middleware/rbac');
const { auditLogger, createAuditLog } = require('../middleware/audit');
const { generateInvoiceCode } = require('../utils/helpers');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = { isDeleted: { $ne: true } };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }
    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { invoiceCode: new RegExp(escaped, 'i') },
        { 'customerSnapshot.name': new RegExp(escaped, 'i') },
        { 'customerSnapshot.telephone': new RegExp(escaped, 'i') },
        { 'customerSnapshot.email': new RegExp(escaped, 'i') },
        { billTo: new RegExp(escaped, 'i') },
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('customer', 'name telephone')
      .populate('createdBy', 'name')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(filter);

    res.json({
      data: invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoices.', error: error.message });
  }
});

router.get('/next-code', async (req, res) => {
  try {
    const type = req.query.type || 'proforma';
    const code = await generateInvoiceCode(Invoice, type);
    res.json({ code });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate code.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'name telephone email address')
      .populate('createdBy', 'name')
      .populate('branch', 'name code address')
      .populate('items.product', 'name sku category')
      .populate('items.roll', 'rollId remainingBalance');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    if (req.user && !req.user.hasPermission('canViewCostPrice')) {
      invoice.items.forEach(item => {
        if (item.product && item.product.prices) {
          item.product.prices = undefined;
        }
      });
    }

    res.json({ data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoice.', error: error.message });
  }
});

router.post('/', auditLogger('invoice_created', {
  getResourceId: (req, res, body) => body?.data?._id || body?._id,
}), async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'storekeeper') {
      return res.status(403).json({ message: 'Storekeepers cannot create invoices.' });
    }

    const invoiceData = { ...req.body, createdBy: req.user._id, branch: req.body.branch || req.user.branch };

    if (invoiceData.type === 'proforma') {
      const date = invoiceData.date ? new Date(invoiceData.date) : new Date();
      invoiceData.validityDate = new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    if (invoiceData.customer) {
      try {
        const customer = await Customer.findById(invoiceData.customer);
        if (customer) {
          invoiceData.customerSnapshot = {
            name: customer.name,
            telephone: customer.telephone,
            address: customer.address,
          };
        }
      } catch {
        delete invoiceData.customer;
      }
    }

    if (invoiceData.discount && invoiceData.discount > 0) {
      if (role === 'cashier' && !invoiceData.discountApproval?.approvedBy) {
        return res.status(403).json({
          message: 'Discount requires supervisor approval.',
          requireDiscountApproval: true,
        });
      }
    }

    invoiceData.invoiceCode = await generateInvoiceCode(Invoice, invoiceData.type || 'proforma');

    const invoice = await Invoice.create(invoiceData);

    await createAuditLog('invoice_created', req.user, req, {
      invoiceCode: invoice.invoiceCode,
      type: invoice.type,
      grandTotal: invoice.grandTotal,
    });

    res.status(201).json({ message: 'Invoice created successfully.', data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create invoice.', error: error.message });
  }
});

router.put('/:id', auditLogger('invoice_updated'), async (req, res) => {
  try {
    if (req.user.role === 'storekeeper') {
      return res.status(403).json({ message: 'Storekeepers cannot update invoices.' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot update a ${invoice.status} invoice.` });
    }

    const updates = req.body;

    if (updates.customer) {
      const customer = await Customer.findById(updates.customer);
      if (customer) {
        updates.customerSnapshot = {
          name: customer.name,
          telephone: customer.telephone,
          address: customer.address,
        };
      }
    }

    if (updates.discount && updates.discount > 0 && req.user.role === 'cashier' && !updates.discountApproval?.approvedBy) {
      return res.status(403).json({
        message: 'Discount requires supervisor approval.',
        requireDiscountApproval: true,
      });
    }

    Object.assign(invoice, updates);
    await invoice.save();

    res.json({ message: 'Invoice updated successfully.', data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update invoice.', error: error.message });
  }
});

router.post('/:id/commit', auditLogger('invoice_paid'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('items.roll', 'rollId remainingBalance');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    if (invoice.type !== 'cash_sales') {
      return res.status(400).json({ message: 'Only Cash Sales invoices can be committed.' });
    }

    invoice.status = 'paid';
    invoice.amountPaid = req.body.amountPaid || invoice.grandTotal;
    await invoice.save();

    if (invoice.customer) {
      const customer = await Customer.findById(invoice.customer);
      if (customer) {
        customer.totalPurchases = (customer.totalPurchases || 0) + invoice.grandTotal;
        customer.lastPurchaseDate = new Date();
        if (invoice.balanceDue > 0) {
          customer.creditBalance = (customer.creditBalance || 0) + invoice.balanceDue;
          customer.outstandingInvoices.push({
            invoice: invoice._id,
            amount: invoice.balanceDue,
            date: invoice.date,
            dueDate: invoice.validityDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            daysOverdue: 0,
          });
        }
        await customer.save();
      }
    }

    for (const item of invoice.items) {
      if (item.roll && item.quantity > 0) {
        const roll = await Roll.findById(item.roll);
        if (roll) {
          const remainingBefore = roll.remainingBalance;
          if (roll.remainingBalance < item.quantity) {
            return res.status(400).json({
              message: `Insufficient balance on Roll ${roll.rollId}. Available: ${roll.remainingBalance}, Required: ${item.quantity}`,
            });
          }
          roll.remainingBalance -= item.quantity;
          if (roll.remainingBalance <= 0) {
            roll.remainingBalance = 0;
            roll.status = 'depleted';
          }
          await roll.save();

          await CuttingHistory.create({
            roll: roll._id,
            rollId: roll.rollId,
            product: item.product,
            invoice: invoice._id,
            invoiceCode: invoice.invoiceCode,
            cutLength: item.quantity,
            unit: item.unit || roll.unit,
            remainingBefore,
            remainingAfter: roll.remainingBalance,
            cutBy: req.user._id,
            branch: invoice.branch,
          });

          await createAuditLog('cutting_logged', req.user, req, {
            rollId: roll.rollId,
            invoiceCode: invoice.invoiceCode,
            cutLength: item.quantity,
            remainingBefore,
            remainingAfter: roll.remainingBalance,
          });
        }
      }
    }

    await createAuditLog('invoice_paid', req.user, req, {
      invoiceCode: invoice.invoiceCode,
      grandTotal: invoice.grandTotal,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
    });

    res.json({ message: 'Invoice committed successfully.', data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Failed to commit invoice.', error: error.message });
  }
});

router.post('/:id/convert', auditLogger('invoice_converted'), async (req, res) => {
  try {
    const proforma = await Invoice.findById(req.params.id);
    if (!proforma) return res.status(404).json({ message: 'Invoice not found.' });
    if (proforma.type !== 'proforma') {
      return res.status(400).json({ message: 'Only proforma invoices can be converted.' });
    }
    if (proforma.status === 'converted') {
      return res.status(400).json({ message: 'This proforma has already been converted.' });
    }
    if (proforma.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot convert a cancelled proforma.' });
    }

    const salesInvoiceData = {
      type: 'cash_sales',
      status: 'paid',
      paymentStatus: 'paid',
      invoiceCode: await generateInvoiceCode(Invoice, 'cash_sales'),
      date: new Date(),
      customer: proforma.customer,
      customerSnapshot: proforma.customerSnapshot,
      billTo: proforma.billTo,
      items: proforma.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
        product: item.product,
        roll: item.roll,
        rollId: item.rollId,
      })),
      subtotal: proforma.subtotal,
      discount: proforma.discount,
      discountReason: proforma.discountReason,
      grandTotal: proforma.grandTotal,
      amountPaid: proforma.grandTotal,
      balanceDue: 0,
      createdBy: req.user._id,
      branch: proforma.branch || req.user.branch,
      notes: proforma.notes,
      convertedFrom: proforma._id,
    };

    const salesInvoice = await Invoice.create(salesInvoiceData);

    proforma.status = 'converted';
    proforma.paymentStatus = 'paid';
    proforma.convertedTo = salesInvoice._id;
    await proforma.save();

    if (proforma.customer) {
      const customer = await Customer.findById(proforma.customer);
      if (customer) {
        customer.totalPurchases = (customer.totalPurchases || 0) + salesInvoice.grandTotal;
        customer.lastPurchaseDate = new Date();
        await customer.save();
      }
    }

    for (const item of salesInvoice.items) {
      if (item.roll && item.quantity > 0) {
        const roll = await Roll.findById(item.roll);
        if (roll) {
          const remainingBefore = roll.remainingBalance;
          if (roll.remainingBalance < item.quantity) {
            return res.status(400).json({
              message: `Insufficient balance on Roll ${roll.rollId}. Available: ${roll.remainingBalance}, Required: ${item.quantity}`,
            });
          }
          roll.remainingBalance -= item.quantity;
          if (roll.remainingBalance <= 0) {
            roll.remainingBalance = 0;
            roll.status = 'depleted';
          }
          await roll.save();

          await CuttingHistory.create({
            roll: roll._id,
            rollId: roll.rollId,
            product: item.product,
            invoice: salesInvoice._id,
            invoiceCode: salesInvoice.invoiceCode,
            cutLength: item.quantity,
            unit: item.unit || roll.unit,
            remainingBefore,
            remainingAfter: roll.remainingBalance,
            cutBy: req.user._id,
            branch: salesInvoice.branch,
          });
        }
      }
    }

    await createAuditLog('invoice_converted', req.user, req, {
      proformaCode: proforma.invoiceCode,
      salesCode: salesInvoice.invoiceCode,
      grandTotal: salesInvoice.grandTotal,
    });

    res.json({
      message: 'Proforma converted to Sales Invoice successfully.',
      data: { proforma, salesInvoice },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to convert invoice.', error: error.message });
  }
});

router.post('/:id/approve-discount', rbac('administrator', 'manager'), async (req, res) => {
  try {
    const { reason } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    invoice.discountApproval = {
      approvedBy: req.user._id,
      approvedAt: new Date(),
      reason: reason || 'Approved by manager',
      discountValue: invoice.discount,
      approverName: req.user.name,
    };
    await invoice.save();

    await createAuditLog('discount_approved', req.user, req, {
      invoiceCode: invoice.invoiceCode,
      discount: invoice.discount,
      reason,
      approver: req.user.name,
    });

    res.json({ message: 'Discount approved successfully.', data: invoice });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve discount.', error: error.message });
  }
});

router.delete('/:id', rbac('administrator'), auditLogger('invoice_deleted'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id,
    }, { new: true });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json({ message: 'Invoice deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete invoice.', error: error.message });
  }
});

module.exports = router;
