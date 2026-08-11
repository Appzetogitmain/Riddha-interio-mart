const mongoose = require('mongoose');

const GeminiUsageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  requirement: {
    type: String,
    required: true // "quiz", "recommendation", etc.
  },
  endpoint: {
    type: String,
    required: true
  },
  prompt: {
    type: String
  },
  response: {
    type: String
  },
  tokens: {
    input: { type: Number, default: 0 },
    output: { type: Number, default: 0 }
  },
  cost: {
    type: Number,
    default: 0 // In USD
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('GeminiUsageLog', GeminiUsageLogSchema);
