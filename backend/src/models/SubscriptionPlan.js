const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  badge: {
    type: String,
    default: ''
  },
  emoji: {
    type: String,
    default: '👑'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  billingCycle: {
    type: String,
    required: true
  },
  durationDays: {
    type: Number,
    required: true,
    min: 1
  },
  popular: {
    type: Boolean,
    default: false
  },
  bestValue: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    default: ''
  },
  features: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

SubscriptionPlanSchema.index({ planId: 1 });
SubscriptionPlanSchema.index({ isActive: 1 });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
