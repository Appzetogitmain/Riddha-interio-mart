const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DispatchEvent = require('../models/DispatchEvent');
const ReturnDispatchEvent = require('../models/ReturnDispatchEvent');
const Return = require('../models/Return');
const { getIO } = require('../socket');

// Helper to calculate total order weight
const calculateOrderWeight = async (order) => {
  let totalWeight = 0;
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    const itemWeight = product && product.weight !== undefined ? product.weight : 1.5;
    totalWeight += itemWeight * item.quantity;
  }
  return totalWeight;
};

// Helper to determine allowed vehicle types based on total weight
const getEligibleVehicles = (weight) => {
  if (weight < 5) {
    // Light: any vehicle
    return ['Bike', 'Van', 'Truck', 'Bicycle', 'Motorcycle', 'Scooter', 'Car'];
  } else if (weight <= 20) {
    // Medium: motorized vehicles
    return ['Bike', 'Van', 'Truck', 'Motorcycle', 'Scooter', 'Car'];
  } else {
    // Heavy: strictly four-wheelers
    return ['Van', 'Truck', 'Car'];
  }
};

// Core Auto-Allocation and Broadcast Engine
exports.broadcastNewOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return console.error(`[Dispatch Engine] Order ${orderId} not found.`);

    // If order already has a deliveryBoy, do not dispatch
    if (order.deliveryBoy) return;

    const orderWeight = await calculateOrderWeight(order);
    const eligibleVehicles = getEligibleVehicles(orderWeight);
    const pincode = order.shippingAddress?.pincode;

    if (!pincode) {
      console.warn(`[Dispatch Engine] Order ${orderId} is missing shipping pincode.`);
      return;
    }

    // Find online, clocked-in, under-capacity riders in the service pincode zone
    const riders = await Delivery.find({
      status: 'Available',
      'activeShift.isClockedIn': true,
      servicePincodes: pincode,
      vehicleType: { $in: eligibleVehicles }
    });

    // Filter riders who have rejected this order in the last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const rejections = order.rejectedBy || [];
    
    const activeRejections = rejections
      .filter(r => new Date(r.rejectedAt) >= twentyFourHoursAgo)
      .map(r => r.deliveryBoy?.toString());

    const availableRiders = riders.filter(rider => {
      const riderIdStr = rider._id.toString();
      
      // 1. Check rejection blacklist
      if (activeRejections.includes(riderIdStr)) return false;

      // 2. Check volumetric limits (maxVolumeCapacity)
      const volumeLimit = rider.vehicleDetails?.maxVolumeCapacity || 4;
      if ((rider.activeShift?.currentPayloadCount || 0) >= volumeLimit) return false;

      // 3. Check carrying weight capacity (maxWeightCapacity)
      const weightLimit = rider.vehicleDetails?.maxWeightCapacity || 20;
      const currentWeight = rider.activeShift?.currentPayloadWeight || 0;
      if (currentWeight + orderWeight > weightLimit) return false;

      return true;
    });

    if (availableRiders.length === 0) {
      console.log(`[Dispatch Engine] No available eligible riders for Order #${order._id.toString().slice(-8).toUpperCase()}`);
      return;
    }

    // Sort riders by lowest current load count to distribute orders fairly
    availableRiders.sort((a, b) => (a.activeShift?.currentPayloadCount || 0) - (b.activeShift?.currentPayloadCount || 0));
    const selectedRider = availableRiders[0];

    const offeredAt = new Date();
    const expiresAt = new Date(offeredAt.getTime() + 60 * 1000); // 60s window

    // Create Offered Dispatch Event
    const event = await DispatchEvent.create({
      order: orderId,
      deliveryBoy: selectedRider._id,
      expiresAt
    });

    console.log(`[Dispatch Engine] Offering Order #${order._id.toString().slice(-8).toUpperCase()} to Partner "${selectedRider.fullName}" (Expires in 60s)`);

    // Emit live Socket.io alert to the courier's room
    let io;
    try {
      io = getIO();
    } catch (e) {
      console.warn('[Dispatch Engine] Socket.io not initialized, skipping socket broadcast.');
    }

    if (io) {
      io.to(`delivery:${selectedRider._id}`).emit('dispatch:offer', {
        eventId: event._id,
        orderId: order._id,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        shopName: order.businessDetails?.shopName || 'Operations Hub',
        deliveryAddress: `${order.shippingAddress.fullAddress}, ${order.shippingAddress.city}`,
        totalBill: order.totalPrice,
        weight: orderWeight,
        expiresInSeconds: 60
      });
    }

    // Set auto-expiration timeout (60 seconds)
    setTimeout(async () => {
      try {
        // If database connection is closed (e.g. during test cleanup), exit silently
        if (DispatchEvent.db && DispatchEvent.db.readyState !== 1) return;

        const freshEvent = await DispatchEvent.findById(event._id);
        if (freshEvent && freshEvent.broadcastStatus === 'Offered') {
          freshEvent.broadcastStatus = 'Expired';
          await freshEvent.save();
          console.log(`[Dispatch Engine] Offer ${event._id} expired for Partner "${selectedRider.fullName}". Re-allocating order...`);

          // Update rider status to Offline/Busy if they missed an assignment to keep pool clean
          // Or just leave them Available and trigger reallocation
          await exports.broadcastNewOrder(orderId);
        }
      } catch (err) {
        console.error('[Dispatch Engine] Auto-expiration error:', err.message);
      }
    }, 60 * 1000);

  } catch (err) {
    console.error('[Dispatch Engine] Allocation error:', err.message);
  }
};

