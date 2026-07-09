const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  deliveryCommissionRate: {
    type: Number,
    default: 50.00
  },
  salesCommissionRate: {
    type: Number,
    default: 10.00
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
  }
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
