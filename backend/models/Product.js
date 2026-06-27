const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  cost: {
    type: Number,
    default: 0,
  },
  selling: {
    type: Number,
    default: 0,
  },
  minimumSelling: {
    type: Number,
    default: 0,
  },
  wholesale: {
    type: Number,
    default: 0,
  },
  retail: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  category: {
    type: String,
    enum: ['tarpaulin', 'carpet', 'centre_rug', 'artificial_grass', 'tent', 'accessory', 'other'],
    default: 'other',
  },
  unit: {
    type: String,
    enum: ['meters', 'yards', 'sqm', 'pcs', 'rolls', 'sets'],
    default: 'meters',
  },
  prices: priceSchema,
  hasRollTracking: {
    type: Boolean,
    default: false,
  },
  stock: {
    type: Number,
    default: 0,
  },
  minStockLevel: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

productSchema.index({ name: 1, branch: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
