const Offer = require('../models/Offer');
const Product = require('../models/Product');
const OFFER_TYPES = require('../constants/offerTypes');
const { paginate } = require('../utils/paginate');

exports.createOffer = async (req, res, next) => {
  try {
    const { type, title, description, products, startDate, endDate, discountType, discountValue, minQuantity, couponCode, usageLimit, comboPrice } = req.body;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    // Basic validation
    if (!OFFER_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid offer type' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product must be selected' });
    }

    // Type-specific validation
    if (type === 'Combo Offers' && products.length < 2) {
      return res.status(400).json({ error: 'Combo Offers require at least 2 products' });
    }

    if (type === 'Coupon') {
      if (!couponCode) return res.status(400).json({ error: 'Coupon code is required' });
      if (discountType === 'fixedPrice') return res.status(400).json({ error: 'Coupon cannot use fixedPrice discount type' });
      const existingCoupon = await Offer.findOne({ couponCode });
      if (existingCoupon) return res.status(400).json({ error: 'Coupon code already exists' });
    }

    if (type === 'Clearance Sale' && discountType !== 'fixedPrice') {
      return res.status(400).json({ error: 'Clearance Sale must use fixedPrice discount type' });
    }

    if (type === 'Bulk Purchase Discount') {
      if (!minQuantity || minQuantity <= 0) {
        return res.status(400).json({ error: 'Bulk Purchase Discount requires minQuantity > 0' });
      }
      if (discountType === 'fixedPrice') {
        return res.status(400).json({ error: 'Bulk Purchase Discount cannot use fixedPrice discount type' });
      }
    }

    // Verify products exist and ownership for sellers
    const foundProducts = await Product.find({ _id: { $in: products } });
    if (foundProducts.length !== products.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Seller ownership validation
    if (userRole === 'seller') {
      const unauthorized = foundProducts.some(p => p.seller.toString() !== userId.toString());
      if (unauthorized) {
        return res.status(403).json({ error: 'You can only create offers for your own products' });
      }
    }

    const offerData = {
      type,
      title,
      description,
      products,
      createdBy: userId,
      creatorType: userRole === 'seller' ? 'Seller' : 'Admin',
      approvalStatus: userRole === 'seller' ? 'pending' : 'approved',
      isActive: true,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };

    // Add pricing fields based on type
    if (type === 'Combo Offers') {
      if (!comboPrice || comboPrice <= 0) {
        return res.status(400).json({ error: 'Combo price is required and must be positive' });
      }
      offerData.discountType = 'flat';
      offerData.discountValue = 0; // Placeholder
      offerData.comboPrice = Number(comboPrice);
    } else {
      if (!discountType || discountValue === undefined || discountValue === null) {
        return res.status(400).json({ error: 'Discount type and value are required' });
      }
      offerData.discountType = discountType;
      offerData.discountValue = Number(discountValue);
      if (type === 'Bulk Purchase Discount') {
        offerData.minQuantity = Number(minQuantity);
      }
      if (type === 'Coupon') {
        offerData.couponCode = couponCode.toUpperCase();
        offerData.usageLimit = usageLimit ? Number(usageLimit) : null;
      }
    }

    const offer = await Offer.create(offerData);
    await offer.populate('products', 'name price images');

    res.status(201).json({
      success: true,
      data: offer
    });
  } catch (err) {
    next(err);
  }
};

exports.getOffers = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    const filter = {};

    // Role-based scoping
    if (userRole === 'seller') {
      filter.createdBy = userId;
      filter.creatorType = 'Seller';
    }

    // Type filter
    if (req.query.type && req.query.type !== 'any') {
      filter.type = req.query.type;
    }

    // Status filter
    if (req.query.approvalStatus) {
      filter.approvalStatus = req.query.approvalStatus;
    }

    // Active filter
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const result = await paginate(Offer, filter, req, {
      path: 'products',
      select: 'name price images'
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

exports.getOffer = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    const offer = await Offer.findById(req.params.id).populate('products', 'name price images');

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Seller can only view their own offers
    if (userRole === 'seller' && offer.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this offer' });
    }

    res.json({
      success: true,
      data: offer
    });
  } catch (err) {
    next(err);
  }
};

exports.updateOffer = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const { type, title, description, products, startDate, endDate, discountType, discountValue, minQuantity, couponCode, usageLimit, comboPrice, isActive } = req.body;

    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Ownership check
    if (userRole === 'seller' && offer.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this offer' });
    }

    // If products array changes, re-validate ownership for sellers
    if (products && Array.isArray(products) && products.length > 0) {
      const foundProducts = await Product.find({ _id: { $in: products } });
      if (foundProducts.length !== products.length) {
        return res.status(400).json({ error: 'One or more products not found' });
      }
      if (userRole === 'seller') {
        const unauthorized = foundProducts.some(p => p.seller.toString() !== userId.toString());
        if (unauthorized) {
          return res.status(403).json({ error: 'You can only add your own products to offers' });
        }
      }
      offer.products = products;

      // Reset approval status if products change (for sellers)
      if (userRole === 'seller' && (offer.products.length !== products.length || !products.every(p => offer.products.includes(p)))) {
        offer.approvalStatus = 'pending';
      }
    }

    // Update fields
    if (title !== undefined) offer.title = title;
    if (description !== undefined) offer.description = description;
    if (startDate !== undefined) offer.startDate = new Date(startDate);
    if (endDate !== undefined) offer.endDate = new Date(endDate);
    if (isActive !== undefined) offer.isActive = isActive;

    // Only update approval status if isActive is the only change (toggling)
    if (Object.keys(req.body).filter(k => k !== 'isActive').length === 0) {
      // Reset approval on other changes
    } else if (userRole === 'seller' && req.body.approvalStatus === undefined) {
      offer.approvalStatus = 'pending';
    }

    // Update pricing fields based on type
    if (offer.type === 'Combo Offers') {
      if (comboPrice !== undefined && comboPrice > 0) {
        offer.comboPrice = Number(comboPrice);
      }
    } else {
      if (discountType !== undefined) offer.discountType = discountType;
      if (discountValue !== undefined) offer.discountValue = Number(discountValue);
      if (offer.type === 'Bulk Purchase Discount' && minQuantity !== undefined) {
        offer.minQuantity = Number(minQuantity);
      }
      if (offer.type === 'Coupon' && usageLimit !== undefined) {
        offer.usageLimit = usageLimit ? Number(usageLimit) : null;
      }
    }

    await offer.save();
    await offer.populate('products', 'name price images');

    res.json({
      success: true,
      data: offer
    });
  } catch (err) {
    next(err);
  }
};

exports.updateApprovalStatus = async (req, res, next) => {
  try {
    const { approvalStatus, rejectionReason } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus,
        rejectionReason: approvalStatus === 'rejected' ? rejectionReason : undefined
      },
      { new: true }
    ).populate('products', 'name price images');

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json({
      success: true,
      data: offer
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteOffer = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Ownership check
    if (userRole === 'seller' && offer.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this offer' });
    }

    await Offer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
