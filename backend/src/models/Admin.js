const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AdminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    default: 'admin'
  },
  phone: {
    type: String,
    default: ""
  },
  department: {
    type: String,
    default: "Executive Management"
  },
  avatar: {
    type: String,
    default: ""
  },
  type: {
    type: String,
    enum: ['superadmin', 'assistant'],
    default: 'superadmin'
  },
  permissions: {
    type: Map,
    of: Boolean,
    default: {}
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  resetPasswordOtp: String,
  resetPasswordOtpExpire: Date,
  otpLastSentAt: Date,
  otpFailedAttempts: {
    type: Number,
    default: 0
  },
  otpLockedUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

AdminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

AdminSchema.methods.getResetPasswordOtp = function() {
  const crypto = require('crypto');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
  return otp;
};

AdminSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

AdminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

AdminSchema.post('save', function(doc) {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.del(`user:profile:admin:${doc._id}`);
  } catch (e) {}
});

AdminSchema.post('findOneAndUpdate', function(doc) {
  try {
    if (doc) {
      const cacheService = require('../services/cacheService');
      cacheService.del(`user:profile:admin:${doc._id}`);
    }
  } catch (e) {}
});

module.exports = mongoose.model('Admin', AdminSchema);
