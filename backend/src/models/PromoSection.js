const mongoose = require('mongoose');

// Single document holding the heading shown above the promo cards on the homepage.
const PromoSectionSchema = new mongoose.Schema({
  badge: { type: String, default: 'Why Choose Riddha' },
  title: { type: String, default: 'Exclusive Benefits' },
  highlight: { type: String, default: 'for Our Community' },
  subtitle: { type: String, default: 'Grow your business, get better deals and earn more with Riddha' }
}, { timestamps: true });

module.exports = mongoose.model('PromoSection', PromoSectionSchema);
