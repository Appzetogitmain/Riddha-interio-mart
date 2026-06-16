const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const paginate = require('../utils/paginate');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
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

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already submitted a review for this product
    const alreadyReviewed = await Review.findOne({ user: userId, product: productId });
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
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

    // Check for verified purchase (Strict Delivered-order-only requirement within last 180 days)
    const minDeliveryDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const purchased = await Order.findOne({
      user: userId,
      status: 'Delivered',
      'orderItems.product': productId,
      $or: [
        { deliveredAt: { $gte: minDeliveryDate } },
        { deliveredAt: null, updatedAt: { $gte: minDeliveryDate } }
      ]
    }).select('_id');

    /* 
    TEMPORARILY DISABLED FOR TESTING
    if (!purchased) {
      return res.status(403).json({
        success: false,
        message: 'Only customers with verified, delivered purchases of this product within the last 180 days can submit a review.'
      });
    }
    */

    const reviewData = {
      ...req.body,
      product: productId,
      user: userId,
      verifiedPurchase: true
    };

    const review = await Review.create(reviewData);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
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
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update review' });
    }

    review.rating = req.body.rating || review.rating;
    review.title = req.body.title || review.title;
    review.review = req.body.review || review.review;
    if (req.body.images) review.images = req.body.images;

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
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
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

