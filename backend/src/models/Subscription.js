const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    enum: ['silver', 'gold', 'platinum', 'diamond'],
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
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'failed'],
    default: 'pending'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
