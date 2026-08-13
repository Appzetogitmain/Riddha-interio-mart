const mongoose = require('mongoose');

const RecommendationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  displayContext: {
    type: String,
    enum: ['homepage', 'product_page', 'search', 'email', 'other'],
    default: 'homepage'
  },
  algorithm: {
    type: String,
    enum: ['collaborative', 'content', 'hybrid', 'gemini', 'trending', 'cross-sell', 'upsell', 'bundle'],
    default: 'hybrid'
  },
  score: {
    type: Number,
    default: 0.5
  },
  geminiExplanation: {
    type: String,
    default: ''
  },

  // User Interaction Tracking
  shown: { type: Boolean, default: true },
  shownAt: { type: Date, default: Date.now },
  clicked: { type: Boolean, default: false },
  clickedAt: { type: Date, default: null },
  purchased: { type: Boolean, default: false },
  purchasedAt: { type: Date, default: null },

  // Latency & Analytics Metrics
  timeToClick: { type: Number, default: 0 },       // ms
  timeToConversion: { type: Number, default: 0 }   // ms
}, {
  timestamps: true
});

RecommendationHistorySchema.index({ userId: 1, shownAt: -1 });
RecommendationHistorySchema.index({ clicked: 1, purchased: 1 });
RecommendationHistorySchema.index({ algorithm: 1, displayContext: 1 });

module.exports = mongoose.model('RecommendationHistory', RecommendationHistorySchema);
