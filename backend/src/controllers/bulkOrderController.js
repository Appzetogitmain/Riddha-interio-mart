const BulkOrder = require('../models/BulkOrder');
const Product   = require('../models/Product');
const { notifySellerBulkOrder } = require('../socket');
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

    // Fire-and-forget: admin WhatsApp + seller notifications — never blocks the response
    sendBulkOrderWhatsApp(bulkOrder).catch(() => {});
    _notifySellers(bulkOrder).catch(() => {});

    res.status(201).json({ success: true, data: bulkOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Get bulk orders for a seller (only items belonging to them) ───────────
exports.getSellerBulkOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Find all products owned by this seller
    const sellerProducts = await Product.find({ seller: sellerId, sellerType: 'Seller' })
      .select('_id name')
      .lean();

    if (!sellerProducts.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const productIds    = sellerProducts.map(p => p._id);
    const productNames  = new Map(sellerProducts.map(p => [String(p._id), p.name]));

    // Find bulk orders that contain at least one of this seller's products
    const bulkOrders = await BulkOrder.find({
      'items.product': { $in: productIds }
    }).sort({ createdAt: -1 }).lean();

    // Strip each order to only the seller's items
    const result = bulkOrders.map(order => ({
      ...order,
      items: order.items.filter(i => i.product && productIds.some(pid => String(pid) === String(i.product)))
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Get all bulk orders (Admin) ────────────────────────────────────────────
exports.getAllBulkOrders = async (req, res) => {
  try {
    const bulkOrders = await BulkOrder.find().sort({ createdAt: -1 });
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
