/**
 * Requirement A — live smoke test for the RFQ and Sample Request modules.
 *
 * Drives the controllers directly against the real database (same pattern as
 * scratch/test_bundle_flow.js), walking the whole lifecycle:
 *   RFQ:    parse -> create -> route -> quote -> negotiate -> accept -> convert
 *   Sample: eligibility -> create -> approve -> dispatch -> deliver -> feedback
 *
 * Every document it creates is deleted in the finally block.
 *
 * Run: node scratch/test_rfq_flow.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/db');

const RFQ = require('../src/models/RFQ');
const RFQMessage = require('../src/models/RFQMessage');
const SampleRequest = require('../src/models/SampleRequest');
const Product = require('../src/models/Product');
const Quotation = require('../src/models/Quotation');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Seller = require('../src/models/Seller');
const Notification = require('../src/models/Notification');

const rfqController = require('../src/controllers/rfqController');
const sampleController = require('../src/controllers/sampleController');
const rfqSlaService = require('../src/services/rfqSlaService');

let passed = 0;
let failed = 0;

const check = (label, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`);
  }
};

const mockRes = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.body = data; return this; }
});

/** Invoke a controller and surface any error it forwards to next(). */
const call = async (handler, req) => {
  const res = mockRes();
  let forwarded = null;
  await handler(req, res, (err) => { forwarded = err; });
  if (forwarded) throw forwarded;
  return res;
};

