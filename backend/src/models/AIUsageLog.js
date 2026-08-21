const mongoose = require('mongoose');

const AIUsageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  requirement: {
    type: String,
    required: true, // "quiz", "recommendation", "content-generation", etc.
    index: true,
  },
  endpoint: {
    type: String,
  },
  provider: {
    type: String,
    enum: ['openai'],
    default: 'openai',
    index: true,
  },
  model: {
    type: String,
    default: 'gpt-4o-mini',
  },
  prompt: {
    type: String,
  },
  response: {
    type: String,
  },
  inputTokens: {
    type: Number,
    default: 0,
  },
  outputTokens: {
    type: Number,
    default: 0,
  },
  totalTokens: {
    type: Number,
    default: 0,
  },
  cost: {
    type: Number,
    default: 0, // In USD
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('AIUsageLog', AIUsageLogSchema);
