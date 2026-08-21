const mongoose = require('mongoose');
const SampleRequest = require('../models/SampleRequest');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
// Required so the `category` populate below always resolves, no matter which
// module registered its schema first.
require('../models/Category');

const sampleRules = require('../services/sampleRulesService');
const rfqAiService = require('../services/rfqAiService');
const notifier = require('../services/rfqNotifier');
const { generateSampleRequestNumber } = require('../utils/documentSequence');
const {
  SAMPLE_STATUS,
  applySampleTransition,
  nextSampleStatuses,
  InvalidTransitionError
} = require('../utils/rfqStateMachine');

const PURPOSES = ['personal', 'project', 'client_presentation', 'comparison'];
const VERDICTS = ['like', 'dislike', 'need_different_shade'];

const fail = (res, status, error) => res.status(status).json({ success: false, error });

const actorFrom = (req, note = '') => ({
  id: req.user._id,
  role: req.user.role === 'user' ? 'user' : req.user.role,
  note
});

/** Sellers whose products appear in this request. */
const sellersFor = async (sample) => {
  const products = await Product.find({ _id: { $in: sample.items.map((i) => i.productId) } })
    .select('seller sellerType')
    .lean();
  return [...new Set(products.filter((p) => p.sellerType === 'Seller').map((p) => String(p.seller)))];
};

/** Load a sample request and assert the caller may act on it. */
const loadAccessibleSample = async (req) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: { status: 400, message: 'Invalid sample request id.' } };
  }

  const sample = await SampleRequest.findById(id);
  if (!sample) return { error: { status: 404, message: 'Sample request not found.' } };

  const role = req.user.role;
  if (role === 'admin') return { sample, role };

  if (role === 'seller') {
    const sellerIds = await sellersFor(sample);
    if (!sellerIds.includes(String(req.user._id))) {
      return { error: { status: 403, message: 'This sample request does not include any of your products.' } };
    }
    return { sample, role };
  }

  if (String(sample.customerId) !== String(req.user._id)) {
    return { error: { status: 403, message: 'You do not have access to this sample request.' } };
  }
  return { sample, role: 'user' };
};

// -----------------------------------------------------------------------------
// 1. GET /api/samples/eligibility — free-sample quota for the current user
// -----------------------------------------------------------------------------

