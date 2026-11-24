const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SystemSettings = require('../models/SystemSettings');
const cacheService = require('./cacheService');

const SETTINGS_KEY = 'display:settings';
const BESTSELLER_KEY = 'bestsellers:set';
const CONFIG_KEY = 'bestsellers:public-config';
const BESTSELLER_TTL = 15 * 60; // seconds

const POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const PERIODS = [7, 30, 90];

const DEFAULTS = {
  ratingSettings: {
    ratingsEnabled: true,      // master switch: ratings + reviews feature
    reviewsEnabled: true,      // customers may write reviews
    autoRatingEnabled: true,   // show the rating calculated from approved reviews
    reviewApproval: 'manual'   // 'manual' = admin approves first, 'auto' = published immediately
  },
  bestsellerSettings: {
    autoEnabled: true,
    periodDays: 30,
    minSales: 5,
    maxProducts: 20,
    badge: { text: 'BESTSELLER', bgColor: '#E11D48', textColor: '#FFFFFF', position: 'bottom-left' }
  }
};

const merge = (stored = {}) => ({
  ratingSettings: { ...DEFAULTS.ratingSettings, ...(stored.ratingSettings || {}) },
  bestsellerSettings: {
    ...DEFAULTS.bestsellerSettings,
    ...(stored.bestsellerSettings || {}),
    badge: { ...DEFAULTS.bestsellerSettings.badge, ...((stored.bestsellerSettings || {}).badge || {}) }
  }
});

const getSettings = async () => {
  const cached = cacheService.get(SETTINGS_KEY);
  if (cached) return cached;
  const doc = await SystemSettings.findOne().select('ratingSettings bestsellerSettings').lean();
  const settings = merge(doc || {});
  cacheService.set(SETTINGS_KEY, settings, 60);
  return settings;
};

const invalidate = () => {
  cacheService.del(SETTINGS_KEY);
  cacheService.delPattern('bestsellers:*');
};

// Orders that must NOT count as sales
const EXCLUDED_ORDER_STATUS = ['Cancelled', 'Returned'];
const EXCLUDED_PAYMENT = ['refunded', 'failed'];
const EXCLUDED_REFUND = ['Refunded to Wallet', 'Refunded to Source'];
const EXCLUDED_ITEM_RETURN = ['Approved', 'Received', 'Completed']; // item already being / been returned

/** Units sold + revenue per product for the last `periodDays`, excluding cancelled / returned / refunded. */
const salesByProduct = async (periodDays) => {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  return Order.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        status: { $nin: EXCLUDED_ORDER_STATUS },
        paymentStatus: { $nin: EXCLUDED_PAYMENT },
        refundStatus: { $nin: EXCLUDED_REFUND }
      }
    },
    { $unwind: '$orderItems' },
    { $match: { 'orderItems.returnStatus': { $nin: EXCLUDED_ITEM_RETURN } } },
    {
      $group: {
        _id: '$orderItems.product',
        units: { $sum: '$orderItems.quantity' },
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
      }
    }
  ]);
};

/**
 * The final bestseller set (cached).
 *   - override 'on'  -> always a bestseller
 *   - override 'off' -> never
 *   - override 'auto'-> bestseller if automatic mode is on, units >= minSales, and it ranks within maxProducts
 * Manual 'on' products take their slots first, so admin picks always win over automatic ones.
 */
