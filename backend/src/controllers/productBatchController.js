const Product = require('../models/Product');
const ProductBatch = require('../models/ProductBatch');

// @desc  Seller submits all unsubmitted pending products as a batch
// @route POST /api/product-batches
// @access Seller
exports.submitBatch = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Find all seller's pending products that haven't been batched yet
    const pendingProducts = await Product.find({
      seller: sellerId,
      approvalStatus: 'pending',
      batchId: null
    }).select('_id name images price sellerPrice category sku');

    if (pendingProducts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No pending products to submit. Add products first.'
      });
    }

    const batch = await ProductBatch.create({
      seller: sellerId,
      sellerName: req.user.fullName || '',
      shopName: req.user.shopName || '',
      totalProducts: pendingProducts.length,
      pendingCount: pendingProducts.length,
      products: pendingProducts.map(p => ({ product: p._id }))
    });

    // Mark all products as belonging to this batch
    await Product.updateMany(
      { _id: { $in: pendingProducts.map(p => p._id) } },
      { batchId: batch._id }
    );

    // Notify all admins via socket
    const { notifyAdminNewBatch } = require('../socket');
    notifyAdminNewBatch({
      batchId: batch._id,
      shopName: req.user.shopName || req.user.fullName || 'Seller',
      sellerName: req.user.fullName || '',
      totalProducts: pendingProducts.length,
      sellerId
    });

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
};

// @desc  Seller views their submitted batches with product details
// @route GET /api/product-batches/my-batches
// @access Seller
exports.getSellerBatches = async (req, res, next) => {
  try {
    const batches = await ProductBatch.find({ seller: req.user.id })
      .sort({ submittedAt: -1 })
      .populate({
        path: 'products.product',
        select: 'name images price sellerPrice category subcategory sku approvalStatus rejectionReason'
      });

    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
};

// @desc  Admin views all batches
// @route GET /api/product-batches
// @access Admin
exports.getAllBatches = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sellerId) filter.seller = req.query.sellerId;

    const batches = await ProductBatch.find(filter)
      .sort({ submittedAt: -1 })
      .populate('seller', 'fullName shopName email phone avatar');

    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
};

// @desc  Admin views full detail of one batch
// @route GET /api/product-batches/:batchId
// @access Admin
exports.getBatchDetail = async (req, res, next) => {
  try {
    const batch = await ProductBatch.findById(req.params.batchId)
      .populate('seller', 'fullName shopName email phone avatar')
      .populate({
        path: 'products.product',
        select: 'name images price sellerPrice category subcategory sku description brand approvalStatus rejectionReason'
      });

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    res.status(200).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
};

// @desc  Admin approves or rejects a single product inside a batch
// @route PATCH /api/product-batches/:batchId/products/:productId
// @access Admin
exports.reviewBatchProduct = async (req, res, next) => {
  try {
    const { batchId, productId } = req.params;
    const { action, rejectionReason = '' } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action must be "approved" or "rejected"' });
    }
    if (action === 'rejected' && !rejectionReason.trim()) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const batch = await ProductBatch.findById(batchId);
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });

    const item = batch.products.find(p => p.product.toString() === productId);
    if (!item) return res.status(404).json({ success: false, error: 'Product not found in batch' });
    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'This product has already been reviewed' });
    }

    // Update batch item
    item.status = action;
    item.rejectionReason = action === 'rejected' ? rejectionReason : '';
    item.reviewedAt = new Date();
    item.reviewedBy = req.user.id;

    // Update counts
    if (action === 'approved') batch.approvedCount += 1;
    else batch.rejectedCount += 1;
    batch.pendingCount = Math.max(0, batch.pendingCount - 1);

    // Update batch status
    if (batch.pendingCount === 0) batch.status = 'completed';
    else batch.status = 'in_progress';

    await batch.save();

    // Update the product itself
    const existingProduct = await Product.findById(productId);
    if (existingProduct) {
      const updateData = {
        approvalStatus: action,
        isApproved: action === 'approved',
        rejectionReason: action === 'rejected' ? rejectionReason : '',
        batchId: null // Clear batch reference after review
      };

      if (action === 'approved') {
        const commission = existingProduct.adminCommission || 0;
        const sPrice = existingProduct.sellerPrice || existingProduct.price;
        updateData.price = Math.round(sPrice * (1 + commission / 100));
        updateData.sellerPrice = sPrice;
      }

      await Product.findByIdAndUpdate(productId, updateData);

      // Notify seller via socket
      const { notifySellerBatchReview } = require('../socket');
      notifySellerBatchReview(batch.seller, {
        productId,
        productName: existingProduct.name,
        action,
        rejectionReason: action === 'rejected' ? rejectionReason : '',
        batchId,
        message: action === 'approved'
          ? `Your product "${existingProduct.name}" has been approved!`
          : `Your product "${existingProduct.name}" was rejected. Reason: ${rejectionReason}`
      });

      // Clear product cache
      try {
        const cacheService = require('../services/cacheService');
        cacheService.delPattern('products:list:*');
      } catch (_) {}
    }

    res.status(200).json({ success: true, data: { batchId, productId, action, batch } });
  } catch (error) {
    next(error);
  }
};
