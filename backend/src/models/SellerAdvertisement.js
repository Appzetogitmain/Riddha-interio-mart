const mongoose = require('mongoose');

const sellerAdvertisementSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'Seller',
    required: true
  },
  plan: {
    type: mongoose.Schema.ObjectId,
    ref: 'AdvertisementPlan',
    required: true
  },
  products: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  }],
  status: {
    type: String,
    enum: ['PendingPayment', 'Active', 'Expired'],
    default: 'PendingPayment'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Wallet', 'Online'],
    required: true
  },
  transactionId: {
    type: String
  },
  amountPaid: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SellerAdvertisement', sellerAdvertisementSchema);
