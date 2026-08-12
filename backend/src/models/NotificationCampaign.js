const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  variantId: { type: String, required: true }, // 'Variant A', 'Variant B'
  approach: { type: String, default: 'conservative' }, // conservative | creative
  message: { type: String, required: true },
  subject: String,
  predictedCtr: { type: Number, default: 12.5 },
  channels: {
    sms: String,
    email: String,
    push: String,
    whatsapp: String
  }
});

const NotificationCampaignSchema = new mongoose.Schema({
  campaignName: {
    type: String,
    required: true,
    default: 'Seasonal Interior Promotion'
  },
  type: {
    type: String,
    default: 'promotional'
  },
  segment: {
    type: String,
    default: 'Modern Style Enthusiasts'
  },

  variants: [VariantSchema],

  scheduling: {
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    scheduledFor: [{ type: Date }]
  },

  analytics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'completed', 'paused'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationCampaign', NotificationCampaignSchema);