const getBestsellerSet = async () => {
  const cached = cacheService.get(BESTSELLER_KEY);
  if (cached) return cached;

  const { bestsellerSettings: bs } = await getSettings();

  const manualOn = await Product.find({ 'displayOverrides.bestseller': 'on' }).select('_id').lean();
  const manualOff = new Set((await Product.find({ 'displayOverrides.bestseller': 'off' }).select('_id').lean()).map(p => String(p._id)));

  const ids = [];
  const units = {};
  manualOn.forEach(p => ids.push(String(p._id)));

  let ranked = [];
  if (bs.autoEnabled) {
    const sales = await salesByProduct(bs.periodDays);
    sales.forEach(s => { units[String(s._id)] = s.units; });
    const eligible = sales
      .filter(s => s.units >= bs.minSales && !manualOff.has(String(s._id)))
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue);
    // only live, approved products can be badged
    const live = await Product.find({ _id: { $in: eligible.map(e => e._id) }, isActive: true, isApproved: true }).select('_id').lean();
    const liveIds = new Set(live.map(p => String(p._id)));
    ranked = eligible.filter(e => liveIds.has(String(e._id)));
    for (const r of ranked) {
      if (ids.length >= bs.maxProducts) break;
      if (!ids.includes(String(r._id))) ids.push(String(r._id));
    }
  }

  const result = { ids, units, generatedAt: new Date().toISOString() };
  cacheService.set(BESTSELLER_KEY, result, BESTSELLER_TTL);
  return result;
};

const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v);

/**
 * Public config the storefront merges with each product's REAL rating / review count.
 * Only products that have overrides appear in `overrides`, so it stays tiny.
 */
const getPublicConfig = async () => {
  const cached = cacheService.get(CONFIG_KEY);
  if (cached) return cached;

  const { ratingSettings: rs, bestsellerSettings: bs } = await getSettings();
  const set = await getBestsellerSet();

  const overridden = await Product.find({
    $or: [
      { 'displayOverrides.rating.enabled': true },
      { 'displayOverrides.reviewCount.enabled': true },
      { 'displayOverrides.hideRating': true },
      { 'displayOverrides.badge.enabled': false },
      { 'displayOverrides.badge.useCustom': true }
    ]
  }).select('displayOverrides').lean();

  const overrides = {};
  overridden.forEach(p => {
    const o = p.displayOverrides || {};
    overrides[String(p._id)] = {
      rating: o.rating?.enabled ? o.rating.value : null,
      reviewCount: o.reviewCount?.enabled ? o.reviewCount.value : null,
      hideRating: !!o.hideRating,
      badgeEnabled: o.badge?.enabled !== false,
      badge: o.badge?.useCustom ? { text: o.badge.text, bgColor: o.badge.bgColor, textColor: o.badge.textColor, position: o.badge.position } : null
    };
  });

  const config = {
    ratingsEnabled: rs.ratingsEnabled,
    autoRatingEnabled: rs.autoRatingEnabled,
    badge: bs.badge,
    bestsellerIds: set.ids,
    overrides
  };
  cacheService.set(CONFIG_KEY, config, 5 * 60);
  return config;
};

/**
 * What to show for one product. `product` carries the REAL averageRating / totalReviews; overrides never
 * touch those fields. Mirrors frontend/src/shared/utils/productDisplay.js.
 */
const resolveDisplay = (product, config) => {
  const o = config.overrides[String(product._id)] || {};
  const realRating = product.averageRating || 0;
  const realCount = product.totalReviews || 0;

  let rating = o.rating != null ? o.rating : (config.autoRatingEnabled ? realRating : 0);
  let reviewCount = o.reviewCount != null ? o.reviewCount : (config.autoRatingEnabled ? realCount : 0);
  const showRating = config.ratingsEnabled && !o.hideRating && rating > 0;

  const isBestseller = config.bestsellerIds.includes(String(product._id));
  const showBadge = isBestseller && o.badgeEnabled !== false;
  return {
    rating: showRating ? rating : 0,
    reviewCount: showRating ? reviewCount : 0,
    showRating,
    isBestseller,
    badge: showBadge ? { ...config.badge, ...(o.badge || {}) } : null
  };
};

module.exports = {
  DEFAULTS, POSITIONS, PERIODS, isHex, merge,
  getSettings, invalidate, salesByProduct, getBestsellerSet, getPublicConfig, resolveDisplay
};
