const mongoose = require('mongoose');

const ProjectAlertSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  alertType: {
    type: String,
    enum: ['phase-due', 'budget-alert', 'overdue', 'milestone'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  message: {
    type: String,
    required: true
  },
  aiRecommendation: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  }
}, { timestamps: true });

ProjectAlertSchema.index({ projectId: 1, isRead: 1 });
ProjectAlertSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('ProjectAlert', ProjectAlertSchema);
