const mongoose = require('mongoose');

// Audit log for every B2C plan purchase (customer userType)
const B2CSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    required: true
  },
  durationDays: {
    type: Number,
    required: true
  },
  // Razorpay payment details
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'failed'],
    default: 'pending'
  },
  startDate: { type: Date },
  endDate: { type: Date },
  // Unlocked features at purchase time
  hireDesigner: { type: Boolean, default: false },
  hireContractor: { type: Boolean, default: false },
  hireArchitect: { type: Boolean, default: false },
  emiAvailable: { type: Boolean, default: false },
  fastestDelivery: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

B2CSubscriptionSchema.index({ user: 1 });
B2CSubscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('B2CSubscription', B2CSubscriptionSchema);
