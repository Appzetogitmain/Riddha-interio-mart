const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  // Real customer. Reviews added by an admin have no user (see source / reviewerName)
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: function () { return this.source !== 'admin'; }
  },
  // The order this review is for (one review per product per order)
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    default: null
  },
  source: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  // Display name for admin-added reviews
  reviewerName: {
    type: String,
    trim: true,
    maxlength: 60
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please add a rating between 1 and 5'],
    validate: { validator: Number.isInteger, message: 'Rating must be a whole number from 1 to 5' }
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  review: {
    type: String,
    required: [true, 'Please add a review text']
  },
  images: [String],
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  helpfulVotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  helpfulCount: {
    type: Number,
    default: 0
  },
  reports: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  sellerResponse: {
    text: String,
    respondedAt: Date
  }
}, {
  timestamps: true
});

// One review per customer per product per order (admin-added reviews have no user and are exempt)
ReviewSchema.index(
  { product: 1, user: 1, order: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } }
);
ReviewSchema.index({ product: 1, createdAt: -1 });

// Static method to get average rating and save
ReviewSchema.statics.getAverageRating = async function(productId) {
  // aggregate() does not cast ids, so make sure we always match on an ObjectId
  const pid = new mongoose.Types.ObjectId(String(productId));
  const obj = await this.aggregate([
    {
      $match: { product: pid, isApproved: true }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Product').findByIdAndUpdate(pid, {
      averageRating: obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 0,
      totalReviews: obj[0] ? obj[0].totalReviews : 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', async function() {
  await this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after deleteOne
ReviewSchema.post('deleteOne', { document: true, query: false }, async function() {
  await this.constructor.getAverageRating(this.product);
});

// Call getAverageRating before remove (legacy support)
ReviewSchema.post('remove', async function() {
  await this.constructor.getAverageRating(this.product);
});

// Edits / approvals done through findOneAndUpdate also refresh the rating
ReviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.product);
  }
});

// Also handle findOneAndDelete etc if needed
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.product);
  }
});

const Review = mongoose.model('Review', ReviewSchema);

// The old rule allowed only ONE review per product per customer. Drop that index once so the
// per-order rule above can take over (no-op if it is already gone).
mongoose.connection.once('open', () => {
  Review.collection.dropIndex('product_1_user_1').catch(() => {});
});

module.exports = Review;
