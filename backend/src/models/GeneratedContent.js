const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  variantId: { type: String, required: true },
  title: String,
  content: { type: String, required: true },
  tone: String,
  style: String,
  rationale: String,
  predictedCtr: { type: Number, default: 15.0 }
});

const GeneratedContentSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },

  // Content Type & Target Platform
  contentType: {
    type: String,
    enum: [
      'title', 'description', 'meta_description', 'social_post',
      'email_subject', 'email_body', 'blog_post', 'hashtags_keywords'
    ],
    required: true,
    default: 'description'
  },
  platform: {
    type: String,
    enum: ['product_listing', 'instagram', 'facebook', 'pinterest', 'twitter', 'email', 'blog', 'general'],
    default: 'product_listing'
  },

  // Generated Content Output
  content: {
    title: String,
    body: { type: String, required: true },
    metadata: mongoose.Schema.Types.Mixed,
    wordCount: { type: Number, default: 0 },
    keywords: [{ type: String }],
    hashtags: [{ type: String }]
  },

  // Generation Prompt Parameters
  geminiPrompt: String,
  tone: {
    type: String,
    enum: ['professional', 'casual', 'luxury', 'budget'],
    default: 'professional'
  },
  style: {
    type: String,
    enum: ['sales', 'educational', 'emotional', 'feature'],
    default: 'sales'
  },
  length: {
    type: String,
    enum: ['short', 'medium', 'long'],
    default: 'medium'
  },

  // A/B Testing Variants
  variants: [VariantSchema],

  // Status & Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft'
  },
  usedIn: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    publishedAt: Date,
    platform: String
  },

  // Performance tracking
  performance: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

GeneratedContentSchema.index({ sellerId: 1, createdAt: -1 });
GeneratedContentSchema.index({ productId: 1 });
GeneratedContentSchema.index({ contentType: 1 });

module.exports = mongoose.model('GeneratedContent', GeneratedContentSchema);
