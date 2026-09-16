const User = require('../models/User');
const B2CPlan = require('../models/B2CPlan');
const B2CSubscription = require('../models/B2CSubscription');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../utils/paymentGateway');

// Default B2C plans to seed if DB is empty
const DEFAULT_B2C_PLANS = [
  {
    planId: 'b2c-silver',
    name: '🥈 SILVER',
    badge: '🥈 SILVER',
    emoji: '🥈',
    price: 1999,
    billingCycle: 'Monthly',
    durationDays: 30,
    popular: false,
    bestValue: false,
    emiAvailable: true,
    emiMonths: 3,
    fastestDelivery: true,
    hireDesigner: true,
    hireContractor: false,
    hireArchitect: false,
    description: 'Essential plan for customers who want express delivery & designer access',
    features: [
      '⚡ Fastest Express Delivery (24-48h)',
      '💳 Flexible EMI in 3 months',
      '🎨 Hire Verified Designers',
      '🚚 Priority Order Processing',
      '📞 Priority Customer Support'
    ],
    isActive: true,
    orderIndex: 1
  },
  {
    planId: 'b2c-gold',
    name: '🥇 GOLD',
    badge: '🥇 GOLD',
    emoji: '🥇',
    price: 3999,
    billingCycle: 'Quarterly',
    durationDays: 90,
    popular: true,
    bestValue: false,
    emiAvailable: true,
    emiMonths: 6,
    fastestDelivery: true,
    hireDesigner: true,
    hireContractor: true,
    hireArchitect: false,
    description: 'Best for home renovation projects needing designer + contractor',
    features: [
      '⚡ All Silver Features Included',
      '👷 Hire Certified Contractors',
      '💳 0% Interest EMI up to 6 months',
      '🎁 Exclusive B2C Member Discounts',
      '📦 Zero Delivery & Handling Fees'
    ],
    isActive: true,
    orderIndex: 2
  },
  {
    planId: 'b2c-platinum',
    name: '💎 PLATINUM',
    badge: '💎 PLATINUM',
    emoji: '💎',
    price: 6999,
    billingCycle: 'Half-Yearly',
    durationDays: 180,
    popular: false,
    bestValue: false,
    emiAvailable: true,
    emiMonths: 12,
    fastestDelivery: true,
    hireDesigner: true,
    hireContractor: true,
    hireArchitect: true,
    description: 'Complete plan with all hire services and VIP perks',
    features: [
      '⚡ All Gold Features Included',
      '🏛️ Hire Professional Architects',
      '💳 EMI up to 12 months',
      '🌟 VIP Priority Order Dispatch',
      '🛎️ Dedicated Personal Shopping Assistant'
    ],
    isActive: true,
    orderIndex: 3
  },
  {
    planId: 'b2c-diamond',
    name: '👑 DIAMOND',
    badge: '👑 DIAMOND',
    emoji: '👑',
    price: 11999,
    billingCycle: 'Yearly',
    durationDays: 365,
    popular: false,
    bestValue: true,
    emiAvailable: true,
    emiMonths: 24,
    fastestDelivery: true,
    hireDesigner: true,
    hireContractor: true,
    hireArchitect: true,
    description: 'VIP yearly plan with maximum savings and all hire services',
    features: [
      '👑 Full VIP: Hire Designer, Contractor & Architect',
      '⚡ Same-Day Order Dispatch',
      '💳 0% Interest EMI up to 24 months',
      '🎉 Zero Delivery & Handling Fees (1 Year)',
      '🏆 Save over 50% vs Monthly Billing'
    ],
    isActive: true,
    orderIndex: 4
  }
];

const seedDefaultB2CPlans = async () => {
  try {
    const count = await B2CPlan.countDocuments();
    if (count === 0) {
      console.log('[B2C SUBSCRIPTION] Seeding default B2C plans...');
      await B2CPlan.insertMany(DEFAULT_B2C_PLANS);
    }
  } catch (err) {
    console.error('[B2C SUBSCRIPTION] Failed to seed default B2C plans:', err);
  }
};

