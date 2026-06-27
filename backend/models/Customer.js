const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  telephone: {
    type: String,
    required: [true, 'Telephone number is required'],
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  contactPerson: {
    type: String,
    trim: true,
  },
  creditBalance: {
    type: Number,
    default: 0,
  },
  totalPurchases: {
    type: Number,
    default: 0,
  },
  lastPurchaseDate: {
    type: Date,
  },
  outstandingInvoices: [{
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    amount: Number,
    date: Date,
    dueDate: Date,
    daysOverdue: Number,
  }],
  notes: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

customerSchema.index({ telephone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ creditBalance: 1 });

module.exports = mongoose.model('Customer', customerSchema);
