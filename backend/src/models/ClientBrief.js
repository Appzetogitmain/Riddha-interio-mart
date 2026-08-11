const mongoose = require('mongoose');

const ClientBriefSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: false
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  guestSessionId: {
    type: String,
    required: false
  },
  projectName: {
    type: String,
    default: 'Interior Design Project Brief'
  },
  formAnswers: [{
    questionId: {
      type: Number,
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  briefContent: {
    executiveSummary: { type: String, default: '' },
    projectOverview: { type: String, default: '' },
    designScope: { type: mongoose.Schema.Types.Mixed, default: {} },
    requirements: { type: mongoose.Schema.Types.Mixed, default: {} },
    timeline: { type: mongoose.Schema.Types.Mixed, default: {} },
    budgetBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    constraints: { type: mongoose.Schema.Types.Mixed, default: [] },
    deliverables: { type: mongoose.Schema.Types.Mixed, default: [] }
  },
  status: {
    type: String,
    enum: ['draft', 'generating', 'finalized', 'approved', 'archived'],
    default: 'draft'
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  quotationIds: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Quotation'
  }],
  geminiTokensUsed: {
    input: { type: Number, default: 0 },
    output: { type: Number, default: 0 }
  }
}, { timestamps: true });

ClientBriefSchema.index({ userId: 1 });
ClientBriefSchema.index({ guestSessionId: 1 });
ClientBriefSchema.index({ status: 1 });

module.exports = mongoose.model('ClientBrief', ClientBriefSchema);
