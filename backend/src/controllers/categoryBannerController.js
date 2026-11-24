const mongoose = require('mongoose');
const CategoryBannerPlan = require('../models/CategoryBannerPlan');
const CategoryBannerAd = require('../models/CategoryBannerAd');
const Category = require('../models/Category');
const SellerWallet = require('../models/SellerWallet');

const DAY = 24 * 60 * 60 * 1000;
const PENDING_PAYMENT_HOLD_MS = 30 * 60 * 1000; // an unpaid checkout holds a slot for 30 min

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Only same-site paths or https links can be used as the banner destination
const safeLink = (v) => {
  const s = String(v || '').trim();
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  if (/^https:\/\/[^\s]+$/i.test(s)) return s;
  return null;
};

// ───────────────────────── Plans (admin) ─────────────────────────
exports.listPlans = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { isActive: true };
    const plans = await CategoryBannerPlan.find(filter).sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

const planFields = ['name', 'description', 'price', 'durationDays', 'maxCategories', 'allowVideo', 'slotsPerCategory', 'isActive'];
const pickPlan = (body) => planFields.reduce((o, k) => (body[k] !== undefined ? { ...o, [k]: body[k] } : o), {});

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await CategoryBannerPlan.create(pickPlan(req.body));
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, error: Object.values(err.errors).map(e => e.message).join(', ') });
    next(err);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await CategoryBannerPlan.findByIdAndUpdate(req.params.id, pickPlan(req.body), { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, error: Object.values(err.errors).map(e => e.message).join(', ') });
    next(err);
  }
};

// ───────────────────────── Seller: buy a banner ─────────────────────────
// Count ads that currently occupy a slot in each category
const slotUsage = async (categoryIds) => {
  const now = new Date();
  const ads = await CategoryBannerAd.find({
    categories: { $in: categoryIds },
    $or: [
      { status: 'Active', endDate: { $gt: now } },
      { status: 'PendingReview' },
      { status: 'PendingPayment', createdAt: { $gt: new Date(Date.now() - PENDING_PAYMENT_HOLD_MS) } }
    ]
  }).select('categories').lean();
  const usage = new Map();
  ads.forEach(a => a.categories.forEach(c => usage.set(String(c), (usage.get(String(c)) || 0) + 1)));
  return usage;
};

// GET /availability?categories=a,b  -> how many slots are taken per category (so the UI can warn early)
exports.availability = async (req, res, next) => {
  try {
    const ids = String(req.query.categories || '').split(',').filter(isValidId);
    const usage = await slotUsage(ids);
    res.json({ success: true, data: Object.fromEntries(ids.map(id => [id, usage.get(id) || 0])) });
  } catch (err) { next(err); }
};

