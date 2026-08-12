const mongoose = require('mongoose');

const DeliveryIssueSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  issueType: {
    type: String,
    enum: ['delivery_delayed', 'failed_delivery', 'unreachable_address', 'damaged_item', 'missing_item', 'wrong_item', 'lost_package', 'other'],
    required: true,
    default: 'delivery_delayed'
  },
  description: {
    type: String,
    required: true
  },
  photos: [{
    type: String // URLs
  }],
  reportedBy: {
    type: String,
    enum: ['customer', 'partner', 'system'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['new', 'analyzing', 'auto_resolved', 'pending_support', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },

  // Gemini AI Analysis & Solutions
  aiAnalysis: {
    analysis: { type: String, default: '' },
    solutions: [{
      solution: String,
      effort: String, // automated | customer | support
      timeline: String
    }],
    recommendedSolution: { type: String, default: '' },
    customerMessage: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now }
  },

  resolutionNotes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DeliveryIssue', DeliveryIssueSchema);
