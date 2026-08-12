const mongoose = require('mongoose');

const BudgetItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  cost: { type: Number, required: true, default: 0 },
  date: { type: Date, default: Date.now },
  receipt: { type: String, default: '' }
});

const BudgetCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  planned: { type: Number, required: true, default: 0 },
  spent: { type: Number, default: 0 },
  items: [BudgetItemSchema]
});

const PhaseSchema = new mongoose.Schema({
  phaseName: { type: String, required: true },
  startDate: { type: Date },
  targetEndDate: { type: Date },
  actualEndDate: { type: Date },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  deliverables: [{ type: String }],
  percentComplete: { type: Number, default: 0 }
});

const DeliverableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date },
  completionDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  assignedTo: { type: mongoose.Schema.ObjectId, ref: 'User' },
  attachments: [{ type: String }],
  notes: { type: String, default: '' }
});

const TeamMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['designer', 'manager', 'installer'],
    default: 'designer'
  },
  joinedDate: { type: Date, default: Date.now }
});

const ActivityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actor: { type: mongoose.Schema.ObjectId, ref: 'User' },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  briefId: {
    type: mongoose.Schema.ObjectId,
    ref: 'ClientBrief'
  },
  clientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  clientName: {
    type: String,
    required: true,
    default: 'Valued Client'
  },
  projectName: {
    type: String,
    required: true,
    default: 'Interior Design Project'
  },
  description: {
    type: String,
    default: ''
  },
  roomType: {
    type: String,
    default: 'Living Room'
  },
  designStyle: {
    type: String,
    default: 'Modern Minimalist'
  },

  // Budget
  budget: {
    total: { type: Number, default: 100000 },
    categories: [BudgetCategorySchema]
  },

  // Timeline
  startDate: { type: Date, default: Date.now },
  targetEndDate: { type: Date },
  actualEndDate: { type: Date },
  phases: [PhaseSchema],

  // Deliverables
  deliverables: [DeliverableSchema],

  // Team
  teamMembers: [TeamMemberSchema],

  // Status
  overallStatus: {
    type: String,
    enum: ['on-track', 'at-risk', 'on-hold', 'completed'],
    default: 'on-track'
  },
  completionPercentage: {
    type: Number,
    default: 0
  },

  // AI Insights
  aiInsights: {
    healthScore: { type: Number, default: 100 },
    healthNarrative: { type: String, default: '' },
    riskAssessment: { type: String, default: '' },
    nextSteps: { type: String, default: '' },
    recommendations: [{ type: String }],
    generatedAt: { type: Date }
  },

  // Activity Log
  activityLog: [ActivityLogSchema],

  completedAt: { type: Date },
  archivedAt: { type: Date }
}, { timestamps: true });

ProjectSchema.index({ userId: 1, overallStatus: 1 });
ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ targetEndDate: 1 });
ProjectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', ProjectSchema);
