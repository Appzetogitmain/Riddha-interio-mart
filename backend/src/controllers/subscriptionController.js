const User = require('../models/User');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { createRazorpayOrder, verifyRazorpayPayment } = require('../utils/paymentGateway');

const DEFAULT_PLANS = [
  {
    planId: 'silver',
    name: '🥈 SILVER',
    badge: '🥈 SILVER',
    emoji: '🥈',
    price: 1999,
    billingCycle: 'Monthly',
    durationDays: 30,
    popular: false,
    bestValue: false,
    description: 'Essential AI interior tools for monthly projects',
    features: [
      'Access to AI Design Quiz & Persona',
      'AI Recommendations Engine',
      'AI Cost Estimator Tool',
      'Standard Quotation Generator'
    ],
    isActive: true,
    orderIndex: 1
  },
  {
    planId: 'gold',
    name: '🥇 GOLD',
    badge: '🥇 GOLD',
    emoji: '🥇',
    price: 3999,
    billingCycle: 'Quarterly',
    durationDays: 90,
    popular: true,
    bestValue: false,
    description: 'Great for active home & commercial interior projects',
    features: [
      'All Silver Features Included',
      'AI Project Brief Generator',
      'Interactive BOQ Quantities & AI',
      'Projects Dashboard Access',
      'Save Unlimited AI Drafts'
    ],
    isActive: true,
    orderIndex: 2
  },
  {
    planId: 'platinum',
    name: '💎 PLATINUM',
    badge: '💎 PLATINUM',
    emoji: '💎',
    price: 6999,
    billingCycle: 'Halfyearly',
    durationDays: 180,
    popular: false,
    bestValue: false,
    description: 'Semi-annual power plan for interior designers & contractors',
    features: [
      'All Gold Features Included',
      'Priority Real-Time Order Tracking & Live GPS',
      'Custom RFQ & Request Pricing Priority',
      'Export BOQ & Quotations to PDF',
      'Dedicated Support Assistance'
    ],
    isActive: true,
    orderIndex: 3
  },
  {
    planId: 'diamond',
    name: '👑 DIAMOND',
    badge: '👑 DIAMOND',
    emoji: '👑',
    price: 11999,
    billingCycle: 'Yearly',
    durationDays: 365,
    popular: false,
    bestValue: true,
    description: 'Maximum value VIP plan with 1 year full AI access',
    features: [
      'Full VIP Access to ALL AI Features',
      'Maximum Savings (Save over 50%)',
      'Unlimited Project Briefs & BOQ Generation',
      '1-on-1 Interior Specialist Consultation',
      'Full Enterprise GST Invoicing Support'
    ],
    isActive: true,
    orderIndex: 4
  }
];

// Seed default plans into DB if empty
const seedDefaultPlans = async () => {
  try {
    const count = await SubscriptionPlan.countDocuments();
    if (count === 0) {
      console.log('[SUBSCRIPTION] Seeding default subscription plans into DB...');
      await SubscriptionPlan.insertMany(DEFAULT_PLANS);
    }
  } catch (err) {
    console.error('[SUBSCRIPTION] Failed to seed default plans:', err);
  }
};