exports.getEligibility = async (req, res, next) => {
  try {
    const eligibility = await sampleRules.checkEligibility(req.user._id);
    res.status(200).json({ success: true, data: eligibility });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 2. POST /api/samples — create
// -----------------------------------------------------------------------------

exports.createSampleRequest = async (req, res, next) => {
  try {
    const { items = [], deliveryAddress = {}, purpose = 'personal', notes = '', companyName = '', gstin = '' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, 400, 'Select at least one product to sample.');
    }

    const rules = await sampleRules.loadRules();
    if (items.length > rules.maxItemsPerRequest) {
      return fail(res, 400, `A sample request is limited to ${rules.maxItemsPerRequest} products.`);
    }

    const invalidId = items.find((i) => !i || !mongoose.Types.ObjectId.isValid(i.productId));
    if (invalidId) return fail(res, 400, 'One of the selected products has an invalid id.');

    if (!/^\d{6}$/.test(String(deliveryAddress.pincode || '').trim())) {
      return fail(res, 400, 'A 6-digit delivery pincode is required.');
    }
    if (!String(deliveryAddress.fullAddress || '').trim()) {
      return fail(res, 400, 'A delivery address is required.');
    }
    if (!PURPOSES.includes(purpose)) {
      return fail(res, 400, `Purpose must be one of: ${PURPOSES.join(', ')}.`);
    }

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id name isActive isApproved sampleAvailable sampleCharge material category variants')
      .populate('category', 'name')
      .lean();

    const validation = sampleRules.validateProducts(products, productIds);
    if (!validation.ok) {
      return res.status(400).json({ success: false, error: validation.errors[0], errors: validation.errors });
    }

    const productById = new Map(products.map((p) => [String(p._id), p]));
    const decision = await sampleRules.evaluateRequest(req.user._id, products, { rules });

    if (!decision.allowed) {
      return res.status(429).json({
        success: false,
        error: decision.declineReason,
        data: { eligibility: decision.eligibility }
      });
    }

    const user = await User.findById(req.user._id).select('fullName name phone businessDetails').lean();
    const business = (user && user.businessDetails) || {};

    const sample = new SampleRequest({
      requestNumber: await generateSampleRequestNumber(),
      customerId: req.user._id,
      items: items.map((i) => {
        const product = productById.get(String(i.productId));
        return {
          productId: i.productId,
          productName: product.name,
          variantId: String(i.variantId || ''),
          shade: String(i.shade || ''),
          quantity: Math.max(1, Number(i.quantity) || 1),
          chargeAtRequest: product.sampleCharge || 0
        };
      }),
      deliveryAddress: {
        fullName: String(deliveryAddress.fullName || (user && (user.fullName || user.name)) || '').trim(),
        mobileNumber: String(deliveryAddress.mobileNumber || (user && user.phone) || '').trim(),
        pincode: String(deliveryAddress.pincode).trim(),
        city: String(deliveryAddress.city || '').trim(),
        state: String(deliveryAddress.state || '').trim(),
        fullAddress: String(deliveryAddress.fullAddress).trim(),
        landmark: String(deliveryAddress.landmark || '').trim()
      },
      companyName: String(companyName || business.shopName || '').trim(),
      gstin: String(gstin || business.gstNumber || '').trim(),
      purpose,
      notes: String(notes || '').trim(),
      status: decision.status,
      autoApproved: decision.autoApproved,
      chargeAmount: decision.chargeAmount,
      freeQuotaUsed: decision.freeQuotaUsed,
      statusHistory: [{
        status: SAMPLE_STATUS.REQUESTED,
        changedAt: new Date(),
        changedBy: req.user._id,
        changedByRole: 'user',
        note: 'Sample request submitted.'
      }]
    });

    if (decision.autoApproved) {
      sample.statusHistory.push({
        status: SAMPLE_STATUS.APPROVED,
        changedAt: new Date(),
        changedBy: null,
        changedByRole: 'system',
        note: 'Auto-approved: verified contractor account.'
      });
    }

    await sample.save();

    const sellerIds = await sellersFor(sample);
    notifier.sampleRequested(sample, { sellerIds })
      .catch((err) => console.error('[SAMPLE] request notification failed:', err.message));

    res.status(201).json({
      success: true,
      message: decision.autoApproved
        ? `Sample request ${sample.requestNumber} approved and queued for dispatch.`
        : `Sample request ${sample.requestNumber} submitted for approval.`,
      data: sample,
      billing: {
        chargeAmount: decision.chargeAmount,
        refundable: decision.chargeRefundable,
        freeSamplesRemaining: decision.eligibility.freeRemaining,
        note: decision.chargeAmount > 0
          ? `You have used your ${decision.eligibility.freeLimit} free samples this month. This request carries a Rs. ${decision.chargeAmount} fee, refundable against your first order.`
          : `Free sample — ${Math.max(0, decision.eligibility.freeRemaining - 1)} free request(s) left this month.`
      }
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 3. GET /api/samples — list (customer / seller / admin)
// -----------------------------------------------------------------------------

exports.getSampleRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const query = {};
    if (req.user.role === 'seller') {
      const sellerProducts = await Product.find({ seller: req.user._id, sellerType: 'Seller' })
        .select('_id')
        .lean();
      query['items.productId'] = { $in: sellerProducts.map((p) => p._id) };
    } else if (req.user.role !== 'admin') {
      query.customerId = req.user._id;
    }

    if (status) query.status = { $in: String(status).split(',').map((s) => s.trim()) };

    const [samples, total] = await Promise.all([
      SampleRequest.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('customerId', 'fullName name email phone')
        .lean(),
      SampleRequest.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: samples.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: samples
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 4. GET /api/samples/:id
// -----------------------------------------------------------------------------

exports.getSampleRequestById = async (req, res, next) => {
  try {
    const { sample, error } = await loadAccessibleSample(req);
    if (error) return fail(res, error.status, error.message);

    await sample.populate([
      { path: 'items.productId', select: 'name images price category material color' },
      { path: 'customerId', select: 'fullName name email phone' },
      { path: 'feedback.suggestedAlternates.productId', select: 'name images price' }
    ]);

    res.status(200).json({
      success: true,
      data: sample,
      allowedNextStatuses: nextSampleStatuses(sample.status)
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 5. Approve / decline
// -----------------------------------------------------------------------------

exports.approveSampleRequest = async (req, res, next) => {
  try {
    const { sample, error, role } = await loadAccessibleSample(req);
    if (error) return fail(res, error.status, error.message);
    if (role === 'user') return fail(res, 403, 'Only a seller or the Riddha team can approve a sample request.');

    applySampleTransition(sample, SAMPLE_STATUS.APPROVED, actorFrom(req, String(req.body.note || 'Approved.')));
    await sample.save();

    notifier.sampleStatusChanged(sample, {
      title: `Sample request ${sample.requestNumber} approved`,
      message: 'Your samples are approved and being prepared for dispatch.'
    }).catch((err) => console.error('[SAMPLE] approve notification failed:', err.message));

    res.status(200).json({ success: true, message: 'Sample request approved.', data: sample });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

exports.declineSampleRequest = async (req, res, next) => {
  try {
    const { sample, error, role } = await loadAccessibleSample(req);
    if (error) return fail(res, error.status, error.message);
    if (role === 'user') return fail(res, 403, 'Only a seller or the Riddha team can decline a sample request.');

    const reason = String(req.body.reason || '').trim();
    if (!reason) return fail(res, 400, 'A reason is required when declining a sample request.');

    applySampleTransition(sample, SAMPLE_STATUS.DECLINED, actorFrom(req, reason));
    sample.declineReason = reason;
    // A declined request must not burn the customer's monthly free quota.
    sample.freeQuotaUsed = false;
    await sample.save();

    notifier.sampleStatusChanged(sample, {
      title: `Sample request ${sample.requestNumber} declined`,
      message: reason
    }).catch((err) => console.error('[SAMPLE] decline notification failed:', err.message));

    res.status(200).json({ success: true, message: 'Sample request declined.', data: sample });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 6. POST /api/samples/:id/dispatch — mark dispatched + AWB
// -----------------------------------------------------------------------------

exports.dispatchSampleRequest = async (req, res, next) => {
  try {
    const { sample, error, role } = await loadAccessibleSample(req);
    if (error) return fail(res, error.status, error.message);
    if (role === 'user') return fail(res, 403, 'Only a seller or the Riddha team can dispatch samples.');

    const { awb = '', partnerName = '', trackingUrl = '', trackingOrderId = null } = req.body;
    if (!String(awb).trim()) return fail(res, 400, 'A courier AWB number is required to mark samples dispatched.');

    applySampleTransition(sample, SAMPLE_STATUS.DISPATCHED, actorFrom(req, `Dispatched via ${partnerName || 'courier'} (AWB ${awb}).`));
    sample.courier = {
      ...sample.courier,
      awb: String(awb).trim(),
      partnerName: String(partnerName || '').trim(),
      trackingUrl: String(trackingUrl || '').trim(),
      dispatchedAt: new Date()
    };
    // Requirement #13 — when a tracking order is supplied the sample rides the
    // normal live-tracking pipeline.
    if (trackingOrderId && mongoose.Types.ObjectId.isValid(trackingOrderId)) {
      sample.trackingOrderId = trackingOrderId;
    }
    await sample.save();

    notifier.sampleStatusChanged(sample, {
      title: `Samples dispatched — ${sample.requestNumber}`,
      message: `Your samples are on the way. AWB ${sample.courier.awb}${partnerName ? ` via ${partnerName}` : ''}.`,
      actionUrl: sample.trackingOrderId ? `/orders/${sample.trackingOrderId}/track` : `/samples/${sample._id}`
    }).catch((err) => console.error('[SAMPLE] dispatch notification failed:', err.message));

    res.status(200).json({ success: true, message: 'Samples marked dispatched.', data: sample });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 7. POST /api/samples/:id/deliver — mark delivered (starts the follow-up clock)
// -----------------------------------------------------------------------------

exports.markDelivered = async (req, res, next) => {
  try {
    const { sample, error, role } = await loadAccessibleSample(req);
    if (error) return fail(res, error.status, error.message);

    // The courier or the seller normally closes this out, but a customer
    // confirming receipt themselves is just as good a delivery signal.
    applySampleTransition(
      sample,
      SAMPLE_STATUS.DELIVERED,
      actorFrom(req, role === 'user' ? 'Delivery confirmed by the customer.' : 'Samples delivered.')
    );
    sample.courier.deliveredAt = new Date();
    await sample.save();

    notifier.sampleStatusChanged(sample, {
      title: `Samples delivered — ${sample.requestNumber}`,
      message: 'Your samples have been delivered. We will ask for your feedback in a few days.'
    }).catch((err) => console.error('[SAMPLE] deliver notification failed:', err.message));

    res.status(200).json({ success: true, message: 'Sample request marked delivered.', data: sample });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 8. POST /api/samples/:id/feedback
// -----------------------------------------------------------------------------

exports.submitFeedback = async (req, res, next) => {
  try {
    const { sample, error, role } = await loadAccessibleSample(req);
    if (error) return fail(res, error.status, error.message);
    if (role !== 'user') return fail(res, 403, 'Only the customer can leave sample feedback.');

    const verdict = String(req.body.verdict || '').trim();
    if (!VERDICTS.includes(verdict)) {
      return fail(res, 400, `Verdict must be one of: ${VERDICTS.join(', ')}.`);
    }

    applySampleTransition(sample, SAMPLE_STATUS.FEEDBACK_GIVEN, actorFrom(req, `Feedback: ${verdict}.`));
    sample.feedback.verdict = verdict;
    sample.feedback.comment = String(req.body.comment || '').trim();
    sample.feedback.givenAt = new Date();

    // "Need a different shade" -> surface the 3 closest catalogue alternates.
    let alternates = [];
    if (verdict === 'need_different_shade') {
      const sampled = await Product.findById(sample.items[0].productId)
        .select('name color material category subcategory')
        .lean();

      if (sampled) {
        const candidates = await Product.find({
          _id: { $ne: sampled._id },
          category: sampled.category,
          sampleAvailable: true,
          isActive: true,
          isApproved: true
        })
          .select('_id name color material')
          .limit(20)
          .lean();

        alternates = await rfqAiService.suggestShadeAlternates({ product: sampled, candidates }, req.user._id);
        sample.feedback.suggestedAlternates = alternates;
      }
    }

    await sample.save();

    // A "like" is the moment to push the buyer down the RFQ / project path.
    const nextSteps = verdict === 'like'
      ? [
        { label: 'Request a quote', action: 'rfq', productIds: sample.items.map((i) => i.productId) },
        { label: 'Add to a project', action: 'project', productIds: sample.items.map((i) => i.productId) }
      ]
      : [];

    res.status(200).json({
      success: true,
      message: 'Thanks for the feedback.',
      data: sample,
      nextSteps,
      alternates
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 9. POST /api/samples/:id/refund — credit the sample fee against an order
// -----------------------------------------------------------------------------

exports.refundSampleCharge = async (req, res, next) => {
  try {
    const { sample, error, role } = await loadAccessibleSample(req);
    if (error) return fail(res, error.status, error.message);
    if (role === 'user') return fail(res, 403, 'Only the Riddha team can process a sample-fee refund.');

    if (sample.chargeAmount <= 0) return fail(res, 400, 'No sample fee was charged on this request.');
    if (sample.chargeRefunded) return fail(res, 400, 'This sample fee has already been refunded.');

    const { orderId } = req.body;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return fail(res, 400, 'An orderId is required to credit the sample fee against.');
    }

    const order = await Order.findById(orderId).select('_id user').lean();
    if (!order) return fail(res, 404, 'Order not found.');
    if (String(order.user) !== String(sample.customerId)) {
      return fail(res, 400, 'That order belongs to a different customer.');
    }

    sample.chargeRefunded = true;
    sample.refundedAgainstOrderId = order._id;
    await sample.save();

    notifier.sampleStatusChanged(sample, {
      title: 'Sample fee credited',
      message: `Your Rs. ${sample.chargeAmount} sample fee has been credited against your order.`,
      actionUrl: `/orders/${order._id}/track`
    }).catch((err) => console.error('[SAMPLE] refund notification failed:', err.message));

    res.status(200).json({ success: true, message: 'Sample fee credited against the order.', data: sample });
  } catch (error) {
    next(error);
  }
};