async function run() {
  await connectDB();
  console.log('Connected.\n');

  const created = { users: [], sellers: [], products: [], rfqs: [], samples: [], quotations: [], orders: [], messages: [] };

  try {
    // -------------------------------------------------------------------------
    // Fixtures
    // -------------------------------------------------------------------------
    const stamp = Date.now();

    const customer = await User.create({
      fullName: 'RFQ Smoke Contractor',
      email: `rfq-smoke-${stamp}@example.com`,
      password: 'temporarypassword123',
      userType: 'enterpriser',
      phone: '9000000001',
      businessDetails: { shopName: 'Smoke Interiors LLP', gstNumber: '23AAAAA0000A1Z5', isVerified: true }
    });
    created.users.push(customer._id);

    const seller = await Seller.create({
      fullName: 'RFQ Smoke Seller',
      email: `rfq-smoke-seller-${stamp}@example.com`,
      shopName: 'Smoke Tiles Depot',
      shopAddress: '12 Test Road, Indore',
      phone: '9000000002',
      gstNumber: '23BBBBB0000B1Z5',
      password: 'temporarypassword123',
      status: 'approved'
    });
    created.sellers.push(seller._id);

    // Clone a real catalogue product so category/brand refs stay valid.
    const template = await Product.findOne({ isActive: true, isApproved: true }).lean();
    if (!template) throw new Error('Need at least one live product in the catalogue to test with.');

    const product = await Product.create({
      ...template,
      _id: undefined,
      name: 'RFQ Smoke Vitrified Tile',
      sku: `RFQ-SMOKE-${stamp}`,
      seller: seller._id,
      sellerType: 'Seller',
      price: 100,
      countInStock: 5000,
      sampleAvailable: true,
      sampleCharge: 0,
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved'
    });
    created.products.push(product._id);

    const asCustomer = { user: { _id: customer._id, role: 'user', fullName: customer.fullName }, body: {}, params: {}, query: {} };
    const asSeller = { user: { _id: seller._id, role: 'seller', shopName: seller.shopName }, body: {}, params: {}, query: {} };
    const asAdmin = { user: { _id: new mongoose.Types.ObjectId(), role: 'admin', fullName: 'Smoke Admin' }, body: {}, params: {}, query: {} };

    // -------------------------------------------------------------------------
    // 1. Parse free text into structured lines
    // -------------------------------------------------------------------------
    console.log('1. POST /api/rfq/parse');
    const parseRes = await call(rfqController.parseRFQ, {
      ...asCustomer,
      body: { rawInput: '2000 sq.ft vitrified tile 600x600 matt finish for office washroom\n25 nos soft close hinges\nsome marble for reception' }
    });
    check('parse returns 200', parseRes.statusCode === 200, `got ${parseRes.statusCode}`);
    check('parse produced 3 line items', parseRes.body.data.lineItems.length === 3,
      `got ${parseRes.body.data.lineItems.length}`);
    check('unreadable quantity is flagged, not invented',
      parseRes.body.data.lineItems.some((l) => l.quantity === null && l.matchConfidence === 'low'));
    check('ambiguities produced clarification questions',
      Array.isArray(parseRes.body.data.clarificationQuestions) && parseRes.body.data.clarificationQuestions.length > 0);

    // -------------------------------------------------------------------------
    // 2. Validation
    // -------------------------------------------------------------------------
    console.log('\n2. Validation guards');
    const pastDate = await call(rfqController.createRFQ, {
      ...asCustomer,
      body: {
        lineItems: [{ productDescription: 'Tile', quantity: 10, unit: 'sq.ft' }],
        deliveryLocation: { pincode: '452001' },
        requiredDate: '2020-01-01'
      }
    });
    check('a past required-by date is rejected', pastDate.statusCode === 400
      && /cannot be in the past/.test(pastDate.body.error), JSON.stringify(pastDate.body));

    const badUnit = await call(rfqController.createRFQ, {
      ...asCustomer,
      body: {
        lineItems: [{ productDescription: 'Tile', quantity: 10, unit: 'furlongs' }],
        deliveryLocation: { pincode: '452001' },
        requiredDate: new Date(Date.now() + 86400000).toISOString()
      }
    });
    check('an unsupported unit is rejected', badUnit.statusCode === 400 && /unit must be one of/.test(badUnit.body.error));

    const tooMany = await call(rfqController.createRFQ, {
      ...asCustomer,
      body: {
        lineItems: Array.from({ length: 51 }, (_, i) => ({ productDescription: `Item ${i}`, quantity: 1, unit: 'pcs' })),
        deliveryLocation: { pincode: '452001' },
        requiredDate: new Date(Date.now() + 86400000).toISOString()
      }
    });
    check('more than 50 line items is rejected', tooMany.statusCode === 400 && /more than 50/.test(tooMany.body.error));

    // -------------------------------------------------------------------------
    // 3. Create — multi-line, product-linked
    // -------------------------------------------------------------------------
    console.log('\n3. POST /api/rfq');
    const createRes = await call(rfqController.createRFQ, {
      ...asCustomer,
      body: {
        lineItems: [
          { productId: product._id.toString(), productDescription: 'RFQ Smoke Vitrified Tile', quantity: 2000, unit: 'sq.ft', size: '600x600', finish: 'matt' },
          { productDescription: 'Soft close hinges', quantity: 25, unit: 'nos' }
        ],
        deliveryLocation: { address: '12 Site Road', city: 'Indore', state: 'MP', pincode: '452001' },
        requiredDate: new Date(Date.now() + 20 * 86400000).toISOString(),
        projectName: 'Smoke Test Office Fitout',
        specialRequirements: 'Anti-skid grade for the washroom.',
        budgetRange: { min: 150000, max: 250000 }
      }
    });
    check('create returns 201', createRes.statusCode === 201, JSON.stringify(createRes.body).slice(0, 200));

    const rfq = await RFQ.findById(createRes.body.data._id);
    created.rfqs.push(rfq._id);

    check('RFQ number matches RFQ-YYYY-NNNN', /^RFQ-\d{4}-\d{4}$/.test(rfq.rfqNumber), rfq.rfqNumber);
    check('status opens at submitted', rfq.status === 'submitted');
    check('audit history has the opening entry', rfq.statusHistory.length === 1
      && rfq.statusHistory[0].changedByRole === 'user');
    check('company + GSTIN auto-filled from the business profile',
      rfq.companyName === 'Smoke Interiors LLP' && rfq.gstin === '23AAAAA0000A1Z5');
    check('SLA due ~24h out', rfq.slaDueAt
      && Math.abs(rfq.slaDueAt - (Date.now() + 24 * 3600000)) < 5 * 60 * 1000);
    check('expiry set', !!rfq.expiresAt);
    check('routed to the product owner', rfq.routedTo.some((r) => String(r.sellerId) === String(seller._id)),
      JSON.stringify(rfq.routedTo));
    check('estimated value computed from the linked product', rfq.estimatedValue === 2000 * 100,
      String(rfq.estimatedValue));

    const rfqNumbers = await RFQ.find({ rfqNumber: rfq.rfqNumber }).countDocuments();
    check('RFQ number is unique', rfqNumbers === 1);

    // -------------------------------------------------------------------------
    // 4. Number sequence increments
    // -------------------------------------------------------------------------
    console.log('\n4. Sequential numbering');
    const second = await call(rfqController.createRFQ, {
      ...asCustomer,
      body: {
        lineItems: [{ productDescription: 'Second RFQ line', quantity: 5, unit: 'box' }],
        deliveryLocation: { pincode: '452001' },
        requiredDate: new Date(Date.now() + 10 * 86400000).toISOString()
      }
    });
    const rfq2 = await RFQ.findById(second.body.data._id);
    created.rfqs.push(rfq2._id);
    const seq = (n) => Number(n.split('-')[2]);
    check('the next RFQ number increments by one', seq(rfq2.rfqNumber) === seq(rfq.rfqNumber) + 1,
      `${rfq.rfqNumber} -> ${rfq2.rfqNumber}`);
    check('an RFQ with no catalogue match routes to the Riddha team', rfq2.routedToAdmin === true);

    // -------------------------------------------------------------------------
    // 5. Access control
    // -------------------------------------------------------------------------
    console.log('\n5. Access control');
    const otherUser = await User.create({
      fullName: 'Unrelated User', email: `rfq-other-${stamp}@example.com`, password: 'temporarypassword123'
    });
    created.users.push(otherUser._id);

    const forbidden = await call(rfqController.getRFQById, {
      user: { _id: otherUser._id, role: 'user' }, params: { rfqId: rfq._id.toString() }, body: {}, query: {}
    });
    check('another customer cannot read the RFQ', forbidden.statusCode === 403);

    const strangerSeller = await Seller.create({
      fullName: 'Stranger Seller', email: `rfq-stranger-${stamp}@example.com`, shopName: 'Stranger Co',
      shopAddress: 'X', phone: '9000000009', gstNumber: '23CCCCC0000C1Z5',
      password: 'temporarypassword123', status: 'approved'
    });
    created.sellers.push(strangerSeller._id);

    const notRouted = await call(rfqController.getRFQById, {
      user: { _id: strangerSeller._id, role: 'seller' }, params: { rfqId: rfq._id.toString() }, body: {}, query: {}
    });
    check('an unrouted seller cannot read the RFQ', notRouted.statusCode === 403);

    // -------------------------------------------------------------------------
    // 6. Customer edit window
    // -------------------------------------------------------------------------
    console.log('\n6. PUT /api/rfq/:rfqId');
    const edited = await call(rfqController.updateRFQ, {
      ...asCustomer,
      params: { rfqId: rfq._id.toString() },
      body: { specialRequirements: 'Anti-skid grade, R11 rating.' }
    });
    check('customer can edit while submitted', edited.statusCode === 200
      && edited.body.data.specialRequirements === 'Anti-skid grade, R11 rating.');

    // -------------------------------------------------------------------------
    // 7. Seller quotes
    // -------------------------------------------------------------------------
    console.log('\n7. POST /api/rfq/:rfqId/quote');
    const quoteRes = await call(rfqController.submitQuote, {
      ...asSeller,
      params: { rfqId: rfq._id.toString() },
      body: {
        items: [
          { description: 'RFQ Smoke Vitrified Tile 600x600 matt', quantity: 2000, unit: 'sq.ft', unitRate: 85, taxRate: 18, productId: product._id.toString() }
        ],
        leadTimeDays: 12,
        deliveryCharges: 5000
      }
    });
    check('quote returns 201', quoteRes.statusCode === 201, JSON.stringify(quoteRes.body).slice(0, 200));

    const quotation = await Quotation.findById(quoteRes.body.data.quotation._id);
    created.quotations.push(quotation._id);

    check('quotation priced 2000 x 85 = 170000 subtotal', quotation.pricing.subtotal === 170000,
      String(quotation.pricing.subtotal));
    check('GST split into CGST + SGST', quotation.pricing.taxes.cgst18 === 15300 && quotation.pricing.taxes.sgst18 === 15300,
      JSON.stringify(quotation.pricing.taxes));
    check('delivery charge added to the grand total', quotation.pricing.grandTotal === 170000 + 30600 + 5000,
      String(quotation.pricing.grandTotal));
    check('a cover note was drafted', !!quotation.openingMessage && quotation.openingMessage.length > 40);

    let live = await RFQ.findById(rfq._id);
    check('RFQ moved to quoted', live.status === 'quoted');
    check("the seller's SLA clock stopped", !!live.routedTo.find((r) => String(r.sellerId) === String(seller._id)).respondedAt);
    check('firstResponseAt recorded', !!live.firstResponseAt);
    check('SLA reports responded and not breached', rfqSlaService.slaStatus(live).responded === true
      && rfqSlaService.slaStatus(live).breached === false);

    // -------------------------------------------------------------------------
    // 8. Edit window closes once quoted
    // -------------------------------------------------------------------------
    const lateEdit = await call(rfqController.updateRFQ, {
      ...asCustomer,
      params: { rfqId: rfq._id.toString() },
      body: { specialRequirements: 'too late' }
    });
    check('customer cannot edit after a quote lands', lateEdit.statusCode === 400
      && /no longer be edited/.test(lateEdit.body.error));

    // -------------------------------------------------------------------------
    // 9. Negotiation thread
    // -------------------------------------------------------------------------
    console.log('\n8. Negotiation thread');
    const msgRes = await call(rfqController.postMessage, {
      ...asCustomer,
      params: { rfqId: rfq._id.toString() },
      body: { message: 'Can you hold this rate if we push delivery to next month?' }
    });
    check('message posted', msgRes.statusCode === 201);
    created.messages.push(msgRes.body.data._id);

    live = await RFQ.findById(rfq._id);
    check('first message opens negotiation', live.status === 'negotiation');

    const thread = await call(rfqController.getMessages, {
      ...asSeller, params: { rfqId: rfq._id.toString() }, query: {}
    });
    check('the routed seller sees the message', thread.body.count === 1, JSON.stringify(thread.body).slice(0, 150));

    const emptyMsg = await call(rfqController.postMessage, {
      ...asCustomer, params: { rfqId: rfq._id.toString() }, body: { message: '   ' }
    });
    check('an empty message is rejected', emptyMsg.statusCode === 400);

    // -------------------------------------------------------------------------
    // 10. Accept + convert
    // -------------------------------------------------------------------------
    console.log('\n9. Accept and convert');
    const badAccept = await call(rfqController.acceptQuotation, {
      ...asCustomer,
      params: { rfqId: rfq._id.toString() },
      body: { quotationId: new mongoose.Types.ObjectId().toString() }
    });
    check('a foreign quotation cannot be accepted', badAccept.statusCode === 400);

    const acceptRes = await call(rfqController.acceptQuotation, {
      ...asCustomer,
      params: { rfqId: rfq._id.toString() },
      body: { quotationId: quotation._id.toString() }
    });
    check('accept returns 200', acceptRes.statusCode === 200, JSON.stringify(acceptRes.body).slice(0, 200));

    live = await RFQ.findById(rfq._id);
    check('RFQ is accepted', live.status === 'accepted' && String(live.acceptedQuotationId) === String(quotation._id));

    const convertRes = await call(rfqController.convertToOrder, {
      ...asCustomer,
      params: { rfqId: rfq._id.toString() },
      body: { paymentMethod: 'COD' }
    });
    check('convert returns 201', convertRes.statusCode === 201, JSON.stringify(convertRes.body).slice(0, 300));

    const order = await Order.findById(convertRes.body.data.order._id);
    created.orders.push(order._id);

    check('order carries the quoted line', order.orderItems.length === 1
      && order.orderItems[0].quantity === 2000 && order.orderItems[0].price === 85);
    check('order total matches the quotation grand total', order.totalPrice === quotation.pricing.grandTotal,
      `${order.totalPrice} vs ${quotation.pricing.grandTotal}`);
    check('order tax matches the quotation GST', order.taxAmount === quotation.pricing.taxes.totalGST);
    check('order belongs to the quoting seller', String(order.seller) === String(seller._id));
    check('delivery address taken from the RFQ', order.shippingAddress.pincode === '452001');

    live = await RFQ.findById(rfq._id);
    check('RFQ is converted_to_order', live.status === 'converted_to_order');
    check('order linked back onto the RFQ', String(live.convertedOrderId) === String(order._id));
    check('audit trail captured every transition',
      live.statusHistory.map((h) => h.status).join(' > ') === 'submitted > quoted > negotiation > accepted > converted_to_order',
      live.statusHistory.map((h) => h.status).join(' > '));
    check('every audit entry has an actor and a timestamp',
      live.statusHistory.every((h) => h.changedAt && h.changedByRole));

    const doubleConvert = await call(rfqController.convertToOrder, {
      ...asCustomer, params: { rfqId: rfq._id.toString() }, body: {}
    });
    check('an RFQ cannot be converted twice', doubleConvert.statusCode === 400);

    // -------------------------------------------------------------------------
    // 11. Conversion refuses unmapped lines
    // -------------------------------------------------------------------------
    console.log('\n10. Conversion guard for free-text quotes');
    const freeTextQuote = await call(rfqController.submitQuote, {
      ...asAdmin,
      params: { rfqId: rfq2._id.toString() },
      body: { items: [{ description: 'Unlisted marble', quantity: 10, unit: 'sq.ft', unitRate: 500, taxRate: 18 }] }
    });
    created.quotations.push(freeTextQuote.body.data.quotation._id);
    await call(rfqController.acceptQuotation, {
      ...asCustomer,
      params: { rfqId: rfq2._id.toString() },
      body: { quotationId: freeTextQuote.body.data.quotation._id.toString() }
    });
    const blocked = await call(rfqController.convertToOrder, {
      ...asCustomer, params: { rfqId: rfq2._id.toString() }, body: {}
    });
    check('unmapped quote lines block conversion with a clear reason',
      blocked.statusCode === 400 && Array.isArray(blocked.body.unmappedLines),
      JSON.stringify(blocked.body).slice(0, 200));

    // -------------------------------------------------------------------------
    // 12. Analytics
    // -------------------------------------------------------------------------
    console.log('\n11. GET /api/rfq/analytics');
    const analytics = await call(rfqController.getAnalytics, { ...asAdmin, query: {} });
    check('analytics returns a funnel', analytics.statusCode === 200
      && typeof analytics.body.data.funnel.conversionRate === 'number',
      JSON.stringify(analytics.body).slice(0, 200));
    check('analytics reports SLA figures', typeof analytics.body.data.sla.withinSlaRate === 'number');

    // -------------------------------------------------------------------------
    // 13. Sample requests
    // -------------------------------------------------------------------------
    console.log('\n12. Sample requests');
    const eligibility = await call(sampleController.getEligibility, asCustomer);
    check('eligibility returns the free quota', eligibility.statusCode === 200
      && eligibility.body.data.freeLimit >= 1, JSON.stringify(eligibility.body).slice(0, 200));
    check('a verified enterpriser is auto-approve eligible', eligibility.body.data.autoApprove === true);

    const sampleRes = await call(sampleController.createSampleRequest, {
      ...asCustomer,
      body: {
        items: [{ productId: product._id.toString(), shade: 'Ivory', quantity: 1 }],
        deliveryAddress: { pincode: '452001', fullAddress: '12 Site Road, Indore', city: 'Indore' },
        purpose: 'project'
      }
    });
    check('sample request created', sampleRes.statusCode === 201, JSON.stringify(sampleRes.body).slice(0, 300));

    const sample = await SampleRequest.findById(sampleRes.body.data._id);
    created.samples.push(sample._id);

    check('request number matches SMP-YYYY-NNNN', /^SMP-\d{4}-\d{4}$/.test(sample.requestNumber), sample.requestNumber);
    check('verified contractor auto-approved', sample.status === 'approved' && sample.autoApproved === true);
    check('within the free quota, no charge', sample.chargeAmount === 0 && sample.freeQuotaUsed === true);

    const notSampleable = await Product.findOne({ sampleAvailable: { $ne: true } }).select('_id').lean();
    if (notSampleable) {
      const rejected = await call(sampleController.createSampleRequest, {
        ...asCustomer,
        body: {
          items: [{ productId: String(notSampleable._id) }],
          deliveryAddress: { pincode: '452001', fullAddress: 'X' },
          purpose: 'personal'
        }
      });
      check('a product outside the sample programme is refused', rejected.statusCode === 400
        && /sample programme|not offered/.test(rejected.body.error), JSON.stringify(rejected.body).slice(0, 200));
    }

    const tooManyItems = await call(sampleController.createSampleRequest, {
      ...asCustomer,
      body: {
        items: Array.from({ length: 6 }, () => ({ productId: product._id.toString() })),
        deliveryAddress: { pincode: '452001', fullAddress: 'X' },
        purpose: 'personal'
      }
    });
    check('more than 5 sample products is refused', tooManyItems.statusCode === 400);

    console.log('\n13. Sample lifecycle');
    const earlyDispatch = await call(sampleController.dispatchSampleRequest, {
      ...asSeller, params: { id: sample._id.toString() }, body: {}
    });
    check('dispatch without an AWB is refused', earlyDispatch.statusCode === 400);

    const dispatched = await call(sampleController.dispatchSampleRequest, {
      ...asSeller,
      params: { id: sample._id.toString() },
      body: { awb: 'SMOKE123456', partnerName: 'Bluedart' }
    });
    check('dispatch recorded with the AWB', dispatched.statusCode === 200
      && dispatched.body.data.courier.awb === 'SMOKE123456');

    const delivered = await call(sampleController.markDelivered, {
      ...asSeller, params: { id: sample._id.toString() }, body: {}
    });
    check('delivery recorded', delivered.statusCode === 200 && delivered.body.data.status === 'delivered');

    const feedback = await call(sampleController.submitFeedback, {
      ...asCustomer,
      params: { id: sample._id.toString() },
      body: { verdict: 'like', comment: 'Shade matches the moodboard.' }
    });
    check('feedback accepted', feedback.statusCode === 200 && feedback.body.data.status === 'feedback_given');
    check('a "like" surfaces the RFQ and project CTAs',
      feedback.body.nextSteps.some((s) => s.action === 'rfq') && feedback.body.nextSteps.some((s) => s.action === 'project'),
      JSON.stringify(feedback.body.nextSteps));

    const doubleFeedback = await call(sampleController.submitFeedback, {
      ...asCustomer, params: { id: sample._id.toString() }, body: { verdict: 'dislike' }
    });
    check('feedback cannot be given twice', doubleFeedback.statusCode === 400);

    const outOfOrder = await call(sampleController.approveSampleRequest, {
      ...asSeller, params: { id: sample._id.toString() }, body: {}
    });
    check('an out-of-order transition is refused with the allowed moves',
      outOfOrder.statusCode === 400 && /terminal state|Allowed next/.test(outOfOrder.body.error),
      JSON.stringify(outOfOrder.body).slice(0, 160));

    // -------------------------------------------------------------------------
    // 14. SLA sweep
    // -------------------------------------------------------------------------
    console.log('\n14. SLA sweep');
    const breachable = await RFQ.findById(rfq2._id);
    await RFQ.updateOne(
      { _id: rfq2._id },
      { $set: { status: 'submitted', slaDueAt: new Date(Date.now() - 3600000), slaEscalatedAt: null } }
    );
    const slaResult = await rfqSlaService.escalateBreachedSLAs();
    const escalated = await RFQ.findById(rfq2._id);
    check('a breached RFQ is escalated exactly once', slaResult.escalated >= 1 && !!escalated.slaEscalatedAt);
    check('the breach is written into the audit history',
      escalated.statusHistory.some((h) => /SLA breached/.test(h.note || '')));

    const secondSweep = await rfqSlaService.escalateBreachedSLAs();
    const stillOne = await RFQ.findById(rfq2._id);
    check('a second sweep does not re-escalate the same RFQ',
      stillOne.statusHistory.filter((h) => /SLA breached/.test(h.note || '')).length === 1);

    await RFQ.updateOne({ _id: rfq2._id }, { $set: { expiresAt: new Date(Date.now() - 3600000) } });
    await rfqSlaService.expireStaleRFQs();
    const expired = await RFQ.findById(rfq2._id);
    check('a stale RFQ is expired by the sweep', expired.status === 'expired');
    void breachable;
  } catch (err) {
    failed += 1;
    console.error('\n  ERROR  the run aborted:', err.message);
    console.error(err.stack.split('\n').slice(0, 6).join('\n'));
  } finally {
    // -------------------------------------------------------------------------
    // Cleanup — every document this script created
    // -------------------------------------------------------------------------
    console.log('\nCleaning up...');
    await RFQMessage.deleteMany({ rfqId: { $in: created.rfqs } });
    await Notification.deleteMany({ userId: { $in: created.users } });
    await SampleRequest.deleteMany({ _id: { $in: created.samples } });
    await Order.deleteMany({ _id: { $in: created.orders } });
    await Quotation.deleteMany({ _id: { $in: created.quotations } });
    await RFQ.deleteMany({ _id: { $in: created.rfqs } });
    await Product.deleteMany({ _id: { $in: created.products } });
    await Seller.deleteMany({ _id: { $in: created.sellers } });
    await User.deleteMany({ _id: { $in: created.users } });
    console.log('Cleanup done.');

    console.log(`\n${passed} passed, ${failed} failed`);
    await mongoose.disconnect();
    process.exit(failed === 0 ? 0 : 1);
  }
}

run().catch(async (err) => {
  console.error('\nFATAL:', err.message);
  console.error(err.stack);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