// @desc    Get active subscription plans for users
// @route   GET /api/subscription/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    await seedDefaultPlans();
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ orderIndex: 1, price: 1 });
    
    // Map to frontend friendly format
    const formattedPlans = plans.map(p => ({
      id: p.planId,
      planId: p.planId,
      name: p.name,
      badge: p.badge || p.name,
      emoji: p.emoji || '👑',
      price: p.price,
      billingCycle: p.billingCycle,
      durationDays: p.durationDays,
      popular: p.popular,
      bestValue: p.bestValue,
      description: p.description,
      features: p.features,
      isActive: p.isActive,
      _id: p._id
    }));

    res.status(200).json({
      success: true,
      plans: formattedPlans
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all subscription plans for Admin (active & inactive)
// @route   GET /api/subscription/admin/plans
// @access  Private/Admin
exports.getAdminPlans = async (req, res) => {
  try {
    await seedDefaultPlans();
    const plans = await SubscriptionPlan.find().sort({ orderIndex: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new Subscription Plan (Admin)
// @route   POST /api/subscription/admin/plans
// @access  Private/Admin
exports.createPlan = async (req, res) => {
  try {
    const {
      planId,
      name,
      badge,
      emoji,
      price,
      billingCycle,
      durationDays,
      popular,
      bestValue,
      description,
      features,
      isActive,
      orderIndex
    } = req.body;

    if (!planId || !name || price === undefined || !durationDays) {
      return res.status(400).json({ success: false, message: 'Please provide planId, name, price, and durationDays' });
    }

    const existing = await SubscriptionPlan.findOne({ planId: planId.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Plan ID already exists. Use a unique slug ID.' });
    }

    const newPlan = await SubscriptionPlan.create({
      planId: planId.toLowerCase().trim(),
      name,
      badge: badge || name,
      emoji: emoji || '👑',
      price: Number(price),
      billingCycle: billingCycle || 'Monthly',
      durationDays: Number(durationDays),
      popular: Boolean(popular),
      bestValue: Boolean(bestValue),
      description: description || '',
      features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : []),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      orderIndex: orderIndex ? Number(orderIndex) : 0
    });

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: newPlan
    });
  } catch (err) {
    console.error('[ADMIN SUBSCRIPTION] Create plan failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a Subscription Plan (Admin)
// @route   PUT /api/subscription/admin/plans/:id
// @access  Private/Admin
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    const fieldsToUpdate = [
      'name', 'badge', 'emoji', 'price', 'billingCycle', 'durationDays',
      'popular', 'bestValue', 'description', 'features', 'isActive', 'orderIndex'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'features' && typeof req.body.features === 'string') {
          plan.features = req.body.features.split('\n').map(f => f.trim()).filter(Boolean);
        } else {
          plan[field] = req.body[field];
        }
      }
    });

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });
  } catch (err) {
    console.error('[ADMIN SUBSCRIPTION] Update plan failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a Subscription Plan (Admin)
// @route   DELETE /api/subscription/admin/plans/:id
// @access  Private/Admin
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    await SubscriptionPlan.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current user's subscription status
// @route   GET /api/subscription/status
// @access  Private
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let sub = user.subscription || { status: 'none', planId: null };

    // Check if subscription has expired
    if (sub.status === 'active' && sub.endDate && new Date(sub.endDate) < new Date()) {
      sub.status = 'expired';
      user.subscription.status = 'expired';
      await user.save();
    }

    res.status(200).json({
      success: true,
      subscription: sub,
      isPro: sub.status === 'active' && new Date(sub.endDate) > new Date()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create Razorpay Order for Pro Subscription
// @route   POST /api/subscription/create-order
// @access  Private
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    await seedDefaultPlans();
    
    // Find plan in DB first
    let plan = await SubscriptionPlan.findOne({ planId: planId?.toLowerCase()?.trim(), isActive: true });

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive subscription plan selected' });
    }

    const receiptId = `sub_${req.user._id.toString().slice(-6)}_${Date.now()}`;
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
        durationDays: plan.durationDays
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('[SUBSCRIPTION] Create order failed:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create subscription order' });
  }
};

// @desc    Verify Razorpay Payment and Activate Subscription
// @route   POST /api/subscription/verify-payment
// @access  Private
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const plan = await SubscriptionPlan.findOne({ planId: planId?.toLowerCase()?.trim() });
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
    }

    // Verify payment signature
    const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Payment verification failed.' });
    }

    let user = req.user;
    if (!user) {
      const targetId = req.body?.userId;
      if (targetId) {
        user = (await User.findById(targetId)) || (await Admin.findById(targetId));
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found. Please log in to complete purchase.' });
    }

    // Calculate start & end date with Stacking/Extension logic
    const isCurrentlyActive = user.subscription && user.subscription.status === 'active' && user.subscription.endDate && new Date(user.subscription.endDate) > new Date();

    let startDate = new Date();
    let endDate;

    if (isCurrentlyActive) {
      // Extend from existing endDate
      const currentEnd = new Date(user.subscription.endDate);
      startDate = user.subscription.startDate || new Date();
      endDate = new Date(currentEnd.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date();
      endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    }

    const subscriptionData = {
      planId: plan.planId,
      planName: plan.name,
      status: 'active',
      startDate,
      endDate,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    };

    user.subscription = subscriptionData;

    // Safely update MongoDB document without triggering unselected password validation
    await user.constructor.updateOne(
      { _id: user._id },
      { $set: { subscription: subscriptionData } }
    );

    // Create Subscription Audit Log
    await Subscription.create({
      user: user._id,
      planId: plan.planId,
      planName: plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle,
      durationDays: plan.durationDays,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'active',
      startDate,
      endDate
    });

    try {
      const cacheService = require('../services/cacheService');
      cacheService.del(`user:profile:${user.role || 'user'}:${user._id}`);
      cacheService.del(`user:profile:user:${user._id}`);
      cacheService.del(`user:profile:admin:${user._id}`);
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: `Congratulations! ${plan.name} plan activated successfully.`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      }
    });
  } catch (err) {
    console.error('[SUBSCRIPTION] Verify payment failed:', err);
    res.status(500).json({ success: false, message: err.message || 'Subscription payment verification failed' });
  }
};

// @desc    Get All Purchased Subscriptions (Admin)
// @route   GET /api/subscription/admin/purchases
// @access  Private/Admin
exports.getAdminSubscriptions = async (req, res) => {
  try {
    const purchases = await Subscription.find()
      .populate('user', 'fullName email phone role avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (err) {
    console.error('[ADMIN SUBSCRIPTION] Get purchases failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
