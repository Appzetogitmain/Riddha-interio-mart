const mongoose = require('mongoose');

/**
 * A named, ordered path through features (e.g. the designer's
 * brief -> project -> estimate -> BOQ -> quotation flow).
 *
 * Seeded from journeyRegistry.SEQUENCES but stored here so the conversion
 * analytics can accumulate against each path over time.
 */
const FeatureSequenceSchema = new mongoose.Schema({
  sequenceName: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  persona: {
    type: String,
    enum: ['customer', 'enterpriser', 'seller', 'admin'],
    default: 'customer'
  },
  features: [{
    featureId: { type: String, required: true },  // registry id, e.g. "req-10"
    order: { type: Number, required: true },
    label: { type: String },
    optional: { type: Boolean, default: false }
  }],

  analytics: {
    timesStarted: { type: Number, default: 0 },
    timesCompleted: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeatureSequence', FeatureSequenceSchema);
