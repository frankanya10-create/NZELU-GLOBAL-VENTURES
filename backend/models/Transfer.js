const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  transferCode: {
    type: String,
    required: true,
    unique: true,
  },
  fromBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  toBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: String,
    notes: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'in_transit', 'completed', 'rejected'],
    default: 'pending',
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  completedAt: Date,
  notes: String,
}, {
  timestamps: true,
});

transferSchema.index({ status: 1 });
transferSchema.index({ fromBranch: 1, toBranch: 1 });

module.exports = mongoose.model('Transfer', transferSchema);