// @desc    Clock-In Duty Shift
// @route   PUT /api/dispatch/clock-in
// @access  Private/Delivery
exports.clockInShift = async (req, res, next) => {
  try {
    const partner = await Delivery.findById(req.user.id);
    if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });

    partner.activeShift = {
      isClockedIn: true,
      clockedInAt: new Date(),
      currentPayloadWeight: 0,
      currentPayloadCount: 0
    };
    partner.status = 'Available';
    partner.lastOnlineTime = new Date();

    await partner.save();
    res.status(200).json({ success: true, message: 'Clocked-in to shift successfully.', data: partner });
  } catch (err) {
    next(err);
  }
};

// @desc    Clock-Out Duty Shift
// @route   PUT /api/dispatch/clock-out
// @access  Private/Delivery
exports.clockOutShift = async (req, res, next) => {
  try {
    const partner = await Delivery.findById(req.user.id);
    if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });

    partner.activeShift = {
      isClockedIn: false,
      clockedInAt: null,
      currentPayloadWeight: 0,
      currentPayloadCount: 0
    };
    partner.status = 'Offline';
    partner.lastOnlineTime = null;

    await partner.save();
    res.status(200).json({ success: true, message: 'Clocked-out of shift successfully.', data: partner });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Active Offered Dispatches
