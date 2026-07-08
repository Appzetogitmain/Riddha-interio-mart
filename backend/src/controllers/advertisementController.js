const AdvertisementPlan = require('../models/AdvertisementPlan');
const SellerAdvertisement = require('../models/SellerAdvertisement');
const Product = require('../models/Product');
const SellerWallet = require('../models/SellerWallet');
const { validationResult } = require('express-validator');

// @desc    Create Advertisement Plan
// @route   POST /api/advertisements/plans
// @access  Private (Admin)
exports.createPlan = async (req, res, next) => {
  try {
    const { name, price, durationDays, maxProducts } = req.body;
    
    const plan = await AdvertisementPlan.create({
      name,
      price,
      durationDays,
      maxProducts: maxProducts || 1
    });

    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all active advertisement plans
// @route   GET /api/advertisements/plans
// @access  Private (Seller/Admin)
exports.getAllPlans = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { isActive: true };
    const plans = await AdvertisementPlan.find(query).sort('-createdAt');
    res.status(200).json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Plan
// @route   PUT /api/advertisements/plans/:id
// @access  Private (Admin)
exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await AdvertisementPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

// @desc    Purchase a plan
// @route   POST /api/advertisements/purchase
// @access  Private (Seller)
exports.purchasePlan = async (req, res, next) => {
  try {
    const { planId, paymentMethod } = req.body;
    const plan = await AdvertisementPlan.findById(planId);
    
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, error: 'Plan not found or inactive' });
    }

    if (paymentMethod === 'Wallet') {
      const wallet = await SellerWallet.findOne({ seller: req.user.id });
      if (!wallet || wallet.withdrawableBalance < plan.price) {
        return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
      }

      // Deduct from wallet (use withdrawableBalance)
      const newBalance = wallet.withdrawableBalance - plan.price;
      wallet.withdrawableBalance = newBalance;

      // Create the advertisement first so we have its ID as referenceId
      const advertisement = await SellerAdvertisement.create({
        seller: req.user.id,
        plan: plan._id,
        status: 'Active',
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
        paymentMethod,
        amountPaid: plan.price,
        transactionId: `TXN_AD_${Date.now()}`
      });

      wallet.transactions.push({
        type: 'commission_debit',
        amount: plan.price,
        description: `Purchased Advertisement Plan: ${plan.name}`,
        referenceId: advertisement._id,
        balanceAfter: newBalance,
        status: 'cleared'
      });
      await wallet.save();

      return res.status(201).json({ success: true, data: advertisement });
    } else if (paymentMethod === 'Online') {
      // Create a Razorpay order for the seller to pay online
      const { createRazorpayOrder } = require('../utils/paymentGateway');
      const receiptId = `ad_${Date.now().toString().slice(-8)}`;
      const razorpayOrder = await createRazorpayOrder(plan.price, receiptId);
      return res.status(200).json({
        success: true,
        requiresPayment: true,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        planId,
        planName: plan.name
      });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Razorpay payment and activate ad plan
// @route   POST /api/advertisements/verify-payment
// @access  Private (Seller)
exports.verifyAdPayment = async (req, res, next) => {
  try {
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const { verifyRazorpayPayment } = require('../utils/paymentGateway');
    const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Payment verification failed. Invalid signature.' });
    }

    const plan = await AdvertisementPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, error: 'Plan not found or inactive' });
    }

    const advertisement = await SellerAdvertisement.create({
      seller: req.user.id,
      plan: plan._id,
      status: 'Active',
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
      paymentMethod: 'Online',
      amountPaid: plan.price,
      transactionId: razorpay_payment_id
    });

    res.status(201).json({ success: true, data: advertisement });
  } catch (err) {
    next(err);
  }
};

// @desc    Select products for active advertisement
// @route   POST /api/advertisements/:id/select-products
// @access  Private (Seller)
exports.selectProductsForAd = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    const ad = await SellerAdvertisement.findOne({ _id: req.params.id, seller: req.user.id }).populate('plan');

    if (!ad) {
      return res.status(404).json({ success: false, error: 'Advertisement not found' });
    }

    if (ad.status !== 'Active') {
      return res.status(400).json({ success: false, error: 'Advertisement is not active' });
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide products' });
    }

    if (productIds.length > ad.plan.maxProducts) {
      return res.status(400).json({ success: false, error: `You can only select up to ${ad.plan.maxProducts} products for this plan` });
    }

    // Verify products belong to seller
    const products = await Product.find({ _id: { $in: productIds }, seller: req.user.id });
    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, error: 'One or more products not found or do not belong to you' });
    }

    // Clear old products if they were set (unlikely for "one-time set", but allows updating)
    if (ad.products && ad.products.length > 0) {
      await Product.updateMany(
        { _id: { $in: ad.products } },
        { isAdvertised: false, advertisementEndDate: null }
      );
    }

    // Set new products
    ad.products = productIds;
    await ad.save();

    // Update products to reflect active advertisement
    await Product.updateMany(
      { _id: { $in: productIds } },
      { isAdvertised: true, advertisementEndDate: ad.endDate }
    );

    res.status(200).json({ success: true, data: ad });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my advertisements
// @route   GET /api/advertisements/my-ads
// @access  Private (Seller)
exports.getMyAdvertisements = async (req, res, next) => {
  try {
    const ads = await SellerAdvertisement.find({ seller: req.user.id })
      .populate('plan')
      .populate('products', 'name images price countInStock')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: ads });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public advertised products
// @route   GET /api/advertisements/public
// @access  Public
exports.getAdvertisedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isAdvertised: true,
      advertisementEndDate: { $gt: new Date() },
      isApproved: true,
      isActive: true
    }).select('name images price rating numReviews countInStock discountPrice isAdvertised')
      .limit(20);
      
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};
