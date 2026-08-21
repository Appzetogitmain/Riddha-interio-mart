const SampleRequest = require('../models/SampleRequest');
const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const { SAMPLE_STATUS } = require('../utils/rfqStateMachine');

/**
 * Requirement A §2.2 / §2.5 — sample eligibility and the admin-configurable
 * rules engine.
 *
 * Rules, in the order they are applied:
 *   1. Only products flagged `sampleAvailable` in an eligible category qualify.
 *   2. N free samples per customer per rolling month (default 3).
 *   3. Beyond the free quota a fee is charged, refundable against the first order.
 *   4. Auto-decline when the customer is sitting on too many delivered samples
 *      with no feedback.
 *   5. Verified contractor/enterpriser accounts are auto-approved.
 */

/** Interior materials that are genuinely bought by touch. */
const SAMPLE_ELIGIBLE_CATEGORIES = [
  'marble',
  'granite',
  'tiles',
  'laminates',
  'laminate',
  'veneer',
  'veneers',
  'fabric',
  'fabrics',
  'wallpaper',
  'wallpapers',
  'flooring',
  'paint',
  'paints',
  'acrylic',
  'solid surface',
  'hardware'
];

const DEFAULT_RULES = {
  freeSamplesPerMonth: 3,
  defaultSampleCharge: 250,
  refundChargeAgainstFirstOrder: true,
  maxPendingFeedbackSamples: 3,
  autoApproveVerifiedContractors: true,
  feedbackFollowUpDays: 3,
  maxItemsPerRequest: 5
};

const loadRules = async () => {
  try {
    const settings = await SystemSettings.findOne().lean();
    return { ...DEFAULT_RULES, ...((settings && settings.sampleRules) || {}) };
  } catch (err) {
    console.error('[SAMPLE RULES] falling back to defaults:', err.message);
    return { ...DEFAULT_RULES };
  }
};

/**
 * True when a category name (or subcategory / product name) belongs to the
 * sample programme. Matching is substring-based so "Vitrified Tiles" and
 * "Wooden Flooring" both qualify.
 */
const isSampleEligibleCategory = (...names) => {
  const haystack = names.filter(Boolean).join(' ').toLowerCase();
  if (!haystack) return false;
  return SAMPLE_ELIGIBLE_CATEGORIES.some((c) => haystack.includes(c));
};

const startOfCurrentMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
};

class SampleRulesService {
  loadRules() {
    return loadRules();
  }

  /**
   * How many free samples this customer has left, and whether they are blocked.
   * @returns {{ freeLimit, usedThisMonth, freeRemaining, pendingFeedbackCount,
   *             blocked, blockReason, chargePerRequest, autoApprove, rules }}
   */
  async checkEligibility(userId, { rules } = {}) {
    const cfg = rules || (await loadRules());

    const monthStart = startOfCurrentMonth();

    const [usedThisMonth, pendingFeedbackCount, user] = await Promise.all([
      // A declined request never consumes quota.
      SampleRequest.countDocuments({
        customerId: userId,
        freeQuotaUsed: true,
        status: { $ne: SAMPLE_STATUS.DECLINED },
        createdAt: { $gte: monthStart }
      }),
      SampleRequest.countDocuments({
        customerId: userId,
        status: SAMPLE_STATUS.DELIVERED,
        'feedback.verdict': null
      }),
      User.findById(userId).select('userType businessDetails').lean()
    ]);

    const freeRemaining = Math.max(0, cfg.freeSamplesPerMonth - usedThisMonth);

    const isVerifiedContractor = !!(
      user
      && user.userType === 'enterpriser'
      && user.businessDetails
      && user.businessDetails.isVerified
    );

    const blocked = pendingFeedbackCount >= cfg.maxPendingFeedbackSamples;

    return {
      freeLimit: cfg.freeSamplesPerMonth,
      usedThisMonth,
      freeRemaining,
      pendingFeedbackCount,
      blocked,
      blockReason: blocked
        ? `You have ${pendingFeedbackCount} delivered samples awaiting your feedback. Please share feedback before requesting more.`
        : '',
      chargeApplies: freeRemaining === 0,
      chargePerRequest: freeRemaining === 0 ? cfg.defaultSampleCharge : 0,
      isVerifiedContractor,
      autoApprove: cfg.autoApproveVerifiedContractors && isVerifiedContractor,
      chargeRefundable: cfg.refundChargeAgainstFirstOrder,
      maxItemsPerRequest: cfg.maxItemsPerRequest,
      rules: cfg
    };
  }

  /**
   * Price a request and decide its opening status.
   *
   * The fee is charged per *request*, not per item, using each product's own
   * `sampleCharge` when set and the configured default otherwise.
   */
  async evaluateRequest(userId, products = [], { rules } = {}) {
    const cfg = rules || (await loadRules());
    const eligibility = await this.checkEligibility(userId, { rules: cfg });

    if (eligibility.blocked) {
      return {
        allowed: false,
        declineReason: eligibility.blockReason,
        status: SAMPLE_STATUS.DECLINED,
        chargeAmount: 0,
        freeQuotaUsed: false,
        autoApproved: false,
        eligibility
      };
    }

    let chargeAmount = 0;
    let freeQuotaUsed = true;

    if (eligibility.freeRemaining === 0) {
      freeQuotaUsed = false;
      // Highest per-product charge in the basket, falling back to the default.
      const perProduct = products.map((p) => (p && p.sampleCharge > 0 ? p.sampleCharge : cfg.defaultSampleCharge));
      chargeAmount = perProduct.length > 0 ? Math.max(...perProduct) : cfg.defaultSampleCharge;
    }

    return {
      allowed: true,
      declineReason: '',
      status: eligibility.autoApprove ? SAMPLE_STATUS.APPROVED : SAMPLE_STATUS.REQUESTED,
      autoApproved: eligibility.autoApprove,
      chargeAmount,
      chargeRefundable: cfg.refundChargeAgainstFirstOrder && chargeAmount > 0,
      freeQuotaUsed,
      eligibility
    };
  }

  /**
   * Validate the products in a sample request: they must exist, be live, be
   * flagged `sampleAvailable`, and sit in a sample-eligible category.
   * @returns {{ ok: boolean, errors: string[], products: object[] }}
   */
  validateProducts(products = [], requestedIds = []) {
    const errors = [];
    const byId = new Map(products.map((p) => [String(p._id), p]));

    for (const id of requestedIds) {
      const product = byId.get(String(id));
      if (!product) {
        errors.push(`Product ${id} was not found.`);
        continue;
      }
      if (product.isActive === false || product.isApproved === false) {
        errors.push(`"${product.name}" is not currently available.`);
        continue;
      }
      if (!product.sampleAvailable) {
        errors.push(`"${product.name}" is not part of the sample programme.`);
        continue;
      }
      const categoryName = product.category && product.category.name ? product.category.name : '';
      if (!isSampleEligibleCategory(categoryName, product.material, product.name)) {
        errors.push(`Samples are not offered for the "${categoryName || 'selected'}" category.`);
      }
    }

    return { ok: errors.length === 0, errors, products };
  }
}

const service = new SampleRulesService();
service.SAMPLE_ELIGIBLE_CATEGORIES = SAMPLE_ELIGIBLE_CATEGORIES;
service.isSampleEligibleCategory = isSampleEligibleCategory;
service.DEFAULT_RULES = DEFAULT_RULES;

module.exports = service;