// @route   GET /api/dispatch/offers
// @access  Private/Delivery
exports.getLiveOffers = async (req, res, next) => {
  try {
    const now = new Date();
    const offers = await DispatchEvent.find({
      deliveryBoy: req.user.id,
      broadcastStatus: 'Offered',
      expiresAt: { $gt: now }
    }).populate('order');

    res.status(200).json({ success: true, data: offers });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept Dispatch Offer
// @route   POST /api/dispatch/offers/:eventId/accept
// @access  Private/Delivery
exports.acceptOffer = async (req, res, next) => {
  try {
    const event = await DispatchEvent.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, error: 'Offer not found' });

    if (event.deliveryBoy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized to accept this offer' });
    }

    if (event.broadcastStatus !== 'Offered') {
      return res.status(400).json({ success: false, error: `Offer is already ${event.broadcastStatus.toLowerCase()}` });
    }

    if (event.expiresAt < new Date()) {
      event.broadcastStatus = 'Expired';
      await event.save();
      // Re-trigger allocation
      exports.broadcastNewOrder(event.order);
      return res.status(400).json({ success: false, error: 'Offer has expired' });
    }

    const order = await Order.findById(event.order);
    if (!order) return res.status(404).json({ success: false, error: 'Order associated with this offer not found' });

    // Race protection: Check if order already has an assigned driver
    if (order.deliveryBoy && order.deliveryBoy.toString() !== req.user.id) {
      event.broadcastStatus = 'Expired';
      await event.save();
      return res.status(409).json({ success: false, error: 'This order has already been assigned to another partner' });
    }

    // Atomic Event Accept
    event.broadcastStatus = 'Accepted';
    await event.save();

    // Assign to courier
    order.deliveryBoy = req.user.id;
    order.deliveryStatus = 'Accepted';
    order.status = 'Processing';
    await order.save();

    // Update Partner payload statistics
    const partner = await Delivery.findById(req.user.id);
    const orderWeight = await calculateOrderWeight(order);

    partner.activeShift.currentPayloadCount = (partner.activeShift.currentPayloadCount || 0) + 1;
    partner.activeShift.currentPayloadWeight = (partner.activeShift.currentPayloadWeight || 0) + orderWeight;
    await partner.save();

    res.status(200).json({ 
      success: true, 
      message: 'Offer accepted successfully! Order is added to your active deliveries.',
      data: order 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject Dispatch Offer
// @route   POST /api/dispatch/offers/:eventId/reject
// @access  Private/Delivery
exports.rejectOffer = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const event = await DispatchEvent.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, error: 'Offer not found' });

    if (event.deliveryBoy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized to reject this offer' });
    }

    if (event.broadcastStatus !== 'Offered') {
      return res.status(400).json({ success: false, error: `Offer is already ${event.broadcastStatus.toLowerCase()}` });
    }

    // Atomic Event Reject
    event.broadcastStatus = 'Rejected';
    event.rejectionReason = rejectionReason || 'Partner declined';
    await event.save();

    // Push into order's rejection blacklist
    const order = await Order.findById(event.order);
    if (order) {
      if (!order.rejectedBy) order.rejectedBy = [];
      order.rejectedBy.push({
        deliveryBoy: req.user.id,
        rejectedAt: new Date()
      });
      // Ensure delivery status resets if it was offered
      order.deliveryStatus = 'None';
      await order.save();

      // Trigger auto-allocation search query for the NEXT best eligible rider
      exports.broadcastNewOrder(order._id);
    }

    res.status(200).json({ success: true, message: 'Offer declined. Order has been returned to the dispatch queue.' });
  } catch (err) {
    next(err);
  }
};

// ============================================
// REVERSE LOGISTICS (RETURNS) ENGINE
// ============================================

