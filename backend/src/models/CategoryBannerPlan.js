const mongoose = require('mongoose');

// A banner-advertising package created by the admin and bought by sellers.
const CategoryBannerPlanSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Plan name is required'], trim: true },
  description: { type: String, default: '', trim: true },
  price: { type: Number, required: [true, 'Plan price is required'], min: 0 },
  durationDays: { type: Number, required: [true, 'Duration is required'], min: 1 },
  // How many categories one purchase can be shown in
  maxCategories: { type: Number, default: 1, min: 1 },
  // Whether the seller may use a video instead of an image
  allowVideo: { type: Boolean, default: false },
  // Max ads (pending review + live) one category can hold at the same time
  slotsPerCategory: { type: Number, default: 5, min: 1 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CategoryBannerPlan', CategoryBannerPlanSchema);
