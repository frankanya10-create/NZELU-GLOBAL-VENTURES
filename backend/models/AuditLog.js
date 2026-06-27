const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'login', 'login_failed', 'logout', 'session_timeout',
      'user_created', 'user_updated', 'user_suspended', 'user_deleted',
      'invoice_created', 'invoice_updated', 'invoice_deleted', 'invoice_paid',
      'product_created', 'product_updated', 'product_deleted',
      'customer_created', 'customer_updated',
      'roll_created', 'roll_updated', 'roll_depleted',
      'cutting_logged',
      'discount_approved', 'discount_rejected',
      'transfer_created', 'transfer_approved',
      'backup_triggered',
      'expense_logged',
      'stock_adjusted',
      'payment_received',
      'price_updated',
      'branch_created', 'branch_updated',
      'installation_created', 'installation_updated',
      'delivery_created', 'delivery_updated',
      'settings_changed',
    ],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userName: {
    type: String,
  },
  userRole: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String,
  },
  fingerprint: {
    type: String,
  },
  action: {
    type: String,
  },
  resource: {
    type: String,
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  archivedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

auditLogSchema.index({ event: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
