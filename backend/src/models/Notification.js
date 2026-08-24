const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  type: {
    type: String,
    required: true,
    default: 'order_confirmed'
  },
  category: {
    type: String,
    enum: ['orders', 'projects', 'promotions', 'account', 'engagement'],
    default: 'orders'
  },

  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  messageHtml: {
    type: String
  },

  // Multi-Channel Variants
  channels: {
    sms: String,
    email: String,
    push: String,
    whatsapp: String,
    inApp: String
  },

  // Gemini AI metadata
  generatedByGemini: {
    type: Boolean,
    default: false
  },
  geminiPrompt: String,

  // Action links
  actionUrl: String,
  actionLabel: String,
  deepLink: String,

  // Related Entity
  relatedEntity: {
    type: { type: String, enum: ['order', 'project', 'product', 'quotation', 'account'] },
    id: mongoose.Schema.Types.ObjectId
  },

  // Delivery status per channel
  deliveryStatus: {
    sms: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
    email: { type: String, enum: ['pending', 'sent', 'opened', 'failed'], default: 'pending' },
    push: { type: String, enum: ['pending', 'sent', 'read', 'failed'], default: 'pending' },
    whatsapp: { type: String, enum: ['pending', 'sent', 'read', 'failed'], default: 'pending' },
    inApp: { type: String, enum: ['pending', 'sent', 'read'], default: 'sent' }
  },

  // Tracking timestamps
  tracking: {
    sentAt: { type: Date, default: Date.now },
    deliveredAt: Date,
    openedAt: Date,
    clickedAt: Date,
    clickedUrl: String
  },

  isRead: {
    type: Boolean,
    default: false
  },
  // Free-form payload (e.g. orderId, batchId) so the frontend can deep-link "View Order" etc.
  // without needing a separate lookup — see NotificationDropdown.jsx's getNavTarget().
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  scheduledFor: Date,
  sentAt: { type: Date, default: Date.now },
  expiresAt: Date
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ category: 1, isRead: 1 });
NotificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
