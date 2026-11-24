const mongoose = require('mongoose');
const Product = require('../models/Product');
const SystemSettings = require('../models/SystemSettings');
const ProductDisplayAudit = require('../models/ProductDisplayAudit');
const displayService = require('../services/displayService');

const { POSITIONS, PERIODS, isHex } = displayService;
const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const BADGE_TEXT = /^[A-Za-z0-9 &!+\-]{1,20}$/;

const OVERRIDE_DEFAULTS = {
  bestseller: 'auto',
  rating: { enabled: false, value: null },
  reviewCount: { enabled: false, value: null },
  hideRating: false,
  badge: { enabled: true, useCustom: false, text: null, bgColor: null, textColor: null, position: null }
};

// flatten {a:{b:1}} -> {'a.b':1}
const flatten = (obj, prefix = '', out = {}) => {
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) flatten(v, key, out);
    else out[key] = v === undefined ? null : v;
  });
  return out;
};

const plain = (doc) => JSON.parse(JSON.stringify(doc || {}));
const who = (req) => ({ adminId: req.user._id, adminName: req.user.fullName || req.user.email || 'Super Admin', ipAddress: req.ip || '' });
const diff = (before, after) => {
  const a = flatten(before), b = flatten(after);
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter(k => JSON.stringify(a[k] ?? null) !== JSON.stringify(b[k] ?? null))
    .map(k => ({ field: k, from: a[k] ?? null, to: b[k] ?? null }));
};

/** Validate a (partial) overrides payload. Returns { value, error }. */
const parseOverrides = (body) => {
  const out = {};
  if (body.bestseller !== undefined) {
    if (!['auto', 'on', 'off'].includes(body.bestseller)) return { error: 'bestseller must be auto, on or off' };
    out.bestseller = body.bestseller;
  }
  if (body.hideRating !== undefined) out.hideRating = !!body.hideRating;

  if (body.rating !== undefined) {
    const enabled = !!body.rating.enabled;
    const value = body.rating.value === '' || body.rating.value == null ? null : Number(body.rating.value);
    if (enabled && (value === null || Number.isNaN(value) || value < 0 || value > 5)) return { error: 'Displayed rating must be a number from 0 to 5' };
    out.rating = { enabled, value: enabled ? Math.round(value * 10) / 10 : (value ?? null) };
  }
  if (body.reviewCount !== undefined) {
    const enabled = !!body.reviewCount.enabled;
    const value = body.reviewCount.value === '' || body.reviewCount.value == null ? null : Number(body.reviewCount.value);
    if (enabled && (value === null || !Number.isInteger(value) || value < 0 || value > 1000000)) return { error: 'Displayed review count must be a whole number (0 or more)' };
    out.reviewCount = { enabled, value };
  }
  if (body.badge !== undefined) {
    const b = body.badge;
    const badge = {};
    if (b.enabled !== undefined) badge.enabled = !!b.enabled;
    if (b.useCustom !== undefined) badge.useCustom = !!b.useCustom;
    if (b.text !== undefined && b.text !== null && b.text !== '') {
      if (!BADGE_TEXT.test(String(b.text).trim())) return { error: 'Badge text: up to 20 letters, numbers, spaces or & ! + -' };
      badge.text = String(b.text).trim().toUpperCase();
    }
    for (const f of ['bgColor', 'textColor']) {
      if (b[f] !== undefined && b[f] !== null && b[f] !== '') {
        if (!isHex(b[f])) return { error: `${f === 'bgColor' ? 'Background' : 'Text'} colour must look like #RRGGBB` };
        badge[f] = b[f].toUpperCase();
      }
    }
    if (b.position !== undefined && b.position !== null && b.position !== '') {
      if (!POSITIONS.includes(b.position)) return { error: `Badge position must be one of: ${POSITIONS.join(', ')}` };
      badge.position = b.position;
    }
    out.badge = badge;
  }
  return { value: out };
};

// ── Public ──────────────────────────────────────────────────────────────────
exports.publicConfig = async (req, res, next) => {
  try {
    const config = await displayService.getPublicConfig();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
};

// ── Per-product overrides ───────────────────────────────────────────────────
exports.getProductOverrides = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid product id' });
    const product = await Product.findById(req.params.id).select('name averageRating totalReviews displayOverrides').lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const [config, audit] = await Promise.all([
      displayService.getPublicConfig(),
      ProductDisplayAudit.find({ product: product._id }).sort({ createdAt: -1 }).limit(15).lean()
    ]);
    res.json({
      success: true,
      data: {
        actual: { averageRating: product.averageRating || 0, totalReviews: product.totalReviews || 0 },
        overrides: { ...OVERRIDE_DEFAULTS, ...plain(product.displayOverrides) },
        effective: displayService.resolveDisplay(product, config),
        defaults: config.badge,
        audit
      }
    });
  } catch (err) { next(err); }
};

exports.updateProductOverrides = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid product id' });
    const { value, error } = parseOverrides(req.body || {});
    if (error) return res.status(400).json({ success: false, error });
    const product = await Product.findById(req.params.id).select('name displayOverrides');
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const before = plain(product.displayOverrides);
    Object.entries(flatten(value)).forEach(([path, v]) => product.set(`displayOverrides.${path}`, v));
    await product.save({ validateModifiedOnly: true });
    const after = plain(product.displayOverrides);

    const changes = diff(before, after);
    if (changes.length) {
      await ProductDisplayAudit.create({ product: product._id, productName: product.name, action: 'override_update', changes, ...who(req) });
    }
    displayService.invalidate();
    res.json({ success: true, data: { overrides: { ...OVERRIDE_DEFAULTS, ...after }, changed: changes.length } });
  } catch (err) { next(err); }
};

