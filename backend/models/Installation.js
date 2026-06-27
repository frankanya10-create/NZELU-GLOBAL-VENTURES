const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
  jobCode: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  description: {
    type: String,
    required: true,
  },
  measurements: {
    length: Number,
    width: Number,
    area: Number,
    unit: { type: String, default: 'meters' },
  },
  installers: [{
    name: String,
    phone: String,
    role: { type: String, enum: ['lead', 'assistant'] },
  }],
  scheduledDate: Date,
  startDate: Date,
  completionDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  timeline: [{
    stage: String,
    date: Date,
    notes: String,
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  location: {
    address: String,
    landmark: String,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
}, {
  timestamps: true,
});

installationSchema.index({ status: 1 });
installationSchema.index({ customer: 1 });
installationSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('Installation', installationSchema);
