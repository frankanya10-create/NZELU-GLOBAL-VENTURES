const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  sn: { type: Number },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'pcs' },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, default: 0 },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  roll: { type: mongoose.Schema.Types.ObjectId, ref: 'Roll' },
  rollId: { type: String },
  rollRemainingBefore: { type: Number },
}, { _id: false });

const discountApprovalSchema = new mongoose.Schema({
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  reason: { type: String },
  discountValue: { type: Number },
  approverName: { type: String },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceCode: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['proforma', 'cash_sales'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'part_payment', 'converted', 'cancelled'],
    default: 'draft',
  },
  convertedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  convertedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'part_payment', 'paid'],
    default: 'unpaid',
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  customerSnapshot: {
    name: String,
    telephone: String,
    address: String,
  },
  billTo: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  validityDate: {
    type: Date,
  },
  items: [lineItemSchema],
  subtotal: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountReason: {
    type: String,
  },
  discountApproval: discountApprovalSchema,
  vatRate: {
    type: Number,
    default: 7.5,
  },
  vatAmount: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    default: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  balanceDue: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  depositPercent: {
    type: Number,
    default: 70,
    min: 0,
    max: 100,
  },
  isSupplied: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

invoiceSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.items.forEach((item, index) => {
      item.sn = index + 1;
      item.total = item.quantity * item.unitPrice;
    });
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.discount = 0;
    this.vatRate = 0;
    this.vatAmount = 0;
    this.grandTotal = this.subtotal;
    this.balanceDue = this.grandTotal - this.amountPaid;

    if (this.amountPaid >= this.grandTotal) {
      this.paymentStatus = 'paid';
      if (this.type === 'cash_sales') this.status = 'paid';
    } else if (this.amountPaid > 0 && this.amountPaid < this.grandTotal) {
      this.paymentStatus = 'part_payment';
      this.status = 'part_payment';
    } else {
      this.paymentStatus = 'unpaid';
    }
  }
  next();
});

invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ type: 1, status: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ 'items.roll': 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
