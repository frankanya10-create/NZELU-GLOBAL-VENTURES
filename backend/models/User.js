const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ['administrator', 'manager', 'cashier', 'storekeeper'],
    required: [true, 'Role is required'],
    lowercase: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  otpCode: {
    type: String,
    select: false,
  },
  otpExpiry: {
    type: Date,
    select: false,
  },
  sessions: [{
    token: String,
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
    },
    ipAddress: String,
    fingerprint: String,
    lastActivity: Date,
    loginAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  allowedIps: [{
    type: String,
  }],
  permissions: {
    canViewPnl: {
      type: Boolean,
      default: function() { return this.role === 'administrator'; },
    },
    canViewCostPrice: {
      type: Boolean,
      default: function() { return this.role === 'administrator' || this.role === 'manager'; },
    },
    canEditPrice: {
      type: Boolean,
      default: function() { return this.role === 'administrator' || this.role === 'manager'; },
    },
    canDeleteTransactions: {
      type: Boolean,
      default: function() { return this.role === 'administrator'; },
    },
    canApproveDiscounts: {
      type: Boolean,
      default: function() { return this.role === 'administrator' || this.role === 'manager'; },
    },
    canManageUsers: {
      type: Boolean,
      default: function() { return this.role === 'administrator'; },
    },
    canViewAuditLogs: {
      type: Boolean,
      default: function() { return this.role === 'administrator'; },
    },
    canManageProducts: {
      type: Boolean,
      default: function() { return this.role === 'administrator'; },
    },
    canApproveTransfers: {
      type: Boolean,
      default: function() { return this.role === 'administrator' || this.role === 'manager'; },
    },
    canViewPayroll: {
      type: Boolean,
      default: function() { return this.role === 'administrator'; },
    },
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOtp = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpCode = otp;
  this.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
  return otp;
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions && this.permissions[permission] === true;
};

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
