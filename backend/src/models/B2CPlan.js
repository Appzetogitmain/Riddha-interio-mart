const mongoose = require('mongoose');

const B2CPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: { type: String, required: true },
  badge: { type: String, default: '' },
  emoji: { type: String, default: '🚀' },
  price: { type: Number, required: true, min: 0 },
  billingCycle: { type: String, required: true, default: 'Monthly' },
  durationDays: { type: Number, required: true, min: 1 },
  // B2C-specific feature flags
  emiAvailable: { type: Boolean, default: false },
  emiMonths: { type: Number, default: 0 },
  fastestDelivery: { type: Boolean, default: false },
  hireDesigner: { type: Boolean, default: false },
  hireContractor: { type: Boolean, default: false },
  hireArchitect: { type: Boolean, default: false },
  // Display flags
  popular: { type: Boolean, default: false },
  bestValue: { type: Boolean, default: false },
  description: { type: String, default: '' },
  features: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  orderIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

B2CPlanSchema.index({ planId: 1 });
B2CPlanSchema.index({ isActive: 1 });

module.exports = mongoose.model('B2CPlan', B2CPlanSchema);