// @desc    Get active B2C subscription plans (public)
// @route   GET /api/b2c-subscription/plans
// @access  Public
exports.getB2CPlans = async (req, res) => {
  try {
    await seedDefaultB2CPlans();
    const plans = await B2CPlan.find({ isActive: true }).sort({ orderIndex: 1, price: 1 });
    res.status(200).json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all B2C plans for admin (active & inactive)
// @route   GET /api/b2c-subscription/admin/plans
// @access  Private/Admin
exports.getAdminB2CPlans = async (req, res) => {
  try {
    await seedDefaultB2CPlans();
    const plans = await B2CPlan.find().sort({ orderIndex: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create B2C Plan (Admin)
// @route   POST /api/b2c-subscription/admin/plans
// @access  Private/Admin
exports.createB2CPlan = async (req, res) => {
  try {
    const {
      planId, name, badge, emoji, price, billingCycle, durationDays,
      emiAvailable, emiMonths, fastestDelivery, hireDesigner, hireContractor,
      hireArchitect, popular, bestValue, description, features, isActive, orderIndex
    } = req.body;

    if (!planId || !name || price === undefined || !durationDays) {
      return res.status(400).json({ success: false, message: 'Please provide planId, name, price, and durationDays' });
    }

    const existing = await B2CPlan.findOne({ planId: planId.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Plan ID already exists. Use a unique slug ID.' });
    }

    const newPlan = await B2CPlan.create({
      planId: planId.toLowerCase().trim(),
      name,
      badge: badge || name,
      emoji: emoji || '🚀',
      price: Number(price),
      billingCycle: billingCycle || 'Monthly',
      durationDays: Number(durationDays),
      emiAvailable: Boolean(emiAvailable),
      emiMonths: Number(emiMonths) || 0,
      fastestDelivery: Boolean(fastestDelivery),
      hireDesigner: Boolean(hireDesigner),
      hireContractor: Boolean(hireContractor),
      hireArchitect: Boolean(hireArchitect),
      popular: Boolean(popular),
      bestValue: Boolean(bestValue),
      description: description || '',
      features: Array.isArray(features) ? features : (features ? features.split('\n').map(f => f.trim()).filter(Boolean) : []),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      orderIndex: orderIndex ? Number(orderIndex) : 0
    });

    res.status(201).json({ success: true, message: 'B2C plan created successfully', data: newPlan });
  } catch (err) {
    console.error('[ADMIN B2C] Create plan failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update B2C Plan (Admin)
// @route   PUT /api/b2c-subscription/admin/plans/:id
// @access  Private/Admin
exports.updateB2CPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await B2CPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'B2C plan not found' });
    }

    const updatableFields = [
      'name', 'badge', 'emoji', 'price', 'billingCycle', 'durationDays',
      'emiAvailable', 'emiMonths', 'fastestDelivery', 'hireDesigner',
      'hireContractor', 'hireArchitect', 'popular', 'bestValue',
      'description', 'features', 'isActive', 'orderIndex'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'features' && typeof req.body.features === 'string') {
          plan.features = req.body.features.split('\n').map(f => f.trim()).filter(Boolean);
        } else {
          plan[field] = req.body[field];
        }
      }
    });

    await plan.save();
    res.status(200).json({ success: true, message: 'B2C plan updated successfully', data: plan });
  } catch (err) {
    console.error('[ADMIN B2C] Update plan failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete B2C Plan (Admin)
// @route   DELETE /api/b2c-subscription/admin/plans/:id
// @access  Private/Admin
exports.deleteB2CPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await B2CPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'B2C plan not found' });
    }
    await B2CPlan.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'B2C plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create Razorpay Order for B2C Plan
// @route   POST /api/b2c-subscription/create-order
// @access  Private
exports.createB2COrder = async (req, res) => {
  try {
    const { planId } = req.body;
    await seedDefaultB2CPlans();

    const plan = await B2CPlan.findOne({ planId: planId?.toLowerCase()?.trim(), isActive: true });
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive B2C plan selected' });
    }

    const receiptId = `b2c_${req.user._id.toString().slice(-6)}_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(plan.price, receiptId);

    res.status(200).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      plan: {
        id: plan.planId,
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        durationDays: plan.durationDays,
        hireDesigner: plan.hireDesigner,
        hireContractor: plan.hireContractor,
        hireArchitect: plan.hireArchitect,
        emiAvailable: plan.emiAvailable,
        fastestDelivery: plan.fastestDelivery
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('[B2C SUBSCRIPTION] Create order failed:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create B2C order' });
  }
};

// @desc    Verify Razorpay Payment and Activate B2C Subscription on user profile
// @route   POST /api/b2c-subscription/verify-payment
// @access  Private
exports.verifyB2CPayment = async (req, res) => {
  try {
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const plan = await B2CPlan.findOne({ planId: planId?.toLowerCase()?.trim() });
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid B2C plan' });
    }

    // Verify payment signature (mock signature accepted in dev)
    const isValid = razorpay_order_id.startsWith('order_mock_')
      ? true
      : verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
    }

    let user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please log in.' });
    }

    // Calculate validity dates (extend if already active)
    const isCurrentlyActive = user.b2cSubscription &&
      user.b2cSubscription.status === 'active' &&
      user.b2cSubscription.endDate &&
      new Date(user.b2cSubscription.endDate) > new Date();

    let startDate = new Date();
    let endDate;

    if (isCurrentlyActive) {
      startDate = user.b2cSubscription.startDate || new Date();
      endDate = new Date(new Date(user.b2cSubscription.endDate).getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    } else {
      endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    }

    const b2cSubscriptionData = {
      planId: plan.planId,
      planName: plan.name,
      status: 'active',
      startDate,
      endDate,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      // Store unlocked feature flags from the plan
      hireDesigner: plan.hireDesigner,
      hireContractor: plan.hireContractor,
      hireArchitect: plan.hireArchitect,
      emiAvailable: plan.emiAvailable,
      fastestDelivery: plan.fastestDelivery
    };

    // Update user's b2cSubscription field in MongoDB and trigger cache invalidation
    user.b2cSubscription = b2cSubscriptionData;
    await user.save({ validateModifiedOnly: true });

    // Create B2C audit log
    await B2CSubscription.create({
      user: user._id,
      planId: plan.planId,
      planName: plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle,
      durationDays: plan.durationDays,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature || '',
      status: 'active',
      startDate,
      endDate,
      hireDesigner: plan.hireDesigner,
      hireContractor: plan.hireContractor,
      hireArchitect: plan.hireArchitect,
      emiAvailable: plan.emiAvailable,
      fastestDelivery: plan.fastestDelivery
    });

    // Clear cache
    try {
      const cacheService = require('../services/cacheService');
      cacheService.del(`user:profile:${user.role || 'user'}:${user._id}`);
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `🎉 ${plan.name} B2C Plan activated successfully!`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        b2cSubscription: b2cSubscriptionData
      }
    });
  } catch (err) {
    console.error('[B2C SUBSCRIPTION] Verify payment failed:', err);
    res.status(500).json({ success: false, message: err.message || 'B2C payment verification failed' });
  }
};

// @desc    Get current user's B2C subscription status
// @route   GET /api/b2c-subscription/status
// @access  Private
exports.getB2CStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let sub = user.b2cSubscription || { status: 'none', planId: null };

    // Auto-expire if past endDate
    if (sub.status === 'active' && sub.endDate && new Date(sub.endDate) < new Date()) {
      sub.status = 'expired';
      await user.constructor.updateOne({ _id: user._id }, { $set: { 'b2cSubscription.status': 'expired' } });
    }

    res.status(200).json({
      success: true,
      b2cSubscription: sub,
      isB2CActive: sub.status === 'active' && new Date(sub.endDate) > new Date()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Admin: Get all B2C purchases
// @route   GET /api/b2c-subscription/admin/purchases
// @access  Private/Admin
exports.getAdminB2CPurchases = async (req, res) => {
  try {
    const purchases = await B2CSubscription.find()
      .populate('user', 'fullName email phone role avatar userType')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: purchases.length, data: purchases });
  } catch (err) {
    console.error('[ADMIN B2C] Get purchases failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
