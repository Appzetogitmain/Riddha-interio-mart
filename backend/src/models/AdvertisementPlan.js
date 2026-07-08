const mongoose = require('mongoose');

const advertisementPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a plan name']
  },
  price: {
    type: Number,
    required: [true, 'Please provide the plan price']
  },
  durationDays: {
    type: Number,
    required: [true, 'Please provide the duration in days']
  },
  maxProducts: {
    type: Number,
    required: [true, 'Please provide the max products allowed'],
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdvertisementPlan', advertisementPlanSchema);
