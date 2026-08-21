const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SellerSchema = new mongoose.Schema({
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
  shopName: {
    type: String,
    required: [true, 'Please add a shop name']
  },
  shopAddress: {
    type: String
  },
  phone: {
    type: String
  },
  // Vendor location with geospatial coordinates for distance-based filtering
  location: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'India' },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [88.3639, 22.5726],
        validate: {
          validator: function(v) {
            return v && v.length === 2;
          },
          message: 'Coordinates must be [longitude, latitude]'
        }
      }
    }
  },
  // Region for location-based filtering
  region: {
    type: String,
    enum: ['kolkata', 'west_bengal', 'east_india', 'pan_india'],
    default: 'pan_india'
  },
  // Vendor verification status set by admin
  verificationStatus: {
    type: String,
    enum: [
      'unverified',
      'verified',
      'manufacturer',
      'authorized_distributor',
      'dealer',
      'wholesaler',
      'local_supplier',
      'premium_vendor',
      'project_supplier'
    ],
    default: 'unverified'
  },
  // Delivery capabilities for this vendor
  deliveryCapabilities: {
    sameDay: { type: Boolean, default: false },
    nextDay: { type: Boolean, default: false },
    standardDelivery: { type: Boolean, default: true },
    bulkDelivery: { type: Boolean, default: false },
    siteDelivery: { type: Boolean, default: false },
    hyperlocal: { type: Boolean, default: false },
    express: { type: Boolean, default: false }
  },
  gstNumber: {
    type: String,
    default: ""
  },
  panNumber: {
    type: String,
    default: ""
  },
  hsnNumber: {
    type: String,
    trim: true
  },
  gstDoc: {
    type: String
  },
  panDoc: {
    type: String
  },
  shopDoc: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  avatar: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    default: 'seller'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationOtp: String,
  phoneVerificationOtpExpire: Date,
  resetPasswordOtp: String,
  resetPasswordOtpExpire: Date,
  otpLastSentAt: Date,
  otpFailedAttempts: {
    type: Number,
    default: 0
  },
  otpLockedUntil: Date,
  bankDetails: {
    accountHolderName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    bankName: { type: String, default: "" }
  },
  // Terms & Conditions Agreement
  termsSignature: {
    type: String,
    default: ''
  },
  termsAgreedAt: {
    type: Date
  },
  termsVersion: {
    type: String,
    default: ''
  },
  signatureImage: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

SellerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

SellerSchema.methods.getVerificationOtp = function() {
  const crypto = require('crypto');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneVerificationOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.phoneVerificationOtpExpire = Date.now() + 10 * 60 * 1000;
  return otp;
};

SellerSchema.methods.getResetPasswordOtp = function() {
  const crypto = require('crypto');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
  return otp;
};

SellerSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: 'seller' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

SellerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

SellerSchema.index({ isVerified: 1, createdAt: -1 });
SellerSchema.index({ 'location.coordinates': '2dsphere' });
SellerSchema.index({ region: 1 });
SellerSchema.index({ verificationStatus: 1 });

SellerSchema.post('save', function(doc) {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.del(`user:profile:seller:${doc._id}`);
    cacheService.del('analytics:admin:dashboard');
  } catch (e) {}
});

SellerSchema.post('findOneAndUpdate', function(doc) {
  try {
    const cacheService = require('../services/cacheService');
    if (doc) {
      cacheService.del(`user:profile:seller:${doc._id}`);
    }
    cacheService.del('analytics:admin:dashboard');
  } catch (e) {}
});

module.exports = mongoose.model('Seller', SellerSchema);
