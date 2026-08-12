const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Channels Enabled
  channels: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true }
  },

  // Notification Types Enabled
  notificationTypes: {
    orders: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    account: { type: Boolean, default: true },
    engagement: { type: Boolean, default: true }
  },

  // Frequency Settings per category
  frequency: {
    orders: { type: String, enum: ['immediate', 'daily', 'weekly', 'never'], default: 'immediate' },
    projects: { type: String, enum: ['immediate', 'daily', 'weekly', 'never'], default: 'immediate' },
    promotions: { type: String, enum: ['immediate', 'daily', 'weekly', 'never'], default: 'immediate' },
    account: { type: String, enum: ['immediate', 'daily', 'weekly', 'never'], default: 'immediate' },
    engagement: { type: String, enum: ['immediate', 'daily', 'weekly', 'never'], default: 'daily' }
  },

  // Quiet Hours
  quietHours: {
    enabled: { type: Boolean, default: true },
    startTime: { type: String, default: '22:00' }, // 10:00 PM
    endTime: { type: String, default: '08:00' },   // 08:00 AM
    timezone: { type: String, default: 'Asia/Kolkata' }
  },

  // Override to receive critical alerts only
  urgentOnly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