exports.broadcastNewReturn = async (returnId) => {
  try {
    const returnReq = await Return.findById(returnId).populate('order product');
    if (!returnReq) return console.error(`[Dispatch Engine] Return ${returnId} not found.`);

    if (returnReq.deliveryBoy) return;

    // Use order weight
    const product = returnReq.product;
    const itemWeight = product && product.weight !== undefined ? product.weight : 1.5;
    const orderItem = returnReq.order.orderItems.find(i => i._id.toString() === returnReq.orderItem.toString());
    const qty = orderItem ? orderItem.quantity : 1;
    const returnWeight = itemWeight * qty;
    
    const eligibleVehicles = getEligibleVehicles(returnWeight);
    const pincode = returnReq.order.shippingAddress?.pincode; // Pickup from customer

    if (!pincode) return;

    const riders = await Delivery.find({
      status: 'Available',
      'activeShift.isClockedIn': true,
      servicePincodes: pincode,
      vehicleType: { $in: eligibleVehicles }
    });

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const rejections = returnReq.rejectedBy || [];
    
    const activeRejections = rejections
      .filter(r => new Date(r.rejectedAt) >= twentyFourHoursAgo)
      .map(r => r.deliveryBoy?.toString());

    const availableRiders = riders.filter(rider => {
      const riderIdStr = rider._id.toString();
      if (activeRejections.includes(riderIdStr)) return false;
      const volumeLimit = rider.vehicleDetails?.maxVolumeCapacity || 4;
      if ((rider.activeShift?.currentPayloadCount || 0) >= volumeLimit) return false;
      const weightLimit = rider.vehicleDetails?.maxWeightCapacity || 20;
      const currentWeight = rider.activeShift?.currentPayloadWeight || 0;
      if (currentWeight + returnWeight > weightLimit) return false;
      return true;
    });

    if (availableRiders.length === 0) {
      console.log(`[Dispatch Engine] No eligible riders for Return #${returnReq._id}`);
      return;
    }

    availableRiders.sort((a, b) => (a.activeShift?.currentPayloadCount || 0) - (b.activeShift?.currentPayloadCount || 0));
    const selectedRider = availableRiders[0];

    const offeredAt = new Date();
    const expiresAt = new Date(offeredAt.getTime() + 60 * 1000);

    const event = await ReturnDispatchEvent.create({
      returnReq: returnReq._id,
      deliveryBoy: selectedRider._id,
      expiresAt
    });

    console.log(`[Dispatch Engine] Offering Return #${returnReq._id} to Partner "${selectedRider.fullName}"`);

    let io;
    try { io = getIO(); } catch (e) {}

    if (io) {
      io.to(`delivery:${selectedRider._id}`).emit('dispatch:return_offer', {
        eventId: event._id,
        returnId: returnReq._id,
        shopName: returnReq.order.businessDetails?.shopName || 'Operations Hub',
        pickupAddress: `${returnReq.order.shippingAddress.fullAddress}, ${returnReq.order.shippingAddress.city}`,
        weight: returnWeight,
        expiresInSeconds: 60
      });
    }

    setTimeout(async () => {
      try {
        if (ReturnDispatchEvent.db && ReturnDispatchEvent.db.readyState !== 1) return;
        const freshEvent = await ReturnDispatchEvent.findById(event._id);
        if (freshEvent && freshEvent.broadcastStatus === 'Offered') {
          freshEvent.broadcastStatus = 'Expired';
          await freshEvent.save();
          await exports.broadcastNewReturn(returnId);
        }
      } catch (err) {}
    }, 60 * 1000);

  } catch (err) {
    console.error('[Dispatch Engine] Return Allocation error:', err.message);
  }
};

exports.getLiveReturnOffers = async (req, res, next) => {
  try {
    const now = new Date();
    const offers = await ReturnDispatchEvent.find({
      deliveryBoy: req.user.id,
      broadcastStatus: 'Offered',
      expiresAt: { $gt: now }
    }).populate({ path: 'returnReq', populate: { path: 'order product' } });

    res.status(200).json({ success: true, data: offers });
  } catch (err) {
    next(err);
  }
};

exports.acceptReturnOffer = async (req, res, next) => {
  try {
    const event = await ReturnDispatchEvent.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, error: 'Offer not found' });

    if (event.deliveryBoy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (event.broadcastStatus !== 'Offered') {
      return res.status(400).json({ success: false, error: `Offer is already ${event.broadcastStatus}` });
    }

    if (event.expiresAt < new Date()) {
      event.broadcastStatus = 'Expired';
      await event.save();
      exports.broadcastNewReturn(event.returnReq);
      return res.status(400).json({ success: false, error: 'Offer expired' });
    }

    const returnReq = await Return.findById(event.returnReq);
    if (returnReq.deliveryBoy && returnReq.deliveryBoy.toString() !== req.user.id) {
      event.broadcastStatus = 'Expired';
      await event.save();
      return res.status(409).json({ success: false, error: 'Already assigned' });
    }

    event.broadcastStatus = 'Accepted';
    await event.save();

    returnReq.deliveryBoy = req.user.id;
    returnReq.deliveryStatus = 'Accepted';
    await returnReq.save();

    // Not updating payload weight for returns for simplicity, or could add it.
    res.status(200).json({ success: true, message: 'Return accepted' });
  } catch (err) {
    next(err);
  }
};

