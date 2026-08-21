const mongoose = require('mongoose');
const Product = require('../models/Product');
const SystemSettings = require('../models/SystemSettings');

/**
 * Requirement A §1.4 — RFQ routing and SLA.
 *
 * Routing precedence:
 *   1. the seller(s) who own the requested product(s);
 *   2. when the RFQ spans several sellers or matches nothing directly, every
 *      seller carrying the requested categories — competitive quoting;
 *   3. the Riddha internal team when no seller matches, or when the estimated
 *      RFQ value clears the internal-review threshold.
 */

const DEFAULT_RULES = {
  slaResponseHours: 24,
  expiryDays: 30,
  internalReviewValueThreshold: 500000,
  maxSellersPerRFQ: 5,
  competitiveQuotingEnabled: true
};

const loadRules = async () => {
  try {
    const settings = await SystemSettings.findOne().lean();
    return { ...DEFAULT_RULES, ...((settings && settings.rfqRules) || {}) };
  } catch (err) {
    console.error('[RFQ ROUTING] falling back to default rules:', err.message);
    return { ...DEFAULT_RULES };
  }
};

const idsEqual = (a, b) => String(a) === String(b);

class RFQRoutingService {
  /**
   * Best-effort value of the RFQ, used by the internal-review threshold rule.
   * Lines without a resolved product contribute nothing rather than a guess.
   */
  async estimateValue(lineItems = []) {
    const productIds = lineItems.map((l) => l.productId).filter(Boolean);
    if (productIds.length === 0) return 0;

    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id price b2bPrice')
      .lean();
    const priceById = new Map(products.map((p) => [String(p._id), p.b2bPrice || p.price || 0]));

    return lineItems.reduce((total, line) => {
      if (!line.productId) return total;
      const unitPrice = priceById.get(String(line.productId)) || 0;
      return total + unitPrice * (Number(line.quantity) || 0);
    }, 0);
  }

  /**
   * Resolve the seller set for an RFQ.
   * @returns {{ sellerIds: string[], routeToAdmin: boolean, reason: string, competitive: boolean }}
   */
  async resolveTargets(lineItems = [], { estimatedValue = 0, rules } = {}) {
    const cfg = rules || (await loadRules());

    const productIds = lineItems.map((l) => l.productId).filter(Boolean);

    // 1. Direct product owners. Admin-owned products (sellerType 'Admin') are
    //    not sellers, so they route to the internal team instead.
    let owners = [];
    let hasAdminOwnedProduct = false;
    let categoryIds = [];

    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id seller sellerType category')
        .lean();

      categoryIds = [...new Set(products.map((p) => String(p.category)).filter(Boolean))];
      hasAdminOwnedProduct = products.some((p) => p.sellerType === 'Admin');
      owners = [...new Set(
        products
          .filter((p) => p.sellerType === 'Seller' && p.seller)
          .map((p) => String(p.seller))
      )];
    }

    const overThreshold = estimatedValue > cfg.internalReviewValueThreshold;

    // Single seller owns everything requested: route straight to them.
    if (owners.length === 1 && productIds.length === lineItems.length && !hasAdminOwnedProduct) {
      return {
        sellerIds: owners,
        routeToAdmin: overThreshold,
        competitive: false,
        reason: overThreshold
          ? 'Single seller owns all requested products; also copied to the Riddha team (value above threshold).'
          : 'Single seller owns all requested products.'
      };
    }

    // 2. Competitive quoting across the sellers carrying these categories.
    const competitiveSellers = cfg.competitiveQuotingEnabled && categoryIds.length > 0
      ? await this.findSellersForCategories(categoryIds, cfg.maxSellersPerRFQ)
      : [];

    const sellerIds = [...new Set([...owners, ...competitiveSellers])].slice(0, cfg.maxSellersPerRFQ);

    // 3. Internal team as the fallback / high-value copy.
    if (sellerIds.length === 0) {
      return {
        sellerIds: [],
        routeToAdmin: true,
        competitive: false,
        reason: 'No seller carries the requested products or categories; routed to the Riddha team.'
      };
    }

    return {
      sellerIds,
      routeToAdmin: overThreshold || hasAdminOwnedProduct,
      competitive: sellerIds.length > 1,
      reason: sellerIds.length > 1
        ? `Competitive quoting across ${sellerIds.length} sellers carrying the requested categories.`
        : 'Routed to the seller carrying the requested category.'
    };
  }

  /** Sellers with at least one live, approved product in any of these categories. */
  async findSellersForCategories(categoryIds, limit = 5) {
    if (!categoryIds || categoryIds.length === 0) return [];

    const rows = await Product.aggregate([
      {
        $match: {
          category: { $in: categoryIds.map((id) => new mongoose.Types.ObjectId(String(id))) },
          sellerType: 'Seller',
          isActive: true,
          isApproved: true
        }
      },
      { $group: { _id: '$seller', productCount: { $sum: 1 } } },
      // Broadest catalogue first — the seller most likely to cover the whole RFQ.
      { $sort: { productCount: -1 } },
      { $limit: limit }
    ]);

    return rows.map((r) => String(r._id));
  }

  /**
   * Attach routing, SLA and expiry to an unsaved (or existing) RFQ document.
   * Sellers already on `routedTo` are preserved so re-routing is additive.
   */
  async applyRouting(rfq, { rules } = {}) {
    const cfg = rules || (await loadRules());

    const estimatedValue = await this.estimateValue(rfq.lineItems || []);
    const targets = await this.resolveTargets(rfq.lineItems || [], { estimatedValue, rules: cfg });

    const existing = new Set((rfq.routedTo || []).map((r) => String(r.sellerId)));
    const added = targets.sellerIds.filter((id) => !existing.has(String(id)));

    rfq.estimatedValue = estimatedValue;
    rfq.routedTo = [
      ...(rfq.routedTo || []),
      ...added.map((sellerId) => ({ sellerId, routedAt: new Date() }))
    ];
    rfq.routedToAdmin = rfq.routedToAdmin || targets.routeToAdmin;

    // The SLA clock starts at submission and is never pushed back by re-routing.
    if (!rfq.slaDueAt) {
      rfq.slaDueAt = new Date(Date.now() + cfg.slaResponseHours * 60 * 60 * 1000);
    }
    if (!rfq.expiresAt) {
      rfq.expiresAt = new Date(Date.now() + cfg.expiryDays * 24 * 60 * 60 * 1000);
    }

    return {
      ...targets,
      estimatedValue,
      newlyRoutedSellerIds: added,
      slaDueAt: rfq.slaDueAt,
      expiresAt: rfq.expiresAt
    };
  }

  /** True when this seller was routed the RFQ (used for access control). */
  isRoutedToSeller(rfq, sellerId) {
    return (rfq.routedTo || []).some((r) => idsEqual(r.sellerId, sellerId));
  }

  /** Mark a seller's response, which stops their side of the SLA clock. */
  markResponded(rfq, sellerId, quotationId = null) {
    const entry = (rfq.routedTo || []).find((r) => idsEqual(r.sellerId, sellerId));
    if (entry) {
      entry.respondedAt = new Date();
      if (quotationId) entry.quotationId = quotationId;
    }
    if (!rfq.firstResponseAt) rfq.firstResponseAt = new Date();
    return entry;
  }

  loadRules() {
    return loadRules();
  }
}

module.exports = new RFQRoutingService();
module.exports.DEFAULT_RULES = DEFAULT_RULES;
