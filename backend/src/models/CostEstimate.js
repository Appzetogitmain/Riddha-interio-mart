const mongoose = require('mongoose');

const CostBreakdownSchema = new mongoose.Schema({
  furniture: { type: Number, default: 0 },
  flooring: { type: Number, default: 0 },
  lighting: { type: Number, default: 0 },
  decor: { type: Number, default: 0 },
  paint: { type: Number, default: 0 },
  labor: { type: Number, default: 0 },
  additionalServices: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  timelineAdjustment: { type: Number, default: 0 },
  contingency: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  costPerSqFt: { type: Number, default: 0 }
});

const OptimizationSuggestionSchema = new mongoose.Schema({
  suggestion: { type: String, required: true },
  savings: { type: Number, default: 0 },
  impact: { type: String, default: 'medium' }
});

const CostEstimateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  quotationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quotation'
  },
  estimateName: {
    type: String,
    default: 'Interior Design Cost Estimate'
  },
  
  // Input Parameters
  roomType: {
    type: String,
    required: true,
    default: 'Living Room'
  },
  area: {
    type: Number,
    required: true,
    default: 400
  },
  dimensions: {
    length: { type: Number, default: 20 },
    width: { type: Number, default: 20 },
    unit: { type: String, enum: ['ft', 'm'], default: 'ft' }
  },
  scope: [{
    type: String
  }],
  materialTier: {
    type: String,
    enum: ['economy', 'standard', 'premium'],
    default: 'standard'
  },
  timeline: {
    type: String,
    enum: ['asap', 'soon', 'flexible', 'no-hurry'],
    default: 'soon'
  },
  additionalServices: [{
    type: String
  }],

  // Calculated Costs
  costBreakdown: CostBreakdownSchema,

  // AI Analysis (Gemini)
  aiAnalysis: {
    costBreakdownAnalysis: { type: String, default: '' },
    optimizationSuggestions: [OptimizationSuggestionSchema],
    tierComparison: {
      economy: { type: Number, default: 0 },
      standard: { type: Number, default: 0 },
      premium: { type: Number, default: 0 },
      analysis: { type: String, default: '' }
    },
    timelineImpact: { type: String, default: '' },
    riskAssessment: { type: String, default: '' },
    generatedAt: { type: Date }
  },

  // Status & Sharing
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'used-in-quotation'],
    default: 'draft'
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: {
    type: String,
    default: ''
  },
  clientEmail: {
    type: String,
    default: ''
  },
  sentAt: { type: Date },
  acceptedAt: { type: Date },
  notes: { type: String, default: '' },

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
  }
}, { timestamps: true });

CostEstimateSchema.index({ userId: 1, createdAt: -1 });
CostEstimateSchema.index({ projectId: 1 });
CostEstimateSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('CostEstimate', CostEstimateSchema);
