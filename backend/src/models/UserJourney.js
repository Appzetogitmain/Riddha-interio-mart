const mongoose = require('mongoose');
const { STAGES } = require('../utils/journeyRegistry');

const StepSchema = new mongoose.Schema({
  step: { type: String, required: true },
  feature: { type: String },              // registry id, e.g. "req-4"
  stage: { type: String, enum: STAGES },
  completedAt: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 }, // ms since previous step
  outcome: {
    type: String,
    enum: ['success', 'abandoned', 'revisited', 'viewed'],
    default: 'success'
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const ConversionSchema = new mongoose.Schema({
  type: { type: String, required: true },  // purchase | project-created | quotation-sent ...
  value: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  source: { type: String }                 // registry id of the feature that led here
}, { _id: false });

const UserJourneySchema = new mongoose.Schema({
  // Anonymous visitors are tracked by sessionId until they log in, mirroring
  // how UserQuizResult handles pre-auth activity.
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  sessionId: { type: String, required: true, index: true },

  persona: {
    type: String,
    enum: ['customer', 'enterpriser', 'seller', 'admin'],
    default: 'customer'
  },
  journeyType: {
    type: String,
    enum: ['discovery', 'project', 'purchase', 'post-purchase'],
    default: 'discovery'
  },

  currentStage: { type: String, enum: STAGES, default: 'discovery' },

  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  totalDuration: { type: Number, default: 0 },

  stepsCompleted: [StepSchema],
  conversions: [ConversionSchema],

  guidance: {
    accepted: { type: Number, default: 0 },
    ignored: { type: Number, default: 0 },
    shown: { type: Number, default: 0 }
  },

  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  abandonmentReason: { type: String, default: '' },

  device: { type: String, default: 'desktop' },
  referrer: { type: String, default: '' },
  lastActiveAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

UserJourneySchema.index({ user: 1, createdAt: -1 });
UserJourneySchema.index({ journeyType: 1, status: 1 });
UserJourneySchema.index({ currentStage: 1, status: 1 });
UserJourneySchema.index({ completedAt: 1 });

module.exports = mongoose.model('UserJourney', UserJourneySchema);
