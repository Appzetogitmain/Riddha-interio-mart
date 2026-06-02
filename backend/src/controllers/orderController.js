const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Admin = require('../models/Admin');
const Seller = require('../models/Seller');
const Coupon = require('../models/Coupon');
const paginate = require('../utils/paginate');
const { geocodeAddress } = require('../utils/geocoder');

const { 
  notifySellerNewOrder, 
  notifyAdminNewOrder, 
  notifyDeliveryAssignment, 
  notifySellerDeliveryResponse,
  notifyAdminDeliveryResponse,
  notifyUserOrderStatus,
  notifyLowStock
} = require('../socket');
const { processInvoiceAsync } = require('../utils/invoiceService');
const pricingService = require('../services/pricingService');

// @desc    Create new order(s) handling multi-seller cart
// @route   POST /api/orders
// @access  Private
exports.addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    businessDetails,
    couponCode
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ success: false, message: 'No order items' });
  }

  // Pre-validate Coupon early if supplied to save database locking resources
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
      isActive: true,
      expiryDate: { $gte: new Date() }
    });
    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its redemption limit.' });
    }
  }

  // 1. COD Eligibility Validation (Fast, read-only pre-checks before transaction)
  if (paymentMethod === 'COD') {
    try {
      const eligibility = await getCodEligibility(orderItems, shippingAddress ? shippingAddress.pincode : null);
      if (!eligibility.eligible) {
        return res.status(400).json({ success: false, message: eligibility.reason });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Reserve Stock atomically inside the Mongoose session
    const inventoryService = require('../services/inventoryService');
    const reservationsList = [];

    try {
      for (const item of orderItems) {
        // Reserve stock hold for 15 minutes inside the session
        const reservation = await inventoryService.reserveStock(
          req.user.id,
          item.product,
          item.quantity,
          15,
          session
        );
        reservationsList.push(reservation);
      }
    } catch (reserveError) {
      throw new Error(`Checkout failed: ${reserveError.message}`);
    }

    // 3. Secure backend calculation of all items
    const checkoutPricing = await pricingService.calculateCartPricing(orderItems);

    // 4. Group items by Seller
    const groupedItems = {};
    for (const item of checkoutPricing.enrichedItems) {
      const sId = item.seller.toString();
      const sType = item.sellerType || 'Seller';
      
      if (!groupedItems[sId]) {
        groupedItems[sId] = {
          seller: sId,
          sellerType: sType,
          items: []
        };
      }
      
      groupedItems[sId].items.push(item);
    }

    // If a coupon code was supplied, verify if the seller of the coupon actually has products in this order.
    if (coupon) {
      const couponSellerId = coupon.seller.toString();
      if (!groupedItems[couponSellerId]) {
        throw new Error('This coupon is not applicable to any products in your cart.');
      }
    }

    // 5. Create Orders and Commit Stock Reservations
    const createdOrders = [];
    const lowStockAlerts = [];

    for (const sellerId in groupedItems) {
      const group = groupedItems[sellerId];
      
      // Calculate exact pricing details for this seller order group
      const groupPricing = await pricingService.calculateCartPricing(
        group.items.map(i => ({ product: i.product, quantity: i.quantity }))
      );

      // Perform secure inter-state vs intra-state tax breakdown
      const taxService = require('../services/taxService');
      const taxCalculation = await taxService.calculateTaxes(groupPricing.enrichedItems, shippingAddress);

      let couponDiscount = 0;
      if (coupon && coupon.seller.toString() === sellerId) {
        // Load, validate, and atomically increment the coupon usedCount within the transaction
        const couponInSession = await Coupon.findOneAndUpdate(
          {
            _id: coupon._id,
            usedCount: { $lt: coupon.usageLimit },
            isActive: true,
            expiryDate: { $gte: new Date() }
          },
          { $inc: { usedCount: 1 } },
          { new: true, session }
        );

        if (!couponInSession) {
          throw new Error('This coupon code is invalid, expired, or has reached its redemption limit.');
        }

        const groupSellingTotal = groupPricing.subtotal - groupPricing.discountAmount;
        if (groupSellingTotal < couponInSession.minPurchaseAmount) {
          throw new Error(`Minimum purchase amount of ₹${couponInSession.minPurchaseAmount} is required to use this coupon.`);
        }

        if (couponInSession.discountType === 'percentage') {
          couponDiscount = (groupSellingTotal * couponInSession.discountValue) / 100;
          if (couponInSession.maxDiscountAmount && couponDiscount > couponInSession.maxDiscountAmount) {
            couponDiscount = couponInSession.maxDiscountAmount;
          }
        } else if (couponInSession.discountType === 'flat') {
          couponDiscount = couponInSession.discountValue;
        }

        if (couponDiscount > groupSellingTotal) {
          couponDiscount = groupSellingTotal;
        }

        couponDiscount = Number(couponDiscount.toFixed(2));

        // Adjust prices proportionally across items in this group
        const ratio = groupSellingTotal > 0 ? (groupSellingTotal - couponDiscount) / groupSellingTotal : 0;
        
        // Adjust the tax calculation values as well
        taxCalculation.totalTax = Number((taxCalculation.totalTax * ratio).toFixed(2));
        taxCalculation.cgst = Number((taxCalculation.cgst * ratio).toFixed(2));
        taxCalculation.sgst = Number((taxCalculation.sgst * ratio).toFixed(2));
        taxCalculation.igst = Number((taxCalculation.igst * ratio).toFixed(2));
        taxCalculation.taxableAmount = Number((taxCalculation.taxableAmount * ratio).toFixed(2));

        // Adjust items in this group so saved orderItems have corrected post-discount prices
        group.items.forEach(item => {
          item.price = Number((item.price * ratio).toFixed(2));
        });
      }
      
      const isCod = paymentMethod === 'COD';
      
      // Geocode Shipping Address
      const shippingAddressText = `${shippingAddress.fullAddress}, ${shippingAddress.city}, ${shippingAddress.pincode}`;
      const shippingCoords = await geocodeAddress(shippingAddressText);
      
      // Geocode Seller Address
      let sellerCoords = null;
      if (group.sellerType === 'Seller') {
        const sellerObj = await Seller.findById(group.seller).session(session);
        if (sellerObj && sellerObj.shopAddress) {
          sellerCoords = await geocodeAddress(sellerObj.shopAddress);
        }
      }
      
      // Fallback coordinate checks to ensure coordinates are always defined
      const resolvedShippingCoords = shippingCoords || { latitude: 26.9124, longitude: 75.7873 };
      const resolvedSellerCoords = sellerCoords || { latitude: 26.9230, longitude: 75.7950 };
      
      const order = new Order({
        orderItems: group.items,
        user: req.user.id,
        seller: group.seller,
        sellerType: group.sellerType,
        shippingAddress,
        paymentMethod,
        itemsPrice: Number((groupPricing.subtotal - groupPricing.discountAmount - couponDiscount).toFixed(2)),
        shippingPrice: groupPricing.shippingPrice,
        taxAmount: taxCalculation.totalTax,
        cgst: taxCalculation.cgst,
        sgst: taxCalculation.sgst,
        igst: taxCalculation.igst,
        taxType: taxCalculation.items[0] ? taxCalculation.items[0].taxType : 'intra-state',
        discountAmount: groupPricing.discountAmount + couponDiscount,
        pricingBreakdown: {
          subtotal: groupPricing.subtotal,
          taxAmount: taxCalculation.totalTax,
          cgst: taxCalculation.cgst,
          sgst: taxCalculation.sgst,
          igst: taxCalculation.igst,
          shippingPrice: groupPricing.shippingPrice,
          discountAmount: groupPricing.discountAmount + couponDiscount,
          totalPrice: Number((groupPricing.totalPrice - couponDiscount).toFixed(2))
        },
        totalPrice: Number((groupPricing.totalPrice - couponDiscount).toFixed(2)),
        isPaid: false,
        paidAt: undefined,
        paymentStatus: 'pending',
        status: isCod ? 'Processing' : 'Pending',
        businessDetails,
        shippingCoordinates: resolvedShippingCoords,
        sellerCoordinates: resolvedSellerCoords
      });

      // Save order inside database transaction session
      const savedOrder = await order.save({ session });
      createdOrders.push(savedOrder);

      // Commit reservations (Atomic and Concurrency-Safe inside session)
      const InventoryReservation = require('../models/InventoryReservation');
      for (const item of group.items) {
        const matchedRes = reservationsList.find(res => res.product.toString() === item.product.toString());
        if (!matchedRes) {
          throw new Error(`Active stock hold reservation not found for ${item.name}`);
        }

        // Link the reservation hold directly to this newly created order!
        await InventoryReservation.updateOne(
          { _id: matchedRes._id },
          { $set: { order: savedOrder._id } },
          { session }
        );

        if (isCod) {
          await inventoryService.commitReservation(matchedRes._id, session);

          // Fetch updated product for low stock alerts check
          const updatedProduct = await Product.findById(item.product).session(session);
          if (updatedProduct && updatedProduct.countInStock <= 5) {
            lowStockAlerts.push({
              seller: updatedProduct.seller,
              data: {
                productId: updatedProduct._id,
                name: updatedProduct.name,
                remainingStock: updatedProduct.countInStock
              }
            });
          }
        }
      }
    }

    // 6. Clear user cart inside transaction
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] }, { session });

    // Commit transaction atomically
    await session.commitTransaction();
    session.endSession();

    // 7. Post-Commit Actions (Low stock alerts, invoice processing, socket notifications)
    for (const alert of lowStockAlerts) {
      notifyLowStock(alert.seller, alert.data);
    }

    for (const savedOrder of createdOrders) {
      // Create Tax Audit Log for taxation system records
      try {
        const taxService = require('../services/taxService');
        const taxCalculation = {
          totalTax: savedOrder.taxAmount,
          cgst: savedOrder.cgst,
          sgst: savedOrder.sgst,
          igst: savedOrder.igst,
          taxableAmount: Number((savedOrder.totalPrice - savedOrder.taxAmount).toFixed(2)),
          items: savedOrder.orderItems.map(item => {
            const isIntraState = savedOrder.taxType === 'intra-state';
            const gstFactor = 1 + ((item.gstRate || 18) / 100);
            const lineTax = (item.price * item.quantity) - ((item.price * item.quantity) / gstFactor);
            return {
              product: item.product,
              name: item.name,
              gstRate: item.gstRate || 18,
              taxAmount: Number(lineTax.toFixed(2)),
              cgst: isIntraState ? Number((lineTax / 2).toFixed(2)) : 0,
              sgst: isIntraState ? Number((lineTax / 2).toFixed(2)) : 0,
              igst: isIntraState ? 0 : Number(lineTax.toFixed(2)),
              sellerState: isIntraState ? (savedOrder.shippingAddress.state || 'Delhi') : 'Gujarat',
              shippingState: savedOrder.shippingAddress.state || 'Delhi',
              taxType: savedOrder.taxType
            };
          })
        };
        await taxService.createAuditLog(savedOrder, req.user.id, savedOrder.seller, taxCalculation, 'sale');
      } catch (logErr) {
        console.error('Audit logging error:', logErr.message);
      }

      // Post-commit actions for COD ONLY (Online actions happen in verifyPayment)
      if (paymentMethod === 'COD') {
        // Fire notifications
        try {
          const payload = {
            orderId: String(savedOrder._id),
            totalPrice: savedOrder.totalPrice,
            itemsCount: savedOrder.orderItems.reduce((sum, i) => sum + i.quantity, 0),
            status: savedOrder.status,
            createdAt: savedOrder.createdAt,
            customerName: req.user?.fullName,
            shippingCity: savedOrder.shippingAddress?.city
          };

          const group = groupedItems[savedOrder.seller.toString()];
          if (group && group.sellerType === 'Admin') {
            notifyAdminNewOrder(null, payload);
          } else {
            notifySellerNewOrder(savedOrder.seller, payload);
            notifyAdminNewOrder(null, payload); // Also notify admin for seller orders
          }
        } catch (e) {
          console.error('Socket notify failed:', e.message);
        }

        // Credit pending earnings to Seller Wallet
        try {
          const walletService = require('../services/walletService');
          await walletService.recordPendingSale(savedOrder);
        } catch (walletErr) {
          console.error('Failed to log pending earnings:', walletErr.message);
        }

        // Fire and forget invoice generation (Asynchronous)
        processInvoiceAsync(savedOrder._id, req.user.id);

        // Queue Order Confirmation Email
        try {
          const User = require('../models/User');
          const customer = await User.findById(req.user.id);
          if (customer && customer.email) {
            const emailService = require('../services/emailService');
            await emailService.queueEmail(customer.email, `Order Confirmation - #${savedOrder._id.toString().slice(-8).toUpperCase()}`, 'order_confirmation', { order: savedOrder });
          }
        } catch (emailErr) {
          console.error('Failed to queue order confirmation email:', emailErr.message);
        }
      }
    }

    // Process Referral First Order reward for referrer (COD only)
    if (paymentMethod === 'COD') {
      try {
        const referralService = require('../services/referralService');
        await referralService.processFirstOrderReward(req.user.id, createdOrders[0]._id);
      } catch (refOrderRewardErr) {
        console.error('Referral order reward processing failed:', refOrderRewardErr.message);
      }
    }

    let razorpayOrder = null;
    if (paymentMethod !== 'COD') {
      const { createRazorpayOrder } = require('../utils/paymentGateway');
      const totalAmount = createdOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      try {
        razorpayOrder = await createRazorpayOrder(totalAmount, `receipt_${createdOrders[0]._id}`);
        // Store razorpay_order_id in all orders
        for (const order of createdOrders) {
          order.paymentResult = {
            id: razorpayOrder.id,
            status: 'created'
          };
          await order.save();
        }
      } catch (rpErr) {
        console.error('Razorpay Order Creation Failed:', rpErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: createdOrders,
      razorpayOrder
    });

  } catch (error) {
    // Abort Mongoose transaction if it was active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Order creation transaction aborted, executing saga rollback:', error.message);

    // Saga Manual Rollback: Revert any mutations if transaction support was missing (local standalone fallback)
    try {
      const inventoryService = require('../services/inventoryService');
      const Coupon = require('../models/Coupon');
      
      for (const res of reservationsList) {
        if (res && res._id) {
          await inventoryService.releaseReservation(res._id).catch(e => 
            console.error(`[SAGA ROLLBACK ERROR] Failed to release reservation ${res._id}:`, e.message)
          );
        }
      }

      for (const savedOrder of createdOrders) {
        if (savedOrder && savedOrder._id) {
          await Order.deleteOne({ _id: savedOrder._id }).catch(e =>
            console.error(`[SAGA ROLLBACK ERROR] Failed to delete order ${savedOrder._id}:`, e.message)
          );
        }
      }

      if (coupon && coupon.seller) {
        await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: -1 } }).catch(e =>
          console.error(`[SAGA ROLLBACK ERROR] Failed to restore coupon ${coupon._id}:`, e.message)
        );
      }
      console.log('[SAGA SUCCESS] Manual rollback completed successfully.');
    } catch (rollbackErr) {
      console.error('[SAGA CRITICAL] Saga manual rollback encountered failures:', rollbackErr.message);
    }

    const isNotFound = error.message.includes('Product not found');
    res.status(isNotFound ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email')
      .populate('seller', 'fullName shopName email phone shopAddress')
      .populate('deliveryBoy', 'fullName email phone avatar vehicleType vehicleNumber');

    if (order) {
      res.status(200).json({
        success: true,
        data: order
      });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const result = await paginate(Order, { user: req.user.id }, req);
    res.status(200).json({
      success: true,
      count: result.data.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin/Seller)
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const query = {};
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const isAdmin = userRole === 'admin';
    const isSeller = userRole === 'seller';
    const isDelivery = userRole === 'delivery';

    // Apply optional date range filters
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Apply status filters if passed
    if (req.query.deliveryStatus) {
      query.deliveryStatus = req.query.deliveryStatus;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // If user is seller, only show orders belonging to them or containing their products
    if (isSeller) {
      query.$or = [
        { seller: req.user.id },
        { 'orderItems.seller': req.user.id }
      ];
    }

    // Filter out unpaid online orders for Sellers and Admins so they don't fulfill abandoned checkouts
    if (isSeller || isAdmin) {
      query.$and = [
        { 
          $or: [
            { paymentMethod: 'COD' },
            { isPaid: true }
          ]
        }
      ];
    }

    // If user is delivery partner, show orders assigned to them or available in pool
    if (isDelivery) {
      const servicePincodes = req.user.servicePincodes || [];
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      query.$or = [
        { deliveryBoy: req.user.id },
        { 
          deliveryStatus: { $in: ['None', 'Rejected'] },
          'shippingAddress.pincode': { $in: servicePincodes },
          rejectedBy: {
            $not: {
              $elemMatch: {
                deliveryBoy: req.user.id,
                rejectedAt: { $gte: twentyFourHoursAgo }
              }
            }
          }
        }
      ];
      query.status = { $in: ['Processing', 'Shipped', 'Delivered'] };
      // Delivery partners also shouldn't see unpaid online orders
      query.$and = [
        { 
          $or: [
            { paymentMethod: 'COD' },
            { isPaid: true }
          ]
        }
      ];
    }

    const populateOptions = [
      { path: 'user', select: 'fullName email' },
      { 
        path: 'seller', 
        select: 'shopName fullName email',
        transform: (doc, id) => {
          if (!doc && id) return { _id: id, shopName: 'Riddha Mart (Admin)', fullName: 'Riddha Mart' };
          if (doc && !doc.shopName) return { ...doc, shopName: 'Riddha Mart (Official)' };
          return doc;
        }
      },
      { path: 'deliveryBoy', select: 'fullName email phone' }
    ];

    const result = await paginate(Order, query, req, populateOptions);

    res.status(200).json({
      success: true,
      count: result.data.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      // BOLA/IDOR Authorization Checks
      if (req.user.role === 'seller' && order.seller.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized: You do not own this order.' });
      }

      if (req.user.role === 'delivery' && (!order.deliveryBoy || order.deliveryBoy.toString() !== req.user.id)) {
        return res.status(403).json({ success: false, error: 'Not authorized: You are not assigned to this order.' });
      }

      const newStatus = req.body.status;

      // Restrict delivery partner status transitions to Picked and Out for Delivery only
      if (req.user.role === 'delivery') {
        const permittedStates = ['Picked', 'Out for Delivery'];
        if (!permittedStates.includes(newStatus)) {
          return res.status(403).json({ 
            success: false, 
            error: `Security Guard: Delivery partners cannot transition order status to "${newStatus}" directly. Use verify-otp to complete deliveries.` 
          });
        }
      }
      
      // Early exit if status is identical to avoid double-processing
      if (order.status === newStatus) {
        return res.status(200).json({ success: true, data: order });
      }

      // 1. Guard against modifications to already Cancelled orders
      if (order.status === 'Cancelled') {
        return res.status(400).json({ success: false, error: 'Cancelled orders cannot be modified.' });
      }

      // 2. Guard against invalid transitions on Delivered orders
      if (order.status === 'Delivered' && newStatus === 'Cancelled') {
        return res.status(400).json({ success: false, error: 'Delivered orders cannot be cancelled.' });
      }
      
      // Define valid overall statuses for the Order model
      const validOverallStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      
      // If the new status is a valid overall status, update it
      if (validOverallStatuses.includes(newStatus)) {
        order.status = newStatus;
      }
      
      // Always handle delivery status tracking
      const deliveryTrackingStatuses = ['Accepted', 'Picked', 'Out for Delivery', 'Delivered', 'Rejected'];
      if (deliveryTrackingStatuses.includes(newStatus)) {
        order.deliveryStatus = newStatus;
        
        // Logical mapping: if picked or out for delivery, overall status is 'Shipped'
        if (newStatus === 'Picked' || newStatus === 'Out for Delivery') {
          order.status = 'Shipped';
        }

        // Generate and Send OTP
        if (newStatus === 'Out for Delivery' && !order.deliveryOtp) {
          const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP
          order.deliveryOtp = otp;
          
          // Log OTP to console to help with local testing!
          console.log(`\n========================================`);
          console.log(`[TESTING OTP] Delivery OTP for Order #${order._id.toString().slice(-8).toUpperCase()} is: ${otp}`);
          console.log(`========================================\n`);

          try {
            const User = require('../models/User');
            const customer = await User.findById(order.user);
            if (customer && customer.email) {
              const emailService = require('../services/emailService');
              // We queue it with standard structure
              await emailService.queueEmail(
                customer.email, 
                `Delivery OTP for Order #${order._id.toString().slice(-8).toUpperCase()}`, 
                'delivery_otp', 
                { order, otp }
              );
            }
          } catch(e) {
            console.error('Failed to queue OTP email', e);
          }
        }
      }

      if (newStatus === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.status = 'Delivered';
        order.deliveryStatus = 'Delivered';
        
        // COD Payment Cash Collection transition
        if (order.paymentMethod === 'COD') {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.paymentStatus = 'paid';
        }
      }

      if (newStatus === 'Cancelled') {
        // Restore stock atomically
        const inventoryService = require('../services/inventoryService');
        for (const item of order.orderItems) {
          await inventoryService.returnStock(item.product, item.quantity);
        }
      }

      const updatedOrder = await order.save();

      // Clear pending seller escrow earnings and credit delivery partner wallet
      if (newStatus === 'Delivered') {
        try {
          const walletService = require('../services/walletService');
          await walletService.clearPendingSale(updatedOrder._id);
          
          if (updatedOrder.deliveryBoy) {
            await walletService.recordDeliveryEarning(
              updatedOrder.deliveryBoy,
              updatedOrder._id,
              updatedOrder.paymentMethod === 'COD',
              updatedOrder.totalPrice
            );
          }
        } catch (walletErr) {
          console.error('Failed to update wallets upon delivery:', walletErr.message);
        }
      }
      
      // Notify user about order status update
      notifyUserOrderStatus(order.user, {
        orderId: order._id,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        message: `Your order #${order._id.toString().slice(-8).toUpperCase()} is now ${order.deliveryStatus || order.status}.`
      });

      res.status(200).json({
        success: true,
        data: updatedOrder
      });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign order to delivery boy
// @route   PUT /api/orders/:id/assign-delivery
// @access  Private/Seller
exports.assignOrderToDeliveryBoy = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // BOLA/IDOR Authorization Check
    if (req.user.role === 'seller' && order.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized: You do not own this order.' });
    }

    const { deliveryBoyId } = req.body;
    order.deliveryBoy = deliveryBoyId;
    order.deliveryStatus = 'Pending';
    order.deliveryAssignmentTime = Date.now();

    await order.save();

    // Notify delivery boy
    notifyDeliveryAssignment(deliveryBoyId, {
      orderId: order._id,
      totalPrice: order.totalPrice,
      shippingAddress: order.shippingAddress,
      customerName: req.user.fullName
    });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Respond to delivery assignment
// @route   PUT /api/orders/:id/delivery-response
// @access  Private/Delivery
exports.respondToDeliveryAssignment = async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Verify assignment: if order.deliveryBoy is set, only that delivery partner can respond to it
    if (order.deliveryBoy && order.deliveryBoy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized: This order is assigned to another delivery partner.' });
    }

    order.deliveryStatus = status;
    if (status === 'Accepted') {
      order.status = 'Shipped';
      order.deliveryBoy = req.user.id; // Ensure the delivery boy who accepted it is recorded
    } else {
      // If rejected, clear deliveryBoy so someone else can be assigned or it goes back to pool
      order.deliveryBoy = undefined;
      
      if (!order.rejectedBy) {
        order.rejectedBy = [];
      }
      // Push to rejection blacklist to avoid showing it for 24 hours
      if (!order.rejectedBy.some(r => r.deliveryBoy.toString() === req.user.id.toString())) {
        order.rejectedBy.push({ deliveryBoy: req.user.id, rejectedAt: Date.now() });
      }
    }

    await order.save();
    
    // Notify corresponding owner (Seller or Admin)
    const notificationPayload = {
      orderId: order._id,
      status: status,
      deliveryBoyName: req.user.fullName
    };

    if (order.sellerType === 'Admin') {
      notifyAdminDeliveryResponse(null, notificationPayload);
    } else {
      notifySellerDeliveryResponse(order.seller, notificationPayload);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const RESTRICTED_COD_PINCODES = ['110001', '400001', '700001'];

const getCodEligibility = async (orderItems, pincode) => {
  // 1. Check pincode restriction
  if (pincode && RESTRICTED_COD_PINCODES.includes(pincode.trim())) {
    return {
      eligible: false,
      reason: `Cash On Delivery (COD) is not available for pincode ${pincode}.`
    };
  }

  // 2. Check product restriction
  if (orderItems && orderItems.length > 0) {
    for (const item of orderItems) {
      const productId = item.product || item._id || item.id;
      const product = await Product.findById(productId);
      if (!product) {
        return {
          eligible: false,
          reason: `Product not found: ${item.name || 'Unknown Item'}.`
        };
      }
      if (product.isCodAllowed === false) {
        return {
          eligible: false,
          reason: `The product "${product.name}" is restricted from Cash On Delivery (COD) payments.`
        };
      }
    }
  }

  return { eligible: true };
};

// @desc    Check Cash On Delivery (COD) eligibility
// @route   POST /api/orders/cod-eligibility
// @access  Private
exports.checkCodEligibility = async (req, res) => {
  const { orderItems, pincode } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ success: false, message: 'No order items provided' });
  }
  if (!pincode) {
    return res.status(400).json({ success: false, message: 'Shipping pincode is required' });
  }

  try {
    const eligibility = await getCodEligibility(orderItems, pincode);
    return res.status(200).json({
      success: true,
      eligible: eligibility.eligible,
      reason: eligibility.reason || ''
    });
  } catch (error) {
    console.error('COD eligibility check error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Calculate complete pricing breakdown for a cart
// @route   POST /api/orders/calculate-pricing
// @access  Private
exports.calculateOrderPricing = async (req, res, next) => {
  const { orderItems } = req.body;
  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ success: false, message: 'No cart items provided for pricing calculation' });
  }

  try {
    const pricing = await pricingService.calculateCartPricing(orderItems);
    return res.status(200).json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Pricing calculation error:', error.message);
    const statusCode = error.message.includes('not found') || error.message.includes('Invalid') ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/orders/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { verifyRazorpayPayment } = require('../utils/paymentGateway');
    
    const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // 1. Fetch unpaid orders matching the razorpay_order_id under the session (distributed lock)
    const orders = await Order.find({ 'paymentResult.id': razorpay_order_id, isPaid: false }).session(session);
    if (orders.length === 0) {
      // Either orders do not exist or they were already marked as paid by a webhook or concurrent request
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ success: true, message: 'Payment already verified and processed (idempotent)' });
    }

    const InventoryReservation = require('../models/InventoryReservation');
    const inventoryService = require('../services/inventoryService');
    const walletService = require('../services/walletService');
    const referralService = require('../services/referralService');
    
    const lowStockAlerts = [];

    for (const order of orders) {
      // Commit the active stock hold reservations for this order
      const reservations = await InventoryReservation.find({
        order: order._id,
        status: 'reserved'
      }).session(session);

      for (const reservation of reservations) {
        await inventoryService.commitReservation(reservation._id, session);

        // Fetch updated product for low stock alerts check
        const updatedProduct = await Product.findById(reservation.product).session(session);
        if (updatedProduct && updatedProduct.countInStock <= 5) {
          lowStockAlerts.push({
            seller: updatedProduct.seller,
            data: {
              productId: updatedProduct._id,
              name: updatedProduct.name,
              remainingStock: updatedProduct.countInStock
            }
          });
        }
      }

      // Update order payment status atomically
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentStatus = 'paid';
      order.status = 'Processing'; // Move status to Processing
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'captured',
        update_time: new Date().toISOString(),
        email_address: req.user.email
      };
      await order.save({ session });

      // Escrow pending sales credit to Seller Wallet
      await walletService.recordPendingSale(order, null, session);

      // Process Referral First Order reward for referrer
      await referralService.processFirstOrderReward(order.user, order._id, session);
    }

    await session.commitTransaction();
    session.endSession();

    // --- Post-Commit Side Effects (Executed asynchronously after successful transaction commit) ---
    // Fire low stock alerts if any
    for (const alert of lowStockAlerts) {
      notifyLowStock(alert.seller, alert.data);
    }

    for (const order of orders) {
      try {
        const payload = {
          orderId: String(order._id),
          totalPrice: order.totalPrice,
          itemsCount: order.orderItems.reduce((sum, i) => sum + i.quantity, 0),
          status: order.status,
          createdAt: order.createdAt,
          customerName: req.user?.fullName,
          shippingCity: order.shippingAddress?.city
        };

        if (order.sellerType === 'Admin') {
          notifyAdminNewOrder(null, payload);
        } else {
          notifySellerNewOrder(order.seller, payload);
          notifyAdminNewOrder(null, payload); // Also notify admin for seller orders
        }
      } catch (e) {
        console.error('Socket notify failed in verifyPayment:', e.message);
      }

      const { processInvoiceAsync } = require('../utils/invoiceService');
      processInvoiceAsync(order._id, req.user.id);

      try {
        const User = require('../models/User');
        const customer = await User.findById(req.user.id);
        if (customer && customer.email) {
          const emailService = require('../services/emailService');
          await emailService.queueEmail(customer.email, `Order Confirmation - #${order._id.toString().slice(-8).toUpperCase()}`, 'order_confirmation', { order });
        }
      } catch (emailErr) {
        console.error('Failed to queue email in verifyPayment:', emailErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('[FINTECH ERROR] verifyPayment transaction failed, rolled back:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Razorpay Webhook Callback Reconciler
// @route   POST /api/orders/webhook/razorpay
// @access  Public
exports.handleRazorpayWebhook = async (req, res) => {
  const crypto = require('crypto');
  const mongoose = require('mongoose');
  const { validateWebhookSignature } = require('../utils/paymentGateway');

  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';

  // 1. Verify Webhook Signature using raw body buffer
  if (!req.rawBody) {
    return res.status(400).json({ success: false, message: 'Raw body is missing for verification' });
  }

  const isValid = validateWebhookSignature(req.rawBody, signature, webhookSecret);
  if (!isValid) {
    console.error('[WEBHOOK ERROR] Razorpay signature mismatch!');
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event = req.body;
  console.log(`[WEBHOOK] Received event: ${event.event}`);

  // We are only interested in successful payment events
  if (event.event !== 'payment.captured' && event.event !== 'order.paid') {
    return res.status(200).json({ success: true, message: 'Unhandled event type ignored' });
  }

  const payload = event.payload;
  const razorpay_order_id = payload.payment?.entity?.order_id || payload.order?.entity?.id;
  const razorpay_payment_id = payload.payment?.entity?.id;
  const email_address = payload.payment?.entity?.email;

  if (!razorpay_order_id) {
    return res.status(400).json({ success: false, message: 'Razorpay order ID not found in payload' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Fetch unpaid orders matching the razorpay_order_id under the session (distributed lock)
    const orders = await Order.find({ 'paymentResult.id': razorpay_order_id, isPaid: false }).session(session);
    if (orders.length === 0) {
      // Already marked as paid by verifyPayment or a previous webhook trigger
      await session.commitTransaction();
      session.endSession();
      console.log(`[WEBHOOK] Orders matching ${razorpay_order_id} are already paid. Idempotent success.`);
      return res.status(200).json({ success: true, message: 'Already processed (idempotent)' });
    }

    const InventoryReservation = require('../models/InventoryReservation');
    const inventoryService = require('../services/inventoryService');
    const walletService = require('../services/walletService');
    const referralService = require('../services/referralService');
    
    const lowStockAlerts = [];

    for (const order of orders) {
      // Commit the active stock hold reservations for this order
      const reservations = await InventoryReservation.find({
        order: order._id,
        status: 'reserved'
      }).session(session);

      for (const reservation of reservations) {
        await inventoryService.commitReservation(reservation._id, session);

        // Fetch updated product for low stock alerts check
        const updatedProduct = await Product.findById(reservation.product).session(session);
        if (updatedProduct && updatedProduct.countInStock <= 5) {
          lowStockAlerts.push({
            seller: updatedProduct.seller,
            data: {
              productId: updatedProduct._id,
              name: updatedProduct.name,
              remainingStock: updatedProduct.countInStock
            }
          });
        }
      }

      // Reconcile order payment status atomically
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentStatus = 'paid';
      order.status = 'Processing';
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'captured',
        update_time: new Date().toISOString(),
        email_address: email_address || 'webhook@razorpay.com'
      };
      await order.save({ session });

      // Escrow pending sales credit to Seller Wallet
      await walletService.recordPendingSale(order, null, session);

      // Process Referral First Order reward for referrer
      await referralService.processFirstOrderReward(order.user, order._id, session);
    }

    await session.commitTransaction();
    session.endSession();

    // --- Post-Commit Side Effects (Executed asynchronously after successful transaction commit) ---
    // Fire low stock alerts if any
    for (const alert of lowStockAlerts) {
      notifyLowStock(alert.seller, alert.data);
    }

    for (const order of orders) {
      try {
        const socketPayload = {
          orderId: String(order._id),
          totalPrice: order.totalPrice,
          itemsCount: order.orderItems.reduce((sum, i) => sum + i.quantity, 0),
          status: order.status,
          createdAt: order.createdAt,
          customerName: 'Customer', // Webhooks lack active req.user context
          shippingCity: order.shippingAddress?.city
        };

        if (order.sellerType === 'Admin') {
          notifyAdminNewOrder(null, socketPayload);
        } else {
          notifySellerNewOrder(order.seller, socketPayload);
          notifyAdminNewOrder(null, socketPayload);
        }
      } catch (e) {
        console.error('Socket notify failed in Webhook:', e.message);
      }

      const { processInvoiceAsync } = require('../utils/invoiceService');
      processInvoiceAsync(order._id, order.user);

      try {
        const User = require('../models/User');
        const customer = await User.findById(order.user);
        if (customer && customer.email) {
          const emailService = require('../services/emailService');
          await emailService.queueEmail(customer.email, `Order Reconciled Confirmation - #${order._id.toString().slice(-8).toUpperCase()}`, 'order_confirmation', { order });
        }
      } catch (emailErr) {
        console.error('Failed to queue email in Webhook:', emailErr.message);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook payment reconciled successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('[WEBHOOK ERROR] Reconcile transaction failed, rolled back:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Delivery OTP
// @route   POST /api/orders/:id/verify-otp
// @access  Private/Delivery
exports.verifyDeliveryOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Verify assignment: only the assigned delivery partner can verify OTP
    if (!order.deliveryBoy || order.deliveryBoy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized: You are not the assigned delivery partner for this order.' });
    }
    
    // STATIC OTP BYPASS: allow 1234 if useMockOtpForDelivery environment variable is true
    const isStaticBypass = (process.env.useMockOtpForDelivery === 'true' || process.env.USE_MOCK_OTP_FOR_DELIVERY === 'true') && otp === '1234';

    if (!isStaticBypass && order.deliveryOtp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid delivery OTP provided.' });
    }
    
    // OTP matches, mark as delivered
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'Delivered';
    order.deliveryStatus = 'Delivered';
    
    if (order.paymentMethod === 'COD') {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentStatus = 'paid';
    }
    
    const updatedOrder = await order.save();
    
    try {
      const walletService = require('../services/walletService');
      await walletService.clearPendingSale(updatedOrder._id);
      
      if (updatedOrder.deliveryBoy) {
        await walletService.recordDeliveryEarning(
          updatedOrder.deliveryBoy,
          updatedOrder._id,
          updatedOrder.paymentMethod === 'COD',
          updatedOrder.totalPrice
        );
      }
    } catch (walletErr) {
      console.error('Failed to update wallets upon delivery:', walletErr.message);
    }
    
    // Notify User
    notifyUserOrderStatus(order.user, {
      orderId: order._id,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been successfully delivered.`
    });

    // Notify Seller / Admin
    const notificationPayload = {
      orderId: order._id,
      status: 'Delivered',
      deliveryBoyName: req.user.fullName
    };
    if (order.sellerType === 'Admin') {
      notifyAdminDeliveryResponse(null, notificationPayload);
    } else {
      notifySellerDeliveryResponse(order.seller, notificationPayload);
    }
    
    res.status(200).json({ success: true, data: updatedOrder, message: 'OTP verified successfully. Order Delivered.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resend Delivery OTP
// @route   POST /api/orders/:id/resend-otp
// @access  Private/Delivery
exports.resendDeliveryOtp = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify assignment: only the assigned delivery partner can resend OTP
    if (!order.deliveryBoy || order.deliveryBoy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized: You are not the assigned delivery partner for this order.' });
    }

    // Ensure state is appropriate (Out for Delivery)
    if (order.deliveryStatus !== 'Out for Delivery') {
      return res.status(400).json({ success: false, error: 'Cannot resend OTP: Order is not out for delivery yet.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate fresh 4 digit OTP
    order.deliveryOtp = otp;
    await order.save();

    // Log OTP to console to help with local testing!
    console.log(`\n========================================`);
    console.log(`[RESEND OTP] New Delivery OTP for Order #${order._id.toString().slice(-8).toUpperCase()} is: ${otp}`);
    console.log(`========================================\n`);

    try {
      const User = require('../models/User');
      const customer = await User.findById(order.user);
      if (customer && customer.email) {
        const emailService = require('../services/emailService');
        await emailService.queueEmail(
          customer.email, 
          `New Delivery OTP for Order #${order._id.toString().slice(-8).toUpperCase()}`, 
          'delivery_otp', 
          { order, otp }
        );
      }
    } catch (e) {
      console.error('Failed to queue OTP email', e);
    }

    res.status(200).json({ success: true, message: 'New OTP generated and sent to customer.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate coupon code for customer checkout review
// @route   POST /api/orders/validate-coupon
// @access  Private
exports.validateCoupon = async (req, res, next) => {
  const { couponCode, orderItems } = req.body;
  if (!couponCode) {
    return res.status(400).json({ success: false, message: 'Coupon code is required.' });
  }
  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items are required to validate coupon.' });
  }

  try {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase().trim(),
      isActive: true,
      expiryDate: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its redemption limit.' });
    }

    // Secure backend calculation of all items
    const checkoutPricing = await pricingService.calculateCartPricing(orderItems);

    // Group items by Seller
    const groupedItems = {};
    for (const item of checkoutPricing.enrichedItems) {
      const sId = item.seller.toString();
      const sType = item.sellerType || 'Seller';
      
      if (!groupedItems[sId]) {
        groupedItems[sId] = {
          seller: sId,
          sellerType: sType,
          items: []
        };
      }
      groupedItems[sId].items.push(item);
    }

    const couponSellerId = coupon.seller.toString();
    if (!groupedItems[couponSellerId]) {
      return res.status(400).json({ success: false, message: 'This coupon is not applicable to any products in your cart.' });
    }

    // Calculate exact pricing details for this seller order group
    const group = groupedItems[couponSellerId];
    const groupPricing = await pricingService.calculateCartPricing(
      group.items.map(i => ({ product: i.product, quantity: i.quantity }))
    );

    const groupSellingTotal = groupPricing.subtotal - groupPricing.discountAmount;
    if (groupSellingTotal < coupon.minPurchaseAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} is required for this coupon.` 
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (groupSellingTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Make sure discount is not more than group total
    if (discountAmount > groupSellingTotal) {
      discountAmount = groupSellingTotal;
    }

    return res.status(200).json({
      success: true,
      message: 'Coupon is valid!',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Number(discountAmount.toFixed(2)),
        seller: coupon.seller
      }
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCodEligibility = getCodEligibility;


