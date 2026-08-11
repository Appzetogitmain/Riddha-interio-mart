const mongoose = require('mongoose');

const AiSupportRequestSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'ChatConversation',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  guestEmail: {
    type: String,
    required: false
  },
  reason: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'assigned', 'resolved'],
    default: 'pending'
  },
  assignedAgent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    required: false
  }
}, { timestamps: true });

AiSupportRequestSchema.index({ status: 1 });
AiSupportRequestSchema.index({ user: 1 });
AiSupportRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AiSupportRequest', AiSupportRequestSchema);
