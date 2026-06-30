const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
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
    default: 'user'
  },
  userType: {
    type: String,
    enum: ['customer', 'enterpriser'],
    default: 'customer'
  },
  businessDetails: {
    shopName: String,
    gstNumber: String,
    taxationCode: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  phone: {
    type: String,
    default: ""
  },
  avatar: {
    type: String,
    default: ""
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  emailVerificationOtp: String,
  emailVerificationOtpExpire: Date,
  resetPasswordOtp: String,
  resetPasswordOtpExpire: Date,
  otpLastSentAt: {
    type: Date
  },
  otpFailedAttempts: {
    type: Number,
    default: 0
  },
  otpLockedUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password and generate referral code using bcrypt & crypto
UserSchema.pre('save', async function() {
  if (!this.referralCode) {
    this.referralCode = 'RIDDHA' + crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: this.role || 'user' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash OTP
UserSchema.methods.getVerificationOtp = function() {
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP and set to emailVerificationOtp field
  this.emailVerificationOtp = crypto.createHash('sha256').update(otp).digest('hex');

  // Set expire to 10 minutes
  this.emailVerificationOtpExpire = Date.now() + 10 * 60 * 1000;

  return otp;
};

UserSchema.methods.getResetPasswordOtp = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
  return otp;
};

UserSchema.index({ role: 1 });
UserSchema.index({ referredBy: 1 });

UserSchema.post('save', function(doc) {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.del(`user:profile:${doc.role || 'user'}:${doc._id}`);
    cacheService.del('analytics:admin:dashboard');
  } catch (e) {}
});

UserSchema.post('findOneAndUpdate', function(doc) {
  try {
    const cacheService = require('../services/cacheService');
    if (doc) {
      cacheService.del(`user:profile:${doc.role || 'user'}:${doc._id}`);
    }
    cacheService.del('analytics:admin:dashboard');
  } catch (e) {}
});

module.exports = mongoose.model('User', UserSchema);
