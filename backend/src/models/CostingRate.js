const mongoose = require('mongoose');

const CostingRateSchema = new mongoose.Schema({
  roomType: {
    type: String,
    required: true,
    default: 'Living Room'
  },
  category: {
    type: String,
    required: true,
    default: 'Furniture'
  },
  baseCost: {
    type: Number,
    required: true,
    default: 500
  },
  costPerSqFt: {
    type: Number,
    required: true,
    default: 500
  },
  economyMultiplier: {
    type: Number,
    default: 0.7
  },
  standardMultiplier: {
    type: Number,
    default: 1.0
  },
  premiumMultiplier: {
    type: Number,
    default: 1.5
  },
  notes: {
    type: String,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

CostingRateSchema.index({ roomType: 1, category: 1 });

module.exports = mongoose.model('CostingRate', CostingRateSchema);
