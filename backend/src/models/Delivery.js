const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DeliverySchema = new mongoose.Schema({
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
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  avatar: {
    type: String,
    default: ""
  },
  vehicleType: {
    type: String,
    enum: ['Bike', 'Van', 'Truck', 'Bicycle', 'Motorcycle', 'Scooter', 'Car'],
    default: 'Bike'
  },
  vehicleNumber: {
    type: String
  },
  vehicleDetails: {
    plateNumber: { type: String, default: '' },
    maxWeightCapacity: { type: Number, default: 20 }, // in kg
    maxVolumeCapacity: { type: Number, default: 4 }   // maximum concurrent active shipments
  },
  activeShift: {
    isClockedIn: { type: Boolean, default: false },
    clockedInAt: { type: Date, default: null },
    currentPayloadWeight: { type: Number, default: 0 },
    currentPayloadCount: { type: Number, default: 0 }
  },
  documents: {
    rc: { type: String, default: "" },
    dl: { type: String, default: "" },
    aadhar: { type: String, default: "" },
    bankDetails: { type: String, default: "" },
    insurance: { type: String, default: "" },
    pollution: { type: String, default: "" }
  },
  role: {
    type: String,
    default: 'delivery'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  status: {
    type: String,
    enum: ['Available', 'Busy', 'Offline'],
    default: 'Offline'
  },
  lastOnlineTime: {
    type: Date,
    default: null
  },
  servicePincodes: [{
    type: String
  }],
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
    default: 'Pending'
  },
  currentLocation: {
    latitude: { type: Number, default: 26.9124 }, // Default to Jaipur city center for dev convenience
    longitude: { type: Number, default: 75.7873 },
    updatedAt: { type: Date }
  },
  resetPasswordOtp: String,
  resetPasswordOtpExpire: Date,
  otpLastSentAt: Date,
  otpFailedAttempts: {
    type: Number,
    default: 0
  },
  otpLockedUntil: Date,
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

DeliverySchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

DeliverySchema.methods.getResetPasswordOtp = function() {
  const crypto = require('crypto');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
  return otp;
};

DeliverySchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: 'delivery' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

DeliverySchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

DeliverySchema.index({ createdAt: -1 });

DeliverySchema.post('save', function(doc) {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.del(`user:profile:delivery:${doc._id}`);
    cacheService.del('analytics:admin:dashboard');
  } catch (e) {}
});

DeliverySchema.post('findOneAndUpdate', function(doc) {
  try {
    const cacheService = require('../services/cacheService');
    if (doc) {
      cacheService.del(`user:profile:delivery:${doc._id}`);
    }
    cacheService.del('analytics:admin:dashboard');
  } catch (e) {}
});

module.exports = mongoose.model('Delivery', DeliverySchema);
