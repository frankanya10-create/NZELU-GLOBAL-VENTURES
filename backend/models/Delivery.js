const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  deliveryCode: {
    type: String,
    required: true,
    unique: true,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  driver: {
    name: { type: String, required: true },
    phone: { type: String },
    vehicle: { type: String },
    licenseNumber: { type: String },
  },
  dispatchDate: Date,
  estimatedArrival: Date,
  deliveredAt: Date,
  deliveryAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'dispatched', 'in_transit', 'delivered', 'failed'],
    default: 'pending',
  },
  notes: String,
  confirmation: {
    recipientName: String,
    signature: String,
    photoUrl: String,
    confirmedAt: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

deliverySchema.index({ status: 1 });
deliverySchema.index({ invoice: 1 });
deliverySchema.index({ driver: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
