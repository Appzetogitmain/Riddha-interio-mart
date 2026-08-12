const mongoose = require('mongoose');

const ProjectReportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  reportType: {
    type: String,
    enum: ['status', 'completion', 'client-update'],
    default: 'status'
  },
  generatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  sentToEmails: [{
    type: String
  }]
}, { timestamps: true });

ProjectReportSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('ProjectReport', ProjectReportSchema);
