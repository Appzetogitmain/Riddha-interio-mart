const mongoose = require('mongoose');

const PromoCardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  items: [{
    type: String
  }],
  btnText: {
    type: String,
    default: 'Join Now'
  },
  bg: {
    type: String,
    default: 'bg-[#F4F9F8]'
  },
  textColor: {
    type: String,
    default: 'text-[#28a399]'
  },
  btnColor: {
    type: String,
    default: 'text-[#28a399]'
  },
  img: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '#'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PromoCard', PromoCardSchema);
