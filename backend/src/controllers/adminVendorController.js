/**
 * Admin Vendor Management Controller
 * Handles vendor verification and management
 */

const Seller = require('../models/Seller');

// @desc    Set seller verification status
// @route   PATCH /api/admin/sellers/:sellerId/verify
// @access  Private/Admin
exports.setSellerVerificationStatus = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { verificationStatus } = req.body;

    // Validate verification status
    const validStatuses = [
      'unverified',
      'verified',
      'manufacturer',
      'authorized_distributor',
      'dealer',
      'wholesaler',
      'local_supplier',
      'premium_vendor',
      'project_supplier'
    ];

    if (!validStatuses.includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid verification status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update seller
    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { verificationStatus },
      { new: true, runValidators: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }

    // Clear cache
    try {
      const cacheService = require('../services/cacheService');
      cacheService.del(`user:profile:seller:${sellerId}`);
      cacheService.del('analytics:admin:dashboard');
      cacheService.delPattern('products:*');
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Seller verification status updated to: ${verificationStatus}`,
      data: {
        _id: seller._id,
        fullName: seller.fullName,
        shopName: seller.shopName,
        verificationStatus: seller.verificationStatus,
        status: seller.status
      }
    });
  } catch (error) {
    console.error('[Set Verification Status Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get seller details with location
// @route   GET /api/admin/sellers/:sellerId
// @access  Private/Admin
exports.getSellerDetails = async (req, res, next) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId).select(
      'fullName email shopName location region verificationStatus deliveryCapabilities status isVerified createdAt'
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('[Get Seller Details Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    List all sellers with pagination and filters
// @route   GET /api/admin/sellers
// @access  Private/Admin
exports.getAllSellers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.verificationStatus) {
      filter.verificationStatus = req.query.verificationStatus;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Get total count
    const total = await Seller.countDocuments(filter);

    // Get sellers
    const sellers = await Seller.find(filter)
      .select('fullName email shopName location verificationStatus status isVerified createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sellers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Get All Sellers Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update seller delivery capabilities
// @route   PATCH /api/admin/sellers/:sellerId/delivery-capabilities
// @access  Private/Admin
exports.updateDeliveryCapabilities = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const capabilities = req.body;

    // Validate capabilities
    const validCapabilities = [
      'sameDay',
      'nextDay',
      'standardDelivery',
      'bulkDelivery',
      'siteDelivery',
      'hyperlocal',
      'express'
    ];

    for (const cap of Object.keys(capabilities)) {
      if (!validCapabilities.includes(cap)) {
        return res.status(400).json({
          success: false,
          error: `Invalid capability: ${cap}`
        });
      }
    }

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { deliveryCapabilities: capabilities },
      { new: true, runValidators: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }

    // Clear cache
    try {
      const cacheService = require('../services/cacheService');
      cacheService.del(`user:profile:seller:${sellerId}`);
      cacheService.delPattern('products:*');
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Delivery capabilities updated',
      data: seller.deliveryCapabilities
    });
  } catch (error) {
    console.error('[Update Delivery Capabilities Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
