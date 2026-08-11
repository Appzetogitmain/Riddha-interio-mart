const mongoose = require('mongoose');

const UserQuizResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  designProfile: {
    roomType: { type: String, required: true },
    primaryStyle: { type: String, required: true },
    secondaryStyle: { type: String },
    colors: [{ type: String }],
    budget: {
      min: { type: Number },
      max: { type: Number }
    },
    lighting: { type: String },
    boldness: { type: Number },
    materials: [{ type: String }]
  },
  aiGeneratedContent: {
    profileNarrative: { type: String },
    designerPersonality: { type: String },
    designSuggestions: [
      {
        title: { type: String },
        description: { type: String },
        keyElements: [{ type: String }],
        budgetAllocation: {
          invest: [{ type: String }],
          moderate: [{ type: String }],
          budget: [{ type: String }]
        },
        daringSuggestions: [{ type: String }],
        principles: [{ type: String }]
      }
    ],
    productExplanations: {
      type: Map,
      of: String
    },
    moodBoardNarrative: { type: String },
    moodBoardThemes: [{ type: String }],
    moodBoardInspiration: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
    geminiTokensUsed: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 }
    }
  },
  recommendations: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      matchScore: { type: Number },
      matchPercentage: { type: Number },
      aiExplanation: { type: String },
      recommendationStrength: { type: String }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('UserQuizResult', UserQuizResultSchema);
