const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  deliveryCommissionRate: {
    type: Number,
    default: 50.00
  },
  // B2C (Regular) seller commission rate
  salesCommissionRate: {
    type: Number,
    default: 10.00
  },
  // B2B (Bulk Order) seller commission rate — lower than B2C
  b2bCommissionRate: {
    type: Number,
    default: 5.00
  },
  // Minimum order quantity to qualify as a B2B order
  b2bMinOrderQty: {
    type: Number,
    default: 10
  },
  whatsappNumber: {
    type: String,
    default: "9111661100"
  },
  invoiceSettings: {
    showAdminDetails: { type: Boolean, default: true },
    adminName: { type: String, default: 'Riddha Interior Mart Pvt. Ltd.' },
    adminAddress: { type: String, default: '123 Luxury Avenue, Design District, Indore, MP - 452001' },
    showAdminGST: { type: Boolean, default: true },
    adminGST: { type: String, default: '23AAAAA0000A1Z5' },
    showSellerDetails: { type: Boolean, default: true },
    showShippingDetails: { type: Boolean, default: true },
    showBillingDetails: { type: Boolean, default: true },
    showGSTBreakdown: { type: Boolean, default: true },
    invoiceFooterText: { type: String, default: 'This is a computer-generated invoice.' }
  },
  trustBarItems: {
    type: [{
      iconName: String,
      title: String,
      subtitle: String
    }],
    default: [
      { iconName: 'LuAward', title: '500+', subtitle: 'Top Brands' },
      { iconName: 'LuUsers', title: '1L+', subtitle: 'Happy Customers' },
      { iconName: 'LuStar', title: '4.7 ★', subtitle: 'Average Rating' },
      { iconName: 'LuTruck', title: '4 Hours', subtitle: 'Express Delivery' },
      { iconName: 'LuRotateCcw', title: '10 Days', subtitle: 'Easy Returns' },
      { iconName: 'LuFileText', title: 'GST Invoice', subtitle: 'For All Orders' }
    ]
  }
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
