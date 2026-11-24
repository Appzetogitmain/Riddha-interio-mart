const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const paginate = require('../utils/paginate');
const mongoose = require('mongoose');
const displayService = require('../services/displayService');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const { ratingSettings } = await displayService.getSettings();
    if (!ratingSettings.ratingsEnabled) {
      return res.status(200).json({ success: true, count: 0, totalResults: 0, totalPages: 0, page: 1, limit: 0, data: [] });
    }
    const query = { product: req.params.productId, isApproved: true };

    const populateOptions = { path: 'user', select: 'fullName avatar' };
    const result = await paginate(Review, query, req, populateOptions);

    res.status(200).json({
      success: true,
      count: result.data.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user's reviews
// @route   GET /api/reviews/me
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const query = { user: req.user.id };
    const populateOptions = { path: 'product', select: 'name images price' };
    const result = await paginate(Review, query, req, populateOptions);

    res.status(200).json({
      success: true,
      count: result.data.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add review
// @route   POST /api/products/:productId/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.id;

    const { ratingSettings } = await displayService.getSettings();
    if (!ratingSettings.ratingsEnabled || !ratingSettings.reviewsEnabled) {
      return res.status(403).json({ success: false, message: 'Reviews are currently turned off.' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Enforce 60-second review cooldown to prevent automated reviews / spam
    const lastReview = await Review.findOne({ user: userId }).sort({ createdAt: -1 });
    if (lastReview) {
      const timeDiff = Date.now() - new Date(lastReview.createdAt).getTime();
      if (timeDiff < 60000) {
        const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait at least 60 seconds between reviews. Retry in ${secondsLeft} second(s).`
        });
      }
    }

    // Only customers who received this product can review it (delivered order within the last 180 days)
    const minDeliveryDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const orderFilter = {
      user: userId,
      status: 'Delivered',
      'orderItems.product': productId,
      $or: [
        { deliveredAt: { $gte: minDeliveryDate } },
        { deliveredAt: null, updatedAt: { $gte: minDeliveryDate } }
      ]
    };
    if (req.body.orderId) orderFilter._id = req.body.orderId;
    const orders = await Order.find(orderFilter).sort({ createdAt: -1 }).select('_id');
    if (!orders.length) {
      return res.status(403).json({
        success: false,
        message: 'Only customers with a delivered order of this product (within the last 180 days) can submit a review.'
      });
    }

    // One review per product per order: pick the newest delivered order that has no review yet
    const reviewedOrders = await Review.find({ user: userId, product: productId, order: { $in: orders.map(o => o._id) } }).select('order');
    const reviewedIds = new Set(reviewedOrders.map(r => String(r.order)));
    const freeOrder = orders.find(o => !reviewedIds.has(String(o._id)));
    if (!freeOrder) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product for this order' });
    }

    // Only these fields can be set by a customer (never isApproved, counts, etc.)
    const { rating, title, review: text, images } = req.body;
    const reviewData = {
      rating, title, review: text,
      images: Array.isArray(images) ? images.slice(0, 5) : [],
      product: productId,
      user: userId,
      order: freeOrder._id,
      source: 'customer',
      verifiedPurchase: true,
      // 'manual' (default): the review stays hidden and uncounted until an admin approves it
      isApproved: ratingSettings.reviewApproval === 'auto'
    };

    const review = await Review.create(reviewData);

    res.status(201).json({
      success: true,
      data: review,
      message: review.isApproved ? 'Thanks for your review!' : 'Thanks! Your review will appear once it is approved.'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product for this order' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Make sure review belongs to user
    if (req.user.role !== 'admin' && (!review.user || review.user.toString() !== req.user.id)) {
      return res.status(401).json({ success: false, message: 'Not authorized to update review' });
    }

    review.rating = req.body.rating || review.rating;
    review.title = req.body.title || review.title;
    review.review = req.body.review || review.review;
    if (req.body.images) review.images = req.body.images;
    if (req.user.role !== 'admin') {
      const { ratingSettings } = await displayService.getSettings();
      if (ratingSettings.reviewApproval === 'manual') review.isApproved = false;
    }
    if (req.user.role === 'admin' && review.source === 'admin') {
      if (req.body.reviewerName) review.reviewerName = String(req.body.reviewerName).trim().slice(0, 60);
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Make sure review belongs to user or user is admin
    if (req.user.role !== 'admin' && (!review.user || review.user.toString() !== req.user.id)) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete review' });
    }

    await review.deleteOne();

    // Call static method manually to be safe
    await Review.getAverageRating(review.product);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Hide/Approve review (Admin only)
// @route   PUT /api/reviews/:id/moderation
// @access  Private/Admin
exports.moderateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isApproved = req.body.isApproved;
    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.voteHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const userId = req.user.id;
    const voteIndex = review.helpfulVotes.indexOf(userId);

    if (voteIndex === -1) {
      // Add upvote
      review.helpfulVotes.push(userId);
    } else {
      // Remove upvote (toggle)
      review.helpfulVotes.splice(voteIndex, 1);
    }

    review.helpfulCount = review.helpfulVotes.length;
    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Report review as abusive
// @route   POST /api/reviews/:id/report
// @access  Private
exports.reportReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Please provide a reason for reporting.' });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const userId = req.user.id;
    const alreadyReported = review.reports.find(r => r.user.toString() === userId.toString());
    
    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'You have already reported this review.' });
    }

    review.reports.push({ user: userId, reason });
    review.reportCount = review.reports.length;
    review.isFlagged = true; // Flag for manual Admin review

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review has been reported for admin investigation.',
      data: review
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Respond to review (Sellers only)
// @route   POST /api/reviews/:id/response
// @access  Private (Seller/Admin)
exports.respondToReview = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Response text is required.' });

    const review = await Review.findById(req.params.id).populate('product');
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Null product guard to prevent server crashes if the product was deleted
    if (!review.product) {
      return res.status(404).json({
        success: false,
        message: 'The product associated with this review no longer exists.'
      });
    }

    // Authorization: seller of the product or admin
    if (req.user.role === 'seller' && review.product.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to reviews on this product.' });
    }

    // Overwrite / edit the response if already submitted, or create a new one
    review.sellerResponse = {
      text,
      respondedAt: Date.now()
    };

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all reviews for seller's products (Seller/Admin only)
// @route   GET /api/reviews/seller
// @access  Private (Seller/Admin)
exports.getSellerReviews = async (req, res) => {
  try {
    const Product = require('../models/Product');
    const sellerProducts = await Product.find({ seller: req.user.id }).select('_id').lean();
    const productIds = sellerProducts.map(p => p._id);

    const query = { product: { $in: productIds } };
    const populateOptions = [
      { path: 'user', select: 'fullName avatar' },
      { path: 'product', select: 'name images price' }
    ];

    const result = await paginate(Review, query, req, populateOptions);

    res.status(200).json({
      success: true,
      count: result.data.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews/admin
// @access  Private/Admin
exports.getAdminReviews = async (req, res) => {
  try {
    const query = {};
    const populateOptions = [
      { path: 'user', select: 'fullName avatar' },
      { path: 'product', select: 'name images' }
    ];

    const result = await paginate(Review, query, req, populateOptions);

    res.status(200).json({
      success: true,
      count: result.data.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Admin adds a review on a product (shown under a display name; counts toward the rating when approved)
// @route   POST /api/reviews/admin/create
// @access  Private/Admin
exports.adminCreateReview = async (req, res) => {
  try {
    const { productId, reviewerName, rating, title, review, images, reviewDate } = req.body;
    const isApproved = req.body.isApproved !== false;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Choose a product' });
    }
    const product = await Product.findById(productId).select('_id');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const name = String(reviewerName || '').trim();
    if (name.length < 2) return res.status(400).json({ success: false, message: 'Enter the reviewer name (at least 2 characters)' });
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5' });
    }
    const text = String(review || '').trim();
    if (!text) return res.status(400).json({ success: false, message: 'Review text is required' });
    if (text.length > 2000) return res.status(400).json({ success: false, message: 'Review text is too long (max 2000 characters)' });

    const data = {
      product: productId,
      source: 'admin',
      reviewerName: name.slice(0, 60),
      rating: stars,
      title: String(title || '').trim().slice(0, 100),
      review: text,
      images: Array.isArray(images) ? images.filter(u => /^https:\/\//i.test(u)).slice(0, 5) : [],
      verifiedPurchase: false,
      isApproved
    };
    if (reviewDate) {
      const d = new Date(reviewDate);
      if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 60000) {
        return res.status(400).json({ success: false, message: 'Review date cannot be in the future' });
      }
      data.createdAt = d;
    }

    const created = await Review.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
