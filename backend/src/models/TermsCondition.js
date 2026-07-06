const mongoose = require('mongoose');

const TermsConditionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Please specify terms type'],
      enum: ['user', 'seller', 'delivery', 'user_privacy', 'seller_privacy', 'delivery_privacy'],
      unique: true
    },
    content: {
      type: String,
      required: [true, 'Please add terms content']
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('TermsCondition', TermsConditionSchema);