// POST /ads  { planId, categories[], media{url,type,width,height}, altText, linkUrl, paymentMethod }
exports.createAd = async (req, res, next) => {
  try {
    const { planId, paymentMethod, altText, linkUrl } = req.body;
    const plan = isValidId(planId) ? await CategoryBannerPlan.findById(planId) : null;
    if (!plan || !plan.isActive) return res.status(404).json({ success: false, error: 'Plan not found or inactive' });
    if (!['Wallet', 'Online'].includes(paymentMethod)) return res.status(400).json({ success: false, error: 'Invalid payment method' });

    const categoryIds = [...new Set((req.body.categories || []).map(String))].filter(isValidId);
    if (!categoryIds.length) return res.status(400).json({ success: false, error: 'Choose at least one category' });
    if (categoryIds.length > plan.maxCategories) {
      return res.status(400).json({ success: false, error: `This plan allows up to ${plan.maxCategories} categor${plan.maxCategories === 1 ? 'y' : 'ies'}` });
    }
    const cats = await Category.find({ _id: { $in: categoryIds } }).select('name').lean();
    if (cats.length !== categoryIds.length) return res.status(400).json({ success: false, error: 'One or more categories no longer exist' });

    const media = req.body.media || {};
    if (!media.url || !/^https:\/\//i.test(media.url) || !['image', 'video'].includes(media.type)) {
      return res.status(400).json({ success: false, error: 'Please upload the banner image or video' });
    }
    if (media.type === 'video' && !plan.allowVideo) {
      return res.status(400).json({ success: false, error: 'This plan supports images only' });
    }
    const link = safeLink(linkUrl);
    if (link === null) return res.status(400).json({ success: false, error: 'Link must start with / or https://' });

    // Slot availability
    const usage = await slotUsage(categoryIds);
    const full = cats.filter(c => (usage.get(String(c._id)) || 0) >= plan.slotsPerCategory);
    if (full.length) {
      return res.status(409).json({ success: false, error: `Fully booked right now: ${full.map(c => c.name).join(', ')}. Please pick another category or try later.` });
    }

    const base = {
      seller: req.user.id, plan: plan._id, categories: categoryIds,
      media: { url: media.url, type: media.type, width: media.width, height: media.height },
      altText: String(altText || '').slice(0, 120), linkUrl: link,
      paymentMethod, amountPaid: plan.price
    };

    if (paymentMethod === 'Wallet') {
      // Atomic debit: only succeeds if the balance is still enough
      const wallet = await SellerWallet.findOneAndUpdate(
        { seller: req.user.id, withdrawableBalance: { $gte: plan.price } },
        { $inc: { withdrawableBalance: -plan.price } },
        { new: true }
      );
      if (!wallet) return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
      const ad = await CategoryBannerAd.create({ ...base, status: 'PendingReview', transactionId: `TXN_CBA_${Date.now()}` });
      wallet.transactions.push({
        type: 'commission_debit', amount: plan.price, description: `Category banner: ${plan.name}`,
        referenceId: ad._id, balanceAfter: wallet.withdrawableBalance, status: 'cleared'
      });
      await wallet.save();
      return res.status(201).json({ success: true, data: ad });
    }

    // Online: create the ad as PendingPayment and a Razorpay order; /verify activates it
    const { createRazorpayOrder } = require('../utils/paymentGateway');
    const order = await createRazorpayOrder(plan.price, `cba_${Date.now().toString().slice(-8)}`);
    const ad = await CategoryBannerAd.create({ ...base, status: 'PendingPayment', razorpayOrderId: order.id });
    res.status(200).json({
      success: true, requiresPayment: true, adId: ad._id,
      razorpayOrderId: order.id, amount: order.amount, currency: order.currency, planName: plan.name
    });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, error: Object.values(err.errors).map(e => e.message).join(', ') });
    next(err);
  }
};

// POST /ads/:id/verify-payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const ad = isValidId(req.params.id) ? await CategoryBannerAd.findOne({ _id: req.params.id, seller: req.user.id }) : null;
    if (!ad) return res.status(404).json({ success: false, error: 'Banner request not found' });
    if (ad.status !== 'PendingPayment') return res.json({ success: true, data: ad }); // already processed
    if (ad.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, error: 'Payment does not match this banner request' });
    }
    const { verifyRazorpayPayment } = require('../utils/paymentGateway');
    if (!verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ success: false, error: 'Payment verification failed. Invalid signature.' });
    }
    ad.status = 'PendingReview';
    ad.transactionId = razorpay_payment_id;
    await ad.save();
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
};

