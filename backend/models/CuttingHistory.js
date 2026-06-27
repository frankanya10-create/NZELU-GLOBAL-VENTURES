const mongoose = require('mongoose');

const cuttingHistorySchema = new mongoose.Schema({
  roll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roll',
    required: true,
  },
  rollId: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  invoiceCode: {
    type: String,
    required: true,
  },
  cutLength: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    default: 'meters',
  },
  remainingBefore: {
    type: Number,
    required: true,
  },
  remainingAfter: {
    type: Number,
    required: true,
  },
  cutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

cuttingHistorySchema.index({ roll: 1 });
cuttingHistorySchema.index({ invoice: 1 });
cuttingHistorySchema.index({ createdAt: -1 });
cuttingHistorySchema.index({ cutBy: 1 });

module.exports = mongoose.model('CuttingHistory', cuttingHistorySchema);
