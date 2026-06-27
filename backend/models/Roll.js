const mongoose = require('mongoose');

const rollSchema = new mongoose.Schema({
  rollId: {
    type: String,
    required: [true, 'Roll ID is required'],
    unique: true,
    trim: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
  },
  supplier: {
    type: String,
    trim: true,
  },
  initialBalance: {
    type: Number,
    required: [true, 'Initial balance is required'],
    min: 0,
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    enum: ['meters', 'yards', 'sqm'],
    default: 'meters',
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  receivedDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'depleted', 'damaged', 'returned'],
    default: 'active',
  },
  location: {
    type: String,
    trim: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required'],
  },
  notes: {
    type: String,
    trim: true,
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

rollSchema.pre('save', function(next) {
  if (this.remainingBalance <= 0) {
    this.status = 'depleted';
  }
  next();
});

rollSchema.index({ product: 1, status: 1 });
rollSchema.index({ branch: 1 });

module.exports = mongoose.model('Roll', rollSchema);
