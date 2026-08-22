const mongoose = require('mongoose');

const SellerStaffSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please add staff name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add staff phone number'],
    trim: true
  },
  vehicleNumber: {
    type: String,
    trim: true,
    default: ''
  },
  drivingLicense: {
    type: String,
    trim: true,
    default: ''
  },
  drivingLicenseImage: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

SellerStaffSchema.index({ seller: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('SellerStaff', SellerStaffSchema);