// GET /my-ads
exports.myAds = async (req, res, next) => {
  try {
    await expireOldAds();
    const ads = await CategoryBannerAd.find({ seller: req.user.id, status: { $ne: 'PendingPayment' } })
      .populate('plan', 'name durationDays')
      .populate('categories', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (err) { next(err); }
};

// ───────────────────────── Admin: moderation ─────────────────────────
exports.adminListAds = async (req, res, next) => {
  try {
    await expireOldAds();
    const filter = { status: { $ne: 'PendingPayment' } };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    const ads = await CategoryBannerAd.find(filter)
      .populate('seller', 'fullName shopName email')
      .populate('plan', 'name durationDays')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .limit(300);
    res.json({ success: true, data: ads });
  } catch (err) { next(err); }
};

exports.reviewAd = async (req, res, next) => {
  try {
    const { decision, reason } = req.body; // 'approve' | 'reject'
    const ad = isValidId(req.params.id) ? await CategoryBannerAd.findById(req.params.id).populate('plan') : null;
    if (!ad) return res.status(404).json({ success: false, error: 'Banner request not found' });
    if (ad.status !== 'PendingReview') {
      return res.status(400).json({ success: false, error: `Only requests awaiting review can be ${decision === 'approve' ? 'approved' : 'rejected'}` });
    }

    if (decision === 'approve') {
      ad.status = 'Active';
      ad.startDate = new Date();
      ad.endDate = new Date(Date.now() + (ad.plan?.durationDays || 30) * DAY);
      ad.rejectionReason = '';
      await ad.save();
      return res.json({ success: true, data: ad });
    }

    if (decision === 'reject') {
      if (!String(reason || '').trim()) return res.status(400).json({ success: false, error: 'Please give a reason for rejection' });
      ad.status = 'Rejected';
      ad.rejectionReason = String(reason).trim().slice(0, 300);
      // Full refund to the seller's wallet (works for both Wallet and Online payments)
      if (!ad.refunded) {
        const wallet = (await SellerWallet.findOne({ seller: ad.seller })) || (await SellerWallet.create({ seller: ad.seller }));
        wallet.withdrawableBalance += ad.amountPaid;
        wallet.transactions.push({
          type: 'manual_adjustment', amount: ad.amountPaid, description: 'Refund: category banner request rejected',
          referenceId: ad._id, balanceAfter: wallet.withdrawableBalance, status: 'cleared'
        });
        await wallet.save();
        ad.refunded = true;
      }
      await ad.save();
      return res.json({ success: true, data: ad });
    }

    res.status(400).json({ success: false, error: 'decision must be approve or reject' });
  } catch (err) { next(err); }
};

// Admin can take a live banner down early (no refund)
exports.endAd = async (req, res, next) => {
  try {
    const ad = isValidId(req.params.id) ? await CategoryBannerAd.findById(req.params.id) : null;
    if (!ad) return res.status(404).json({ success: false, error: 'Banner not found' });
    if (ad.status !== 'Active') return res.status(400).json({ success: false, error: 'Banner is not live' });
    ad.status = 'Expired';
    ad.endDate = new Date();
    await ad.save();
    res.json({ success: true, data: ad });
  } catch (err) { next(err); }
};

// ───────────────────────── Public ─────────────────────────
const expireOldAds = () =>
  CategoryBannerAd.updateMany({ status: 'Active', endDate: { $lte: new Date() } }, { $set: { status: 'Expired' } });

// GET /public?category=<id>  -> live banners for that category page
exports.publicBanners = async (req, res, next) => {
  try {
    if (!isValidId(req.query.category)) return res.json({ success: true, data: [] });
    const ads = await CategoryBannerAd.find({
      status: 'Active', categories: req.query.category, startDate: { $lte: new Date() }, endDate: { $gt: new Date() }
    }).select('media altText linkUrl').sort({ startDate: 1 }).limit(10).lean();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, data: ads });
  } catch (err) { next(err); }
};

// POST /:id/track  { event: 'impression' | 'click' }
exports.track = async (req, res) => {
  try {
    const field = req.body.event === 'click' ? 'clicks' : req.body.event === 'impression' ? 'impressions' : null;
    if (field && isValidId(req.params.id)) {
      await CategoryBannerAd.updateOne({ _id: req.params.id, status: 'Active' }, { $inc: { [field]: 1 } });
    }
  } catch (e) { /* tracking must never break the page */ }
  res.status(204).end();
};