exports.rejectReturnOffer = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const event = await ReturnDispatchEvent.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, error: 'Offer not found' });

    if (event.deliveryBoy.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, error: 'Unauthorized' });
    if (event.broadcastStatus !== 'Offered') return res.status(400).json({ success: false, error: `Offer is already ${event.broadcastStatus}` });

    event.broadcastStatus = 'Rejected';
    event.rejectionReason = rejectionReason || 'Partner declined';
    await event.save();

    const returnReq = await Return.findById(event.returnReq);
    if (returnReq) {
      if (!returnReq.rejectedBy) returnReq.rejectedBy = [];
      returnReq.rejectedBy.push({
        deliveryBoy: req.user.id,
        rejectedAt: new Date()
      });
      returnReq.deliveryStatus = 'None';
      await returnReq.save();
      exports.broadcastNewReturn(returnReq._id);
    }
    res.status(200).json({ success: true, message: 'Return offer declined' });
  } catch (err) {
    next(err);
  }
};

exports.updateReturnDeliveryStatus = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const { status, pickupProofImages, pickupProofVideo, dropoffProofImages } = req.body;
    
    const returnReq = await Return.findById(returnId);
    if (!returnReq) return res.status(404).json({ success: false, error: 'Return request not found' });

    if (req.user.role === 'delivery' && (!returnReq.deliveryBoy || returnReq.deliveryBoy.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, error: 'Not authorized for this return' });
    }

    const permittedStates = ['Picked', 'Out for Return Delivery', 'Returned'];
    if (!permittedStates.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status transition: ${status}` });
    }

    if (status === 'Picked') {
      if (pickupProofImages) returnReq.pickupProofImages = pickupProofImages;
      if (pickupProofVideo) returnReq.pickupProofVideo = pickupProofVideo;
      if (!returnReq.pickupProofImages || returnReq.pickupProofImages.length === 0) {
        return res.status(400).json({ success: false, error: 'Pickup proof images are required.' });
      }
    }

    if (status === 'Returned') {
      if (dropoffProofImages) returnReq.dropoffProofImages = dropoffProofImages;
      if (!returnReq.dropoffProofImages || returnReq.dropoffProofImages.length === 0) {
        return res.status(400).json({ success: false, error: 'Dropoff proof images are required.' });
      }
    }

    returnReq.deliveryStatus = status;
    if (status === 'Returned') {
      returnReq.status = 'Received';
    }

    await returnReq.save();

    // Trigger updateReturnStatus logic for refund process when it becomes 'Received'
    if (status === 'Returned') {
      const Order = require('../models/Order');
      const order = await Order.findById(returnReq.order);
      const itemIndex = order.orderItems.findIndex(item => item._id.toString() === returnReq.orderItem.toString());
      if (itemIndex !== -1) {
        order.orderItems[itemIndex].returnStatus = 'Received';
        await order.save();
      }

      // 1. Process Refund
      if (returnReq.refundStatus === 'Pending') {
        if (order.paymentMethod === 'COD' || order.paymentMethod === 'Wallet' || !order.paymentResult?.id) {
          returnReq.refundStatus = 'Processed';
        } else {
          try {
            const { processRefund } = require('../utils/paymentGateway');
            await processRefund(order.paymentResult.id, returnReq.refundAmount, returnReq._id);
            returnReq.refundStatus = 'Processed';
          } catch (error) {
            returnReq.refundStatus = 'Failed';
          }
        }
      }

      // 2. Restore Stock
      if (itemIndex !== -1) {
        const inventoryService = require('../services/inventoryService');
        await inventoryService.returnStock(returnReq.product, order.orderItems[itemIndex].quantity);
      }

      // 3. Process Wallet & Tax
      try {
        const walletService = require('../services/walletService');
        await walletService.recordRefundDeduction(order, returnReq.refundAmount);
        const refundIdempotencyKey = `refund_credit_${returnReq._id}`;
        await walletService.creditUserWallet(
          returnReq.user,
          returnReq.refundAmount,
          'refund_credit',
          `Refund for returned items in Order ${order._id}`,
          returnReq._id,
          refundIdempotencyKey
        );
        if (itemIndex !== -1) {
          const taxService = require('../services/taxService');
          await taxService.processRefundTax(order, [{ product: returnReq.product, quantity: order.orderItems[itemIndex].quantity }]);
        }
      } catch (refundErr) {}
      
      await returnReq.save();
    }

    res.status(200).json({ success: true, data: returnReq });
  } catch (err) {
    next(err);
  }
};

