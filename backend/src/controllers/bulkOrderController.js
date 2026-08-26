const BulkOrder = require('../models/BulkOrder');
const Product   = require('../models/Product');
const Seller    = require('../models/Seller');
const Category  = require('../models/Category');
const {
  notifySellerBulkOrder,
  notifyAdminNewBulkOrder,
  notifySellerBulkOrderAssignment,
  notifyAdminBulkOrderResponse,
  notifyAdminBulkOrderConfirmed
} = require('../socket');
const { sendBulkOrderWhatsApp, sendSellerBulkOrderWhatsApp } = require('../utils/whatsapp');

// ── Internal: populate products → group by seller → notify each seller ──────
async function _notifySellers(bulkOrder) {
  try {
    const productIds = bulkOrder.items.map(i => i.product).filter(Boolean);
    if (!productIds.length) return;

    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id seller sellerType')
      .populate({ path: 'seller', select: 'phone shopName fullName', model: 'Seller' })
      .lean();

    // productId (string) → populated product
    const productMap = {};
    products.forEach(p => { productMap[String(p._id)] = p; });

    // Group bulk-order items by seller
    const bySellerMap = {}; // sellerId → { seller, items[] }
    for (const item of bulkOrder.items) {
      const product = productMap[String(item.product)];
      if (!product?.seller || product.sellerType !== 'Seller') continue;
      const sid = String(product.seller._id);
      if (!bySellerMap[sid]) bySellerMap[sid] = { seller: product.seller, items: [] };
      bySellerMap[sid].items.push({ name: item.name, quantity: item.quantity });
    }

    for (const [sellerId, { seller, items }] of Object.entries(bySellerMap)) {
      const payload = {
        customerName:  bulkOrder.name,
        customerPhone: bulkOrder.phone,
        customerEmail: bulkOrder.email,
        items,
        message:  bulkOrder.message || '',
        orderId:  String(bulkOrder._id),
      };

      // Socket popup + persist notification
      await notifySellerBulkOrder(sellerId, payload);

      // WhatsApp to admin number (8305357624) with seller-specific breakdown
      sendSellerBulkOrderWhatsApp({
        ...payload,
        sellerName: seller.shopName || seller.fullName || 'Unknown Seller',
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[BulkOrder] Seller notify error:', err.message);
  }
}

// ── Create bulk order inquiry ──────────────────────────────────────────────
exports.createBulkOrder = async (req, res) => {
  try {
    const { name, phone, email, items, message } = req.body;
    const bulkOrder = await BulkOrder.create({ name, phone, email, items, message });

    // Fire-and-forget: admin WhatsApp + in-app notifications + seller notifications — never blocks the response
    sendBulkOrderWhatsApp(bulkOrder).catch(() => {});
    notifyAdminNewBulkOrder({
      customerName: bulkOrder.name,
      customerPhone: bulkOrder.phone,
      customerEmail: bulkOrder.email,
      items: bulkOrder.items,
      message: bulkOrder.message || '',
      orderId: String(bulkOrder._id),
    }).catch(() => {});
    _notifySellers(bulkOrder).catch(() => {});

    res.status(201).json({ success: true, data: bulkOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Get bulk orders for a seller — either their own products are directly in the
//    request, or admin assigned them the request for a quote (product or category match) ──
exports.getSellerBulkOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Find all products owned by this seller
    const sellerProducts = await Product.find({ seller: sellerId, sellerType: 'Seller' })
      .select('_id name')
      .lean();
    const productIds = sellerProducts.map(p => p._id);

    const bulkOrders = await BulkOrder.find({
      $or: [
        { 'items.product': { $in: productIds } },
        { 'assignments.seller': sellerId }
      ]
    }).sort({ createdAt: -1 }).lean();

    const result = bulkOrders.map(order => {
      const myAssignment = (order.assignments || []).find(a => String(a.seller) === String(sellerId)) || null;
      const hasDirectProductMatch = order.items.some(i => i.product && productIds.some(pid => String(pid) === String(i.product)));
      return {
        ...order,
        // An admin-assigned (category-match) request has no products this seller owns —
        // show the full request. Only narrow the item list for the direct-product-match case.
        items: hasDirectProductMatch && !myAssignment
          ? order.items.filter(i => i.product && productIds.some(pid => String(pid) === String(i.product)))
          : order.items,
        myAssignment
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Admin: suggest sellers to assign a bulk order to ───────────────────────
// Direct product match (the item already names a real product → that product's seller)
// takes priority; items with no product attached fall back to matching the item's
// category against each seller's declared sellingCategories.
exports.getSuggestedSellers = async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findById(req.params.id).lean();
    if (!bulkOrder) {
      return res.status(404).json({ success: false, message: 'Bulk order not found' });
    }

    const productIds = bulkOrder.items.map(i => i.product).filter(Boolean);
    const directSellerIds = new Set();
    if (productIds.length) {
      const products = await Product.find({ _id: { $in: productIds }, sellerType: 'Seller' })
        .select('seller')
        .lean();
      products.forEach(p => { if (p.seller) directSellerIds.add(String(p.seller)); });
    }

    const categoryNames = [...new Set(
      bulkOrder.items.filter(i => !i.product && i.category).map(i => i.category)
    )];
    const categorySellerIds = new Set();
    if (categoryNames.length) {
      const categories = await Category.find({ name: { $in: categoryNames } }).select('_id').lean();
      const categoryIds = categories.map(c => c._id);
      if (categoryIds.length) {
        const sellers = await Seller.find({ sellingCategories: { $in: categoryIds } }).select('_id').lean();
        sellers.forEach(s => categorySellerIds.add(String(s._id)));
      }
    }

    const alreadyAssigned = new Set((bulkOrder.assignments || []).map(a => String(a.seller)));
    const candidateIds = [...new Set([...directSellerIds, ...categorySellerIds])]
      .filter(id => !alreadyAssigned.has(id));

    const sellers = await Seller.find({ _id: { $in: candidateIds } })
      .select('fullName shopName email phone shopAddress status sellingCategories')
      .populate('sellingCategories', 'name')
      .lean();

    const result = sellers.map(s => ({
      ...s,
      matchType: directSellerIds.has(String(s._id)) ? 'product' : 'category'
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Admin: assign the bulk order to one or more sellers for a quote ───────
exports.assignBulkOrderToSellers = async (req, res) => {
  try {
    const { sellerIds } = req.body;
    if (!Array.isArray(sellerIds) || sellerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one seller to assign.' });
    }

    const bulkOrder = await BulkOrder.findById(req.params.id);
    if (!bulkOrder) {
      return res.status(404).json({ success: false, message: 'Bulk order not found' });
    }

    const productIds = bulkOrder.items.map(i => i.product).filter(Boolean);
    const directSellerIds = new Set();
    if (productIds.length) {
      const products = await Product.find({ _id: { $in: productIds } }).select('seller').lean();
      products.forEach(p => { if (p.seller) directSellerIds.add(String(p.seller)); });
    }

    const existingSellerIds = new Set((bulkOrder.assignments || []).map(a => String(a.seller)));
    const newlyAssignedIds = [];

    for (const sellerId of sellerIds) {
      if (existingSellerIds.has(String(sellerId))) continue; // don't double-assign
      bulkOrder.assignments.push({
        seller: sellerId,
        matchType: directSellerIds.has(String(sellerId)) ? 'product' : 'category',
        status: 'pending'
      });
      newlyAssignedIds.push(sellerId);
    }

    if (bulkOrder.status === 'Pending' && newlyAssignedIds.length > 0) {
      bulkOrder.status = 'Contacted';
    }
    await bulkOrder.save();

    for (const sellerId of newlyAssignedIds) {
      notifySellerBulkOrderAssignment(sellerId, {
        customerName: bulkOrder.name,
        items: bulkOrder.items,
        message: bulkOrder.message || '',
        orderId: String(bulkOrder._id)
      }).catch(() => {});
    }

    const populated = await BulkOrder.findById(bulkOrder._id)
      .populate({ path: 'assignments.seller', select: 'shopName fullName', model: 'Seller' });
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Seller: accept (with quote) or reject an assigned bulk order ───────────
exports.respondToBulkOrderAssignment = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { decision, availableQuantity, unitPrice, deliveryEstimate, notes } = req.body;

    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be "accepted" or "rejected".' });
    }
    if (decision === 'accepted' && (!availableQuantity || !unitPrice || !deliveryEstimate)) {
      return res.status(400).json({ success: false, message: 'Available quantity, unit price, and delivery estimate are required to accept.' });
    }

    const bulkOrder = await BulkOrder.findById(req.params.id);
    if (!bulkOrder) {
      return res.status(404).json({ success: false, message: 'Bulk order not found' });
    }

    const assignment = bulkOrder.assignments.find(a => String(a.seller) === String(sellerId));
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'This bulk order is not assigned to you.' });
    }

    assignment.status = decision;
    if (decision === 'accepted') {
      assignment.availableQuantity = availableQuantity;
      assignment.unitPrice = unitPrice;
      assignment.deliveryEstimate = deliveryEstimate;
      assignment.notes = notes || '';
    }
    assignment.respondedAt = new Date();

    await bulkOrder.save();

    const seller = await Seller.findById(sellerId).select('shopName fullName').lean();
    notifyAdminBulkOrderResponse({
      customerName: bulkOrder.name,
      sellerName: seller?.shopName || seller?.fullName || 'Seller',
      decision,
      availableQuantity: assignment.availableQuantity,
      unitPrice: assignment.unitPrice,
      deliveryEstimate: assignment.deliveryEstimate,
      orderId: String(bulkOrder._id)
    }).catch(() => {});

    res.status(200).json({ success: true, data: bulkOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Admin: pick an accepted seller response and email it to the customer as the
//    final offer, with a link for them to confirm ──────────────────────────
exports.sendOfferToCustomer = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const bulkOrder = await BulkOrder.findById(req.params.id);
    if (!bulkOrder) {
      return res.status(404).json({ success: false, message: 'Bulk order not found' });
    }

    const assignment = bulkOrder.assignments.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Seller response not found.' });
    }
    if (assignment.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only an accepted seller response can be sent as the final offer.' });
    }

    bulkOrder.finalAssignment = assignment._id;
    bulkOrder.offerSentAt = new Date();
    bulkOrder.status = 'Processing';
    await bulkOrder.save();

    try {
      const emailService = require('../services/emailService');
      const offerUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bulk-order-offer/${bulkOrder._id}`;
      const html = `
        <h2>Your Bulk Order Offer is Ready</h2>
        <p>Hi ${bulkOrder.name},</p>
        <p>We've put together an offer for your bulk order request:</p>
        <ul>
          <li><strong>Available Quantity:</strong> ${assignment.availableQuantity}</li>
          <li><strong>Price:</strong> Rs. ${assignment.unitPrice} / unit</li>
          <li><strong>Estimated Delivery:</strong> ${assignment.deliveryEstimate}</li>
        </ul>
        ${assignment.notes ? `<p><strong>Notes:</strong> ${assignment.notes}</p>` : ''}
        <p><a href="${offerUrl}" style="display:inline-block;padding:12px 24px;background:#189D91;color:#fff;text-decoration:none;border-radius:8px;">View &amp; Confirm Offer</a></p>
        <p>Riddha Interio Mart Team</p>
      `;
      await emailService.sendMailDirect(bulkOrder.email, 'Your Bulk Order Offer — Riddha Interio Mart', html);
    } catch (emailErr) {
      console.error('[BulkOrder] Failed to email offer to customer:', emailErr.message);
    }

    const populated = await BulkOrder.findById(bulkOrder._id)
      .populate({ path: 'assignments.seller', select: 'shopName fullName', model: 'Seller' });
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Public: customer views the final offer via the emailed link (no login required) ──
exports.getBulkOrderOffer = async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findById(req.params.id)
      .populate({ path: 'assignments.seller', select: 'shopName fullName', model: 'Seller' })
      .lean();

    if (!bulkOrder || !bulkOrder.finalAssignment) {
      return res.status(404).json({ success: false, message: 'No offer available for this bulk order yet.' });
    }

    const finalAssignment = (bulkOrder.assignments || []).find(a => String(a._id) === String(bulkOrder.finalAssignment));

    res.status(200).json({
      success: true,
      data: {
        _id: bulkOrder._id,
        name: bulkOrder.name,
        items: bulkOrder.items,
        status: bulkOrder.status,
        customerConfirmedAt: bulkOrder.customerConfirmedAt,
        offer: finalAssignment ? {
          sellerName: finalAssignment.seller?.shopName || finalAssignment.seller?.fullName || 'Riddha Verified Seller',
          availableQuantity: finalAssignment.availableQuantity,
          unitPrice: finalAssignment.unitPrice,
          deliveryEstimate: finalAssignment.deliveryEstimate,
          notes: finalAssignment.notes
        } : null
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Public: customer confirms the final offer (no login required) ─────────
exports.confirmBulkOrderOffer = async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findById(req.params.id);
    if (!bulkOrder || !bulkOrder.finalAssignment) {
      return res.status(404).json({ success: false, message: 'No offer available to confirm.' });
    }

    if (bulkOrder.customerConfirmedAt) {
      return res.status(200).json({ success: true, message: 'Already confirmed.', data: bulkOrder });
    }

    bulkOrder.customerConfirmedAt = new Date();
    bulkOrder.status = 'Resolved';
    await bulkOrder.save();

    notifyAdminBulkOrderConfirmed({
      customerName: bulkOrder.name,
      orderId: String(bulkOrder._id)
    }).catch(() => {});

    res.status(200).json({ success: true, data: bulkOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Get all bulk orders (Admin) ────────────────────────────────────────────
exports.getAllBulkOrders = async (req, res) => {
  try {
    const bulkOrders = await BulkOrder.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'assignments.seller', select: 'shopName fullName', model: 'Seller' });
    res.status(200).json({ success: true, data: bulkOrders });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Update bulk order status (Admin) ──────────────────────────────────────
exports.updateBulkOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Contacted', 'Processing', 'Resolved', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const bulkOrder = await BulkOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!bulkOrder) {
      return res.status(404).json({ success: false, message: 'Bulk order not found' });
    }

    res.status(200).json({ success: true, data: bulkOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Delete bulk order (Admin) ──────────────────────────────────────────────
exports.deleteBulkOrder = async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findByIdAndDelete(req.params.id);

    if (!bulkOrder) {
      return res.status(404).json({ success: false, message: 'Bulk order not found' });
    }

    res.status(200).json({ success: true, message: 'Bulk order deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
