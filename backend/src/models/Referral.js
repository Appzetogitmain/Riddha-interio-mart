const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // A referred user can only be referred once
  },
  rewardStatus: {
    type: String,
    enum: ['pending', 'rewarded', 'cancelled'],
    default: 'pending'
  },
  referredUserReward: {
    type: Number,
    default: 50
  },
  referrerReward: {
    type: Number,
    default: 100
  },
  signupIp: {
    type: String
  },
  signupFingerprint: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexing for referral leaderboards and fast queries
ReferralSchema.index({ referrer: 1 });
ReferralSchema.index({ rewardStatus: 1 });

module.exports = mongoose.model('Referral', ReferralSchema);
