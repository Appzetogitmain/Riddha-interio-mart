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
  // Header/footer chrome for the signed Terms & Conditions / Privacy Policy
  // agreement PDF (backend/src/utils/documentPdfGenerator.js) — the center
  // content itself comes from TermsCondition, edited separately at /admin/terms.
  documentTemplateSettings: {
    headerTitle: { type: String, default: 'Riddha Interior Mart Pvt. Ltd.' },
    headerTagline: { type: String, default: "India's Largest Interior Supply Hub" },
    headerContact: { type: String, default: 'support@riddhamart.com | www.riddhamart.com' },
    footerText: { type: String, default: 'CONFIDENTIAL DOCUMENT' }
  },
  trustBarSubheading: {
    type: String,
    default: 'A seamless shopping experience with trusted quality, great value and customer-first support.'
  },
  trustBarHeading: {
    title: { type: String, default: 'Why Shop With' },
    highlight: { type: String, default: 'Riddha' }
  },
  // The five feature cards at the top of the Trust Bar section
  trustBarCards: {
    type: [{
      iconName: String,
      title: String,
      subtitle: String
    }],
    default: [
      { iconName: 'LuStar', title: 'Premium Quality', subtitle: 'Trusted products & brands' },
      { iconName: 'LuShield', title: 'Secure Shopping', subtitle: 'Your data is safe with us' },
      { iconName: 'LuHeadphones', title: 'Expert Support', subtitle: "We're here for you" },
      { iconName: 'LuRotateCcw', title: 'Easy Returns', subtitle: 'Hassle free process' },
      { iconName: 'LuHeart', title: 'Interior Inspiration', subtitle: 'Ideas for every space' }
    ]
  },
  // The teal help box next to the stats row
  trustBarHelp: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: 'Need Help?' },
    liveLabel: { type: String, default: 'Live' },
    subtitle: { type: String, default: 'Interior experts available' },
    buttonText: { type: String, default: 'Contact Us' },
    buttonLink: { type: String, default: '/contact' }
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
  },

  // Requirement A — Sample Request rules engine. Admin configurable.
  sampleRules: {
    // Free samples a customer may take per rolling calendar month.
    freeSamplesPerMonth: { type: Number, default: 3 },
    // Charged per sample item once the free quota is spent. Falls back to the
    // product's own sampleCharge when that is set.
    defaultSampleCharge: { type: Number, default: 250 },
    // Sample fee is credited back against the customer's first order.
    refundChargeAgainstFirstOrder: { type: Boolean, default: true },
    // Auto-decline when the customer already has this many delivered samples
    // still awaiting feedback.
    maxPendingFeedbackSamples: { type: Number, default: 3 },
    // Verified enterpriser/contractor accounts skip manual approval.
    autoApproveVerifiedContractors: { type: Boolean, default: true },
    // Days after delivery before the "How was the sample?" nudge is sent.
    feedbackFollowUpDays: { type: Number, default: 3 },
    maxItemsPerRequest: { type: Number, default: 5 }
  },

  // Requirement A — RFQ routing & SLA.
  rfqRules: {
    // Hours a seller has to respond before the SLA is breached.
    slaResponseHours: { type: Number, default: 24 },
    // Days an unanswered / unaccepted RFQ stays open before it expires.
    expiryDays: { type: Number, default: 30 },
    // RFQs estimated above this value are always copied to the Riddha team.
    internalReviewValueThreshold: { type: Number, default: 500000 },
    // Cap on how many sellers one RFQ fans out to in competitive mode.
    maxSellersPerRFQ: { type: Number, default: 5 },
    competitiveQuotingEnabled: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
