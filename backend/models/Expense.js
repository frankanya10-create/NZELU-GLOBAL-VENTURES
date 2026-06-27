const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  category: {
    type: String,
    enum: ['utilities', 'rent', 'salaries', 'transport', 'supplies', 'maintenance', 'marketing', 'other'],
    default: 'other',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'pos', 'cheque'],
    default: 'cash',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  receipt: {
    type: String,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

expenseSchema.index({ date: -1, branch: 1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