exports.resetProductOverrides = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid product id' });
    const product = await Product.findById(req.params.id).select('name displayOverrides');
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const before = plain(product.displayOverrides);
    product.set('displayOverrides', undefined);
    await product.save({ validateModifiedOnly: true });
    const changes = diff({ ...OVERRIDE_DEFAULTS, ...before }, OVERRIDE_DEFAULTS).filter(c => JSON.stringify(c.from) !== JSON.stringify(c.to));
    await ProductDisplayAudit.create({ product: product._id, productName: product.name, action: 'override_reset', changes, ...who(req) });
    displayService.invalidate();
    res.json({ success: true, data: { overrides: OVERRIDE_DEFAULTS } });
  } catch (err) { next(err); }
};

// ── Global settings ─────────────────────────────────────────────────────────
exports.getSettings = async (req, res, next) => {
  try {
    res.json({ success: true, data: await displayService.getSettings() });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const current = await displayService.getSettings();
    const next_ = JSON.parse(JSON.stringify(current));
    const { ratingSettings: rs, bestsellerSettings: bs } = req.body || {};

    if (rs) {
      ['ratingsEnabled', 'reviewsEnabled', 'autoRatingEnabled'].forEach(k => { if (rs[k] !== undefined) next_.ratingSettings[k] = !!rs[k]; });
      if (rs.reviewApproval !== undefined) {
        if (!['manual', 'auto'].includes(rs.reviewApproval)) return res.status(400).json({ success: false, error: 'reviewApproval must be manual or auto' });
        next_.ratingSettings.reviewApproval = rs.reviewApproval;
      }
    }
    if (bs) {
      if (bs.autoEnabled !== undefined) next_.bestsellerSettings.autoEnabled = !!bs.autoEnabled;
      if (bs.periodDays !== undefined) {
        if (!PERIODS.includes(Number(bs.periodDays))) return res.status(400).json({ success: false, error: 'Period must be 7, 30 or 90 days' });
        next_.bestsellerSettings.periodDays = Number(bs.periodDays);
      }
      if (bs.minSales !== undefined) {
        const n = Number(bs.minSales);
        if (!Number.isInteger(n) || n < 0 || n > 100000) return res.status(400).json({ success: false, error: 'Minimum sales must be a whole number (0 or more)' });
        next_.bestsellerSettings.minSales = n;
      }
      if (bs.maxProducts !== undefined) {
        const n = Number(bs.maxProducts);
        if (!Number.isInteger(n) || n < 1 || n > 100) return res.status(400).json({ success: false, error: 'Maximum bestsellers must be between 1 and 100' });
        next_.bestsellerSettings.maxProducts = n;
      }
      if (bs.badge) {
        const b = bs.badge;
        if (b.text !== undefined) {
          if (!BADGE_TEXT.test(String(b.text).trim())) return res.status(400).json({ success: false, error: 'Badge text: up to 20 letters, numbers, spaces or & ! + -' });
          next_.bestsellerSettings.badge.text = String(b.text).trim().toUpperCase();
        }
        for (const f of ['bgColor', 'textColor']) {
          if (b[f] !== undefined) {
            if (!isHex(b[f])) return res.status(400).json({ success: false, error: 'Colours must look like #RRGGBB' });
            next_.bestsellerSettings.badge[f] = b[f].toUpperCase();
          }
        }
        if (b.position !== undefined) {
          if (!POSITIONS.includes(b.position)) return res.status(400).json({ success: false, error: 'Invalid badge position' });
          next_.bestsellerSettings.badge.position = b.position;
        }
      }
    }

    const doc = (await SystemSettings.findOne()) || new SystemSettings();
    doc.set('ratingSettings', next_.ratingSettings);
    doc.set('bestsellerSettings', next_.bestsellerSettings);
    await doc.save();

    const changes = diff(current, next_);
    if (changes.length) await ProductDisplayAudit.create({ product: null, action: 'settings_update', changes, ...who(req) });
    displayService.invalidate();
    res.json({ success: true, data: await displayService.getSettings() });
  } catch (err) { next(err); }
};

// ── Preview of who is a bestseller right now ────────────────────────────────
exports.bestsellerPreview = async (req, res, next) => {
  try {
    const [settings, set] = await Promise.all([displayService.getSettings(), displayService.getBestsellerSet()]);
    const products = await Product.find({ _id: { $in: set.ids } }).select('name images displayOverrides.bestseller').lean();
    const byId = new Map(products.map(p => [String(p._id), p]));
    const list = set.ids.map(id => {
      const p = byId.get(id);
      return p && { _id: id, name: p.name, image: p.images?.[0], units: set.units[id] || 0, source: p.displayOverrides?.bestseller === 'on' ? 'manual' : 'automatic' };
    }).filter(Boolean);
    res.json({ success: true, data: { settings: settings.bestsellerSettings, generatedAt: set.generatedAt, products: list } });
  } catch (err) { next(err); }
};

exports.auditLog = async (req, res, next) => {
  try {
    const filter = isId(req.query.productId) ? { product: req.query.productId } : {};
    const logs = await ProductDisplayAudit.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};
