const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system']
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  guestSessionId: {
    type: String,
    required: false
  },
  messages: [ChatMessageSchema],
  status: {
    type: String,
    required: true,
    enum: ['active', 'handover', 'resolved'],
    default: 'active'
  }
}, { timestamps: true });

ChatConversationSchema.index({ user: 1 });
ChatConversationSchema.index({ guestSessionId: 1 });
ChatConversationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChatConversation', ChatConversationSchema);
