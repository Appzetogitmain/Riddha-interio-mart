const mongoose = require('mongoose');
const RFQ = require('../models/RFQ');
const RFQMessage = require('../models/RFQMessage');
const Product = require('../models/Product');
const Quotation = require('../models/Quotation');
const Order = require('../models/Order');
const Seller = require('../models/Seller');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');

const rfqAiService = require('../services/rfqAiService');
const routingService = require('../services/rfqRoutingService');
const notifier = require('../services/rfqNotifier');
const { cloudinary } = require('../config/cloudinary');
const { extractText } = require('../utils/rfqFileText');
const { calculateQuotationPricing, generateQuotationNumber } = require('../utils/quotationEngine');
const { generateRFQNumber } = require('../utils/documentSequence');
const {
  RFQ_STATUS,
  applyRFQTransition,
  isRFQCustomerEditable,
  nextRFQStatuses,
  InvalidTransitionError
} = require('../utils/rfqStateMachine');

const { RFQ_UNITS } = RFQ;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const fail = (res, status, error) => res.status(status).json({ success: false, error });

const actorFrom = (req, note = '') => ({
  id: req.user._id,
  role: req.user.role === 'user' ? 'user' : req.user.role,
  note
});

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Validate and normalise the incoming line items.
 * @returns {{ errors: string[], lineItems: object[] }}
 */
const normalizeLineItems = (raw) => {
  const errors = [];

  if (!Array.isArray(raw) || raw.length === 0) {
    return { errors: ['At least one product line is required.'], lineItems: [] };
  }
  if (raw.length > 50) {
    return { errors: ['An RFQ cannot contain more than 50 product lines.'], lineItems: [] };
  }

  const lineItems = raw.map((line, index) => {
    const position = index + 1;
    const description = String((line && line.productDescription) || '').trim();
    const quantity = Number(line && line.quantity);
    const unit = String((line && line.unit) || '').trim();

    if (!description) errors.push(`Line ${position}: a product description is required.`);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push(`Line ${position}: quantity must be a number greater than zero.`);
    if (!RFQ_UNITS.includes(unit)) errors.push(`Line ${position}: unit must be one of ${RFQ_UNITS.join(', ')}.`);
    if (line && line.productId && !mongoose.Types.ObjectId.isValid(line.productId)) {
      errors.push(`Line ${position}: productId is not a valid id.`);
    }

    return {
      productId: line && line.productId ? line.productId : null,
      productDescription: description,
      quantity,
      unit,
      size: String((line && line.size) || '').trim(),
      finish: String((line && line.finish) || '').trim(),
      brandPreference: String((line && line.brandPreference) || '').trim(),
      application: String((line && line.application) || '').trim(),
      matchConfidence: ['high', 'medium', 'low'].includes(line && line.matchConfidence) ? line.matchConfidence : 'high'
    };
  });

  return { errors, lineItems };
};

/** Load an RFQ and assert the caller may see it. */
const loadAccessibleRFQ = async (req, { lean = false } = {}) => {
  const { rfqId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(rfqId)) {
    return { error: { status: 400, message: 'Invalid RFQ id.' } };
  }

  const query = RFQ.findById(rfqId);
  const rfq = lean ? await query.lean() : await query;
  if (!rfq) return { error: { status: 404, message: 'RFQ not found.' } };

  const role = req.user.role;
  const userId = String(req.user._id);

  if (role === 'admin') return { rfq, role };
  if (role === 'seller') {
    if (!routingService.isRoutedToSeller(rfq, userId)) {
      return { error: { status: 403, message: 'This RFQ was not routed to you.' } };
    }
    return { rfq, role };
  }
  if (String(rfq.customerId) !== userId) {
    return { error: { status: 403, message: 'You do not have access to this RFQ.' } };
  }
  return { rfq, role: 'user' };
};

/** Stream a buffer to Cloudinary, preserving non-image formats (xlsx, dwg, pdf). */
const uploadAttachment = (file) => new Promise((resolve, reject) => {
  const isImage = String(file.mimetype || '').startsWith('image/');
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'riddha_mart/rfq_attachments',
      resource_type: isImage ? 'image' : 'raw',
      use_filename: true,
      unique_filename: true
    },
    (error, result) => (error ? reject(error) : resolve(result))
  );
  stream.end(file.buffer);
});

// -----------------------------------------------------------------------------
// 1. POST /api/rfq/parse — AI-parse free text / an uploaded file into lines
// -----------------------------------------------------------------------------

exports.parseRFQ = async (req, res, next) => {
  try {
    const rawInput = String(req.body.rawInput || '').trim();
    // The frontend bundles SheetJS and may pre-extract spreadsheet text itself.
    let fileSummary = String(req.body.fileSummary || '').trim();
    const notes = [];

    if (req.file) {
      const extracted = extractText(req.file.buffer, req.file.originalname, req.file.mimetype);
      if (extracted.text) fileSummary = [fileSummary, extracted.text].filter(Boolean).join('\n');
      if (extracted.note) notes.push(extracted.note);
    }

    if (!rawInput && !fileSummary) {
      return fail(res, 400, 'Provide either text describing your requirement or a readable file to parse.');
    }

    const parsed = await rfqAiService.parseRFQInput({ rawInput, fileSummary }, req.user._id);
    if (notes.length) parsed.ambiguities = [...new Set([...parsed.ambiguities, ...notes])];

    const clarificationQuestions = await rfqAiService.generateClarifications({
      ambiguities: parsed.ambiguities,
      providedFields: {
        deliveryLocation: parsed.deliveryLocation,
        requiredDate: parsed.requiredDate,
        specialRequirements: parsed.specialRequirements
      }
    }, req.user._id);

    res.status(200).json({
      success: true,
      message: parsed.aiUsed
        ? 'Requirement parsed. Please review each line before submitting.'
        : 'Requirement read with the basic text parser. Please review each line carefully before submitting.',
      data: { ...parsed, clarificationQuestions, units: RFQ_UNITS }
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 2. POST /api/rfq — create
// -----------------------------------------------------------------------------

exports.createRFQ = async (req, res, next) => {
  try {
    const {
      lineItems: rawLineItems,
      deliveryLocation = {},
      requiredDate,
      projectId,
      projectName = '',
      specialRequirements = '',
      budgetRange = {},
      attachments = [],
      contractorAccountId = null,
      aiParsed = {}
    } = req.body;

    const { errors, lineItems } = normalizeLineItems(rawLineItems);

    if (!deliveryLocation || !String(deliveryLocation.pincode || '').trim()) {
      errors.push('A delivery pincode is required.');
    } else if (!/^\d{6}$/.test(String(deliveryLocation.pincode).trim())) {
      errors.push('Delivery pincode must be 6 digits.');
    }

    if (!requiredDate) {
      errors.push('A required-by date is required.');
    } else {
      const parsedDate = new Date(requiredDate);
      if (Number.isNaN(parsedDate.getTime())) {
        errors.push('The required-by date is not a valid date.');
      } else if (parsedDate < startOfToday()) {
        errors.push('The required-by date cannot be in the past.');
      }
    }

    if (errors.length) {
      return res.status(400).json({ success: false, error: errors[0], errors });
    }

    // Company / GSTIN are auto-filled from the customer's business profile
    // (Requirement D will replace this with the contractor account record).
    const user = await User.findById(req.user._id).select('fullName name businessDetails userType').lean();
    const business = (user && user.businessDetails) || {};

    const rfq = new RFQ({
      rfqNumber: await generateRFQNumber(),
      customerId: req.user._id,
      contractorAccountId: contractorAccountId && mongoose.Types.ObjectId.isValid(contractorAccountId)
        ? contractorAccountId
        : null,
      projectId: projectId && mongoose.Types.ObjectId.isValid(projectId) ? projectId : null,
      lineItems,
      deliveryLocation: {
        address: String(deliveryLocation.address || '').trim(),
        city: String(deliveryLocation.city || '').trim(),
        state: String(deliveryLocation.state || '').trim(),
        pincode: String(deliveryLocation.pincode).trim(),
        lat: Number.isFinite(Number(deliveryLocation.lat)) ? Number(deliveryLocation.lat) : null,
        lng: Number.isFinite(Number(deliveryLocation.lng)) ? Number(deliveryLocation.lng) : null
      },
      requiredDate: new Date(requiredDate),
      projectName: String(projectName || '').trim(),
      specialRequirements: String(specialRequirements || '').trim(),
      budgetRange: {
        min: Number.isFinite(Number(budgetRange.min)) ? Number(budgetRange.min) : null,
        max: Number.isFinite(Number(budgetRange.max)) ? Number(budgetRange.max) : null
      },
      companyName: business.shopName || '',
      gstin: business.gstNumber || '',
      attachments: Array.isArray(attachments)
        ? attachments.filter((a) => a && a.url).slice(0, 5).map((a) => ({
          url: a.url,
          filename: a.filename || '',
          mimeType: a.mimeType || '',
          sizeBytes: Number(a.sizeBytes) || 0,
          uploadedAt: new Date()
        }))
        : [],
      status: RFQ_STATUS.SUBMITTED,
      statusHistory: [{
        status: RFQ_STATUS.SUBMITTED,
        changedAt: new Date(),
        changedBy: req.user._id,
        changedByRole: 'user',
        note: 'RFQ submitted by customer.'
      }],
      aiParsed: {
        rawInput: String(aiParsed.rawInput || '').slice(0, 20000),
        parsedAt: aiParsed.rawInput ? new Date() : null,
        ambiguities: Array.isArray(aiParsed.ambiguities) ? aiParsed.ambiguities.slice(0, 20) : [],
        clarificationQuestions: Array.isArray(aiParsed.clarificationQuestions)
          ? aiParsed.clarificationQuestions.slice(0, 4)
          : []
      }
    });

    const routing = await routingService.applyRouting(rfq);
    await rfq.save();

    // Fire-and-forget: a notification failure must not fail the submission.
    notifier.rfqSubmitted(rfq, {
      sellerIds: routing.newlyRoutedSellerIds,
      notifyAdmin: routing.routeToAdmin
    }).catch((err) => console.error('[RFQ] submit notification failed:', err.message));

    res.status(201).json({
      success: true,
      message: `RFQ ${rfq.rfqNumber} submitted. You will receive a quote within 24 hours.`,
      data: rfq,
      routing: {
        sellersNotified: routing.sellerIds.length,
        competitive: routing.competitive,
        routedToRiddhaTeam: routing.routeToAdmin,
        reason: routing.reason,
        slaDueAt: routing.slaDueAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 3. GET /api/rfq — list (customer / seller / admin view)
// -----------------------------------------------------------------------------

exports.getRFQs = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const query = {};
    if (req.user.role === 'seller') {
      query['routedTo.sellerId'] = req.user._id;
    } else if (req.user.role !== 'admin') {
      query.customerId = req.user._id;
    }

    if (status) query.status = { $in: String(status).split(',').map((s) => s.trim()) };
    if (search) {
      query.$or = [
        { rfqNumber: { $regex: String(search).trim(), $options: 'i' } },
        { projectName: { $regex: String(search).trim(), $options: 'i' } }
      ];
    }

    const [rfqs, total] = await Promise.all([
      RFQ.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('customerId', 'fullName name email phone')
        .lean(),
      RFQ.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: rfqs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: rfqs
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 4. GET /api/rfq/:rfqId — detail
// -----------------------------------------------------------------------------

exports.getRFQById = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req);
    if (error) return fail(res, error.status, error.message);

    await rfq.populate([
      { path: 'customerId', select: 'fullName name email phone businessDetails' },
      { path: 'quotations' },
      { path: 'routedTo.sellerId', select: 'fullName shopName email phone avatar' },
      { path: 'projectId', select: 'projectName' }
    ]);

    const payload = rfq.toObject();

    // A seller in a competitive RFQ sees only their own quotation, never a rival's.
    if (role === 'seller') {
      const sellerId = String(req.user._id);
      const own = (payload.routedTo || []).find((r) => String(r.sellerId && (r.sellerId._id || r.sellerId)) === sellerId);
      payload.quotations = (payload.quotations || []).filter(
        (q) => own && own.quotationId && String(q._id) === String(own.quotationId)
      );
      payload.routedTo = own ? [own] : [];
      payload.competitorCount = Math.max(0, (rfq.routedTo || []).length - 1);
    }

    res.status(200).json({
      success: true,
      data: payload,
      allowedNextStatuses: nextRFQStatuses(rfq.status)
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 5. PUT /api/rfq/:rfqId — customer edits before a quote lands
// -----------------------------------------------------------------------------

exports.updateRFQ = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req);
    if (error) return fail(res, error.status, error.message);

    if (role !== 'user' && role !== 'admin') {
      return fail(res, 403, 'Only the customer or the Riddha team can edit an RFQ.');
    }
    if (role === 'user' && !isRFQCustomerEditable(rfq.status)) {
      return fail(res, 400, `This RFQ can no longer be edited — it is already ${rfq.status.replace(/_/g, ' ')}.`);
    }

    const updates = {};

    if (req.body.lineItems !== undefined) {
      const { errors, lineItems } = normalizeLineItems(req.body.lineItems);
      if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });
      updates.lineItems = lineItems;
    }

    if (req.body.requiredDate !== undefined) {
      const parsedDate = new Date(req.body.requiredDate);
      if (Number.isNaN(parsedDate.getTime())) return fail(res, 400, 'The required-by date is not a valid date.');
      if (parsedDate < startOfToday()) return fail(res, 400, 'The required-by date cannot be in the past.');
      updates.requiredDate = parsedDate;
    }

    if (req.body.deliveryLocation !== undefined) {
      const loc = req.body.deliveryLocation || {};
      if (!/^\d{6}$/.test(String(loc.pincode || '').trim())) {
        return fail(res, 400, 'Delivery pincode must be 6 digits.');
      }
      updates.deliveryLocation = {
        address: String(loc.address || '').trim(),
        city: String(loc.city || '').trim(),
        state: String(loc.state || '').trim(),
        pincode: String(loc.pincode).trim(),
        lat: Number.isFinite(Number(loc.lat)) ? Number(loc.lat) : null,
        lng: Number.isFinite(Number(loc.lng)) ? Number(loc.lng) : null
      };
    }

    for (const field of ['projectName', 'specialRequirements']) {
      if (req.body[field] !== undefined) updates[field] = String(req.body[field] || '').trim();
    }
    if (req.body.budgetRange !== undefined) {
      const b = req.body.budgetRange || {};
      updates.budgetRange = {
        min: Number.isFinite(Number(b.min)) ? Number(b.min) : null,
        max: Number.isFinite(Number(b.max)) ? Number(b.max) : null
      };
    }

    Object.assign(rfq, updates);

    // Re-route when the basket of products changed: new sellers may now qualify.
    let routing = null;
    if (updates.lineItems) {
      routing = await routingService.applyRouting(rfq);
    }

    await rfq.save();

    if (routing && routing.newlyRoutedSellerIds.length) {
      notifier.rfqSubmitted(rfq, { sellerIds: routing.newlyRoutedSellerIds, notifyAdmin: false })
        .catch((err) => console.error('[RFQ] re-route notification failed:', err.message));
    }

    res.status(200).json({ success: true, message: 'RFQ updated.', data: rfq });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 6. POST /api/rfq/:rfqId/attachments — drawings / BOQ files
// -----------------------------------------------------------------------------

exports.uploadAttachments = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req);
    if (error) return fail(res, error.status, error.message);
    if (role === 'seller') return fail(res, 403, 'Sellers cannot add attachments to a customer RFQ.');

    const files = req.files || [];
    if (files.length === 0) return fail(res, 400, 'No files were uploaded.');
    if (rfq.attachments.length + files.length > 5) {
      return fail(res, 400, `An RFQ can hold at most 5 attachments (${rfq.attachments.length} already uploaded).`);
    }

    const uploaded = [];
    for (const file of files) {
      const result = await uploadAttachment(file);
      uploaded.push({
        url: result.secure_url,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedAt: new Date()
      });
    }

    rfq.attachments.push(...uploaded);
    await rfq.save();

    res.status(200).json({
      success: true,
      message: `${uploaded.length} file(s) attached.`,
      data: { attachments: rfq.attachments }
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 7. POST /api/rfq/:rfqId/route — admin (re-)routing
// -----------------------------------------------------------------------------

exports.routeRFQ = async (req, res, next) => {
  try {
    const { rfqId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(rfqId)) return fail(res, 400, 'Invalid RFQ id.');

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) return fail(res, 404, 'RFQ not found.');

    const { sellerIds } = req.body;
    let newlyRouted = [];

    if (Array.isArray(sellerIds) && sellerIds.length > 0) {
      // Explicit override by the admin.
      const valid = sellerIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      const sellers = await Seller.find({ _id: { $in: valid }, status: 'approved' }).select('_id').lean();
      const approved = sellers.map((s) => String(s._id));
      const missing = valid.filter((id) => !approved.includes(String(id)));
      if (missing.length) {
        return fail(res, 400, `These sellers are not approved and cannot be routed an RFQ: ${missing.join(', ')}.`);
      }

      const existing = new Set((rfq.routedTo || []).map((r) => String(r.sellerId)));
      newlyRouted = approved.filter((id) => !existing.has(id));
      rfq.routedTo.push(...newlyRouted.map((sellerId) => ({ sellerId, routedAt: new Date() })));

      const rules = await routingService.loadRules();
      if (!rfq.slaDueAt) rfq.slaDueAt = new Date(Date.now() + rules.slaResponseHours * 60 * 60 * 1000);
      if (!rfq.expiresAt) rfq.expiresAt = new Date(Date.now() + rules.expiryDays * 24 * 60 * 60 * 1000);
    } else {
      const routing = await routingService.applyRouting(rfq);
      newlyRouted = routing.newlyRoutedSellerIds;
    }

    if (rfq.status === RFQ_STATUS.SUBMITTED) {
      applyRFQTransition(rfq, RFQ_STATUS.UNDER_REVIEW, actorFrom(req, 'Routed to sellers by the Riddha team.'));
    }

    await rfq.save();

    notifier.rfqSubmitted(rfq, { sellerIds: newlyRouted, notifyAdmin: false })
      .catch((err) => console.error('[RFQ] route notification failed:', err.message));

    res.status(200).json({
      success: true,
      message: newlyRouted.length
        ? `RFQ routed to ${newlyRouted.length} seller(s).`
        : 'No new sellers to route to — every matching seller already has this RFQ.',
      data: rfq
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 8. POST /api/rfq/:rfqId/quote — seller submits a quotation (Requirement #12)
// -----------------------------------------------------------------------------

exports.submitQuote = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req);
    if (error) return fail(res, error.status, error.message);
    if (role !== 'seller' && role !== 'admin') {
      return fail(res, 403, 'Only a routed seller or the Riddha team can quote on an RFQ.');
    }
    if ([RFQ_STATUS.ACCEPTED, RFQ_STATUS.CONVERTED_TO_ORDER, RFQ_STATUS.REJECTED, RFQ_STATUS.EXPIRED].includes(rfq.status)) {
      return fail(res, 400, `This RFQ is ${rfq.status.replace(/_/g, ' ')} and can no longer be quoted.`);
    }

    const { items, validUntil, leadTimeDays = 14, notes = '', deliveryCharges = 0, installationCost = 0 } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return fail(res, 400, 'A quotation needs at least one priced line.');
    }

    const quotationItems = items.map((item) => ({
      description: String(item.description || '').trim(),
      quantity: Number(item.quantity) || 0,
      unit: String(item.unit || 'Pieces'),
      unitRate: Number(item.unitRate) || 0,
      hsnCode: String(item.hsnCode || ''),
      taxRate: [0, 5, 12, 18].includes(Number(item.taxRate)) ? Number(item.taxRate) : 18,
      productId: item.productId && mongoose.Types.ObjectId.isValid(item.productId) ? item.productId : undefined
    }));

    const invalid = quotationItems.findIndex((i) => !i.description || i.quantity <= 0 || i.unitRate < 0);
    if (invalid >= 0) {
      return fail(res, 400, `Quotation line ${invalid + 1} needs a description, a quantity above zero and a non-negative rate.`);
    }

    const { items: pricedItems, pricing } = calculateQuotationPricing(quotationItems, {
      globalDiscountType: req.body.globalDiscountType,
      globalDiscountValue: req.body.globalDiscountValue
    });

    // The pricing engine covers goods and GST only; delivery and installation
    // are quoted separately and added to the headline total the customer sees.
    const extraCharges = (Number(deliveryCharges) || 0) + (Number(installationCost) || 0);
    pricing.grandTotal = Math.round((pricing.grandTotal + extraCharges) * 100) / 100;

    const customer = await User.findById(rfq.customerId).select('fullName name email phone').lean();
    const customerName = (customer && (customer.fullName || customer.name)) || 'Customer';

    const coverNote = await rfqAiService.draftQuoteCoverNote({
      customerName,
      companyName: rfq.companyName,
      projectName: rfq.projectName,
      lineItems: rfq.lineItems,
      deliveryLocation: [rfq.deliveryLocation.city, rfq.deliveryLocation.pincode].filter(Boolean).join(' - '),
      requiredDate: new Date(rfq.requiredDate).toLocaleDateString('en-IN'),
      quotedTotal: pricing.grandTotal,
      leadTimeDays: Number(leadTimeDays) || 14
    }, req.user._id);

    const quotation = await Quotation.create({
      quotationNumber: generateQuotationNumber(),
      // The quotation is authored by the seller/admin who is responding.
      userId: req.user._id,
      clientId: rfq.customerId,
      projectId: rfq.projectId || undefined,
      clientName: customerName,
      clientEmail: (customer && customer.email) || '',
      clientPhone: (customer && customer.phone) || '',
      projectName: rfq.projectName || `RFQ ${rfq.rfqNumber}`,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      items: pricedItems,
      pricing,
      delivery: {
        address: [rfq.deliveryLocation.address, rfq.deliveryLocation.city, rfq.deliveryLocation.pincode]
          .filter(Boolean).join(', '),
        charges: Number(deliveryCharges) || 0,
        included: Number(deliveryCharges) === 0
      },
      installation: { required: Number(installationCost) > 0, cost: Number(installationCost) || 0 },
      openingMessage: coverNote,
      notes: String(notes || '').trim(),
      status: 'sent',
      sentAt: new Date()
    });

    rfq.quotations.push(quotation._id);
    routingService.markResponded(rfq, req.user._id, quotation._id);

    if (rfq.status !== RFQ_STATUS.QUOTED) {
      applyRFQTransition(rfq, RFQ_STATUS.QUOTED, actorFrom(req, `Quotation ${quotation.quotationNumber} submitted.`));
    } else {
      rfq.statusHistory.push({
        status: RFQ_STATUS.QUOTED,
        changedAt: new Date(),
        changedBy: req.user._id,
        changedByRole: role,
        note: `Additional quotation ${quotation.quotationNumber} submitted.`
      });
    }

    await rfq.save();

    const sellerName = role === 'seller'
      ? (req.user.shopName || req.user.fullName || 'Your supplier')
      : 'The Riddha team';

    notifier.rfqQuoted(rfq, { quotationId: quotation._id, sellerName })
      .catch((err) => console.error('[RFQ] quote notification failed:', err.message));

    res.status(201).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} sent to the customer.`,
      data: { quotation, rfq }
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 9. Negotiation thread
// -----------------------------------------------------------------------------

exports.postMessage = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req);
    if (error) return fail(res, error.status, error.message);

    const message = String(req.body.message || '').trim();
    if (!message) return fail(res, 400, 'A message cannot be empty.');
    if (message.length > 4000) return fail(res, 400, 'A message cannot exceed 4000 characters.');

    // Scope the thread. A seller always writes into their own sub-thread. A
    // customer may target one seller; leaving sellerId out broadcasts to every
    // seller holding the RFQ, which is what competitive quoting needs.
    let sellerId = null;
    if (role === 'seller') {
      sellerId = req.user._id;
    } else if (req.body.sellerId && mongoose.Types.ObjectId.isValid(req.body.sellerId)) {
      if (!routingService.isRoutedToSeller(rfq, req.body.sellerId)) {
        return fail(res, 400, 'That seller is not part of this RFQ.');
      }
      sellerId = req.body.sellerId;
    } else if ((rfq.routedTo || []).length === 1) {
      sellerId = rfq.routedTo[0].sellerId;
    }

    const created = await RFQMessage.create({
      rfqId: rfq._id,
      senderId: req.user._id,
      senderRole: role,
      senderName: req.user.shopName || req.user.fullName || req.user.name || '',
      sellerId,
      message,
      attachments: Array.isArray(req.body.attachments)
        ? req.body.attachments.filter((a) => a && a.url).slice(0, 5)
        : []
    });

    // The first message on a quoted RFQ opens the negotiation.
    if (rfq.status === RFQ_STATUS.QUOTED) {
      applyRFQTransition(rfq, RFQ_STATUS.NEGOTIATION, actorFrom(req, 'Negotiation opened.'));
      await rfq.save();
    }

    notifier.rfqMessage(rfq, { message, senderRole: role, sellerId })
      .catch((err) => console.error('[RFQ] message notification failed:', err.message));

    res.status(201).json({ success: true, message: 'Message sent.', data: created });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req, { lean: true });
    if (error) return fail(res, error.status, error.message);

    const query = { rfqId: rfq._id };
    if (role === 'seller') {
      // A seller sees their own sub-thread plus the customer's broadcasts,
      // never a competitor's sub-thread.
      query.$or = [{ sellerId: req.user._id }, { sellerId: null }];
    } else if (req.query.sellerId && mongoose.Types.ObjectId.isValid(req.query.sellerId)) {
      query.$or = [{ sellerId: req.query.sellerId }, { sellerId: null }];
    }

    const messages = await RFQMessage.find(query).sort({ createdAt: 1 }).lean();

    // Mark everything addressed to the reader as read.
    await RFQMessage.updateMany(
      { ...query, readAt: null, senderId: { $ne: req.user._id } },
      { $set: { readAt: new Date() } }
    );

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 10. Accept / reject
// -----------------------------------------------------------------------------

exports.acceptQuotation = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req);
    if (error) return fail(res, error.status, error.message);
    if (role !== 'user') return fail(res, 403, 'Only the customer can accept a quotation.');

    const { quotationId } = req.body;
    if (!quotationId || !mongoose.Types.ObjectId.isValid(quotationId)) {
      return fail(res, 400, 'A quotationId is required.');
    }
    if (!(rfq.quotations || []).some((q) => String(q) === String(quotationId))) {
      return fail(res, 400, 'That quotation does not belong to this RFQ.');
    }

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) return fail(res, 404, 'Quotation not found.');

    applyRFQTransition(rfq, RFQ_STATUS.ACCEPTED, actorFrom(req, `Accepted quotation ${quotation.quotationNumber}.`));
    rfq.acceptedQuotationId = quotation._id;
    await rfq.save();

    quotation.status = 'accepted';
    quotation.acceptedAt = new Date();
    quotation.acceptedBy = req.user.fullName || req.user.name || String(req.user._id);
    await quotation.save();

    const winning = (rfq.routedTo || []).find((r) => String(r.quotationId) === String(quotation._id));

    notifier.rfqAccepted(rfq, { sellerId: winning && winning.sellerId, quotationId: quotation._id })
      .catch((err) => console.error('[RFQ] accept notification failed:', err.message));

    res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} accepted. Confirm to place the order.`,
      data: rfq
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

exports.rejectRFQ = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req);
    if (error) return fail(res, error.status, error.message);

    const reason = String(req.body.reason || '').trim();
    if (!reason) return fail(res, 400, 'A reason is required when rejecting an RFQ.');

    applyRFQTransition(rfq, RFQ_STATUS.REJECTED, actorFrom(req, reason));
    rfq.rejectionReason = reason;
    await rfq.save();

    notifier.rfqStatusChanged(rfq, {
      title: `RFQ ${rfq.rfqNumber} closed`,
      message: role === 'user' ? 'You closed this request.' : `This request was closed: ${reason}`
    }).catch((err) => console.error('[RFQ] reject notification failed:', err.message));

    res.status(200).json({ success: true, message: 'RFQ closed.', data: rfq });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 11. POST /api/rfq/:rfqId/convert — accepted quote -> order
// -----------------------------------------------------------------------------

exports.convertToOrder = async (req, res, next) => {
  try {
    const { rfq, error, role } = await loadAccessibleRFQ(req);
    if (error) return fail(res, error.status, error.message);
    if (role === 'seller') return fail(res, 403, 'Only the customer or the Riddha team can convert an RFQ to an order.');

    if (rfq.convertedOrderId) {
      return fail(res, 400, 'This RFQ has already been converted to an order.');
    }
    if (!rfq.acceptedQuotationId) {
      return fail(res, 400, 'Accept a quotation before converting this RFQ to an order.');
    }

    const quotation = await Quotation.findById(rfq.acceptedQuotationId).lean();
    if (!quotation) return fail(res, 404, 'The accepted quotation no longer exists.');

    // Every quoted line must map to a catalogue product: an Order line requires
    // a product reference, a name, a price and an image.
    const unmapped = quotation.items.filter((i) => !i.productId);
    if (unmapped.length) {
      return res.status(400).json({
        success: false,
        error: `${unmapped.length} quoted line(s) are not linked to a catalogue product, so an order cannot be created. Ask the seller to re-issue the quotation with the products linked.`,
        unmappedLines: unmapped.map((i) => i.description)
      });
    }

    const productIds = quotation.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id name images seller sellerType')
      .lean();
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const missing = productIds.filter((id) => !productById.has(String(id)));
    if (missing.length) {
      return fail(res, 400, 'One or more quoted products are no longer in the catalogue. Ask the seller to re-issue the quotation.');
    }

    // An Order belongs to exactly one seller, and a quotation is authored by one
    // seller, so a split here means the quotation mixes sellers' catalogues.
    const sellerIds = [...new Set(products.map((p) => `${p.sellerType}:${p.seller}`))];
    if (sellerIds.length > 1) {
      return fail(res, 400, 'The accepted quotation spans multiple sellers. Ask for one quotation per seller so separate orders can be raised.');
    }
    const [sellerType, sellerId] = sellerIds[0].split(':');

    const shippingAddress = req.body.shippingAddress || {};
    const customer = await User.findById(rfq.customerId).select('fullName name phone').lean();

    const resolvedAddress = {
      fullName: String(shippingAddress.fullName || (customer && (customer.fullName || customer.name)) || '').trim(),
      mobileNumber: String(shippingAddress.mobileNumber || (customer && customer.phone) || '').trim(),
      pincode: String(shippingAddress.pincode || rfq.deliveryLocation.pincode || '').trim(),
      city: String(shippingAddress.city || rfq.deliveryLocation.city || '').trim(),
      fullAddress: String(shippingAddress.fullAddress || rfq.deliveryLocation.address || '').trim(),
      landmark: String(shippingAddress.landmark || '').trim()
    };

    for (const field of ['fullName', 'mobileNumber', 'pincode', 'city', 'fullAddress']) {
      if (!resolvedAddress[field]) {
        return fail(res, 400, `A delivery address is incomplete — "${field}" is required to create the order.`);
      }
    }

    const orderItems = quotation.items.map((item) => {
      const product = productById.get(String(item.productId));
      return {
        name: item.description || product.name,
        quantity: item.quantity,
        image: (product.images && product.images[0]) || '',
        // Unit rate excluding tax; the tax total is carried on the order.
        price: item.unitRate,
        product: product._id,
        seller: product.seller,
        sellerType: product.sellerType
      };
    });

    const pricing = quotation.pricing || {};
    const taxes = pricing.taxes || {};
    const cgst = (taxes.cgst5 || 0) + (taxes.cgst12 || 0) + (taxes.cgst18 || 0);
    const sgst = (taxes.sgst5 || 0) + (taxes.sgst12 || 0) + (taxes.sgst18 || 0);
    const itemsPrice = pricing.subtotalAfterDiscount || pricing.subtotal || 0;
    const shippingPrice = (quotation.delivery && quotation.delivery.charges) || 0;

    const order = await Order.create({
      orderItems,
      user: rfq.customerId,
      seller: sellerId,
      sellerType,
      shippingAddress: resolvedAddress,
      paymentMethod: req.body.paymentMethod === 'COD' ? 'COD' : 'Online',
      itemsPrice,
      shippingPrice,
      taxAmount: taxes.totalGST || 0,
      cgst,
      sgst,
      igst: 0,
      taxType: 'intra-state',
      discountAmount: (pricing.discounts && pricing.discounts.globalDiscountAmount) || 0,
      pricingBreakdown: {
        subtotal: pricing.subtotal || 0,
        taxAmount: taxes.totalGST || 0,
        cgst,
        sgst,
        igst: 0,
        shippingPrice,
        discountAmount: (pricing.discounts && pricing.discounts.globalDiscountAmount) || 0,
        totalPrice: pricing.grandTotal || 0
      },
      totalPrice: pricing.grandTotal || 0,
      isPaid: false,
      paymentStatus: 'pending',
      status: 'Pending',
      orderNumber: `RFQ-${rfq.rfqNumber.split('-').slice(1).join('-')}`,
      statusHistory: [{
        status: 'Pending',
        timestamp: new Date(),
        notes: `Created from accepted quotation ${quotation.quotationNumber} on RFQ ${rfq.rfqNumber}.`,
        updatedBy: 'system'
      }]
    });

    applyRFQTransition(rfq, RFQ_STATUS.CONVERTED_TO_ORDER, actorFrom(req, `Converted to order ${order._id}.`));
    rfq.convertedOrderId = order._id;
    await rfq.save();

    notifier.rfqConverted(rfq, order)
      .catch((err) => console.error('[RFQ] convert notification failed:', err.message));

    res.status(201).json({
      success: true,
      message: `Order created from ${rfq.rfqNumber}.`,
      data: { order, rfq }
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return fail(res, 400, error.message);
    next(error);
  }
};

// -----------------------------------------------------------------------------
// 12. GET /api/rfq/analytics — funnel metrics (admin)
// -----------------------------------------------------------------------------

exports.getAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const [byStatus, totals, slaRows] = await Promise.all([
      RFQ.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$estimatedValue' } } }
      ]),
      RFQ.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalValue: { $sum: '$estimatedValue' },
            avgLineItems: { $avg: { $size: '$lineItems' } }
          }
        }
      ]),
      RFQ.aggregate([
        { $match: { ...match, firstResponseAt: { $ne: null } } },
        {
          $group: {
            _id: null,
            avgResponseMs: { $avg: { $subtract: ['$firstResponseAt', '$createdAt'] } },
            withinSla: {
              $sum: { $cond: [{ $lte: ['$firstResponseAt', '$slaDueAt'] }, 1, 0] }
            },
            responded: { $sum: 1 }
          }
        }
      ])
    ]);

    const counts = byStatus.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {});
    const summary = totals[0] || { total: 0, totalValue: 0, avgLineItems: 0 };
    const sla = slaRows[0] || { avgResponseMs: 0, withinSla: 0, responded: 0 };

    const quoted = (counts.quoted || 0) + (counts.negotiation || 0) + (counts.accepted || 0) + (counts.converted_to_order || 0);
    const accepted = (counts.accepted || 0) + (counts.converted_to_order || 0);
    const converted = counts.converted_to_order || 0;
    const pct = (numerator, denominator) => (denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0);

    const openBreached = await RFQ.countDocuments({
      ...match,
      status: { $in: [RFQ_STATUS.SUBMITTED, RFQ_STATUS.UNDER_REVIEW] },
      slaDueAt: { $lt: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        counts,
        funnel: {
          submitted: summary.total,
          quoted,
          accepted,
          converted,
          quoteRate: pct(quoted, summary.total),
          acceptRate: pct(accepted, quoted),
          conversionRate: pct(converted, summary.total)
        },
        value: {
          totalEstimatedValue: Math.round(summary.totalValue || 0),
          averageRFQValue: summary.total > 0 ? Math.round((summary.totalValue || 0) / summary.total) : 0,
          averageLineItems: Number((summary.avgLineItems || 0).toFixed(1))
        },
        sla: {
          averageResponseHours: sla.avgResponseMs ? Number((sla.avgResponseMs / 3600000).toFixed(1)) : 0,
          withinSlaRate: pct(sla.withinSla, sla.responded),
          respondedCount: sla.responded,
          openAndBreached: openBreached
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
