const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { processRefund } = require('../utils/paymentGateway');
const paginate = require('../utils/paginate');

// @desc    Request a return
// @route   POST /api/returns
// @access  Private (User)
exports.requestReturn = async (req, res, next) => {
  try {
    const { orderId, orderItemId, reason, description, images } = req.body;

    // Validate order
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ success: false, error: 'Only delivered orders can be returned' });
    }

    // Find the specific item in the order
    const itemIndex = order.orderItems.findIndex(item => item._id.toString() === orderItemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Item not found in order' });
    }

    const item = order.orderItems[itemIndex];

    if (item.returnStatus !== 'None' && item.returnStatus !== 'Rejected') {
      return res.status(400).json({ success: false, error: 'A return request already exists for this item' });
    }

    // Create Return request
    const returnRequest = await Return.create({
      order: orderId,
      orderItem: orderItemId,
      product: item.product,
      user: req.user.id,
      seller: item.seller,
      reason,
      description,
      images: images || [],
      refundAmount: item.price * item.quantity
    });

    // Update order item status
    order.orderItems[itemIndex].returnStatus = 'Requested';
    order.orderItems[itemIndex].returnRequest = returnRequest._id;
    await order.save();

    res.status(201).json({
      success: true,
      data: returnRequest
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'A return request already exists for this item' });
    }
    next(err);
  }
};

// @desc    Get logged in user's returns
// @route   GET /api/returns/my-returns
// @access  Private (User)
exports.getMyReturns = async (req, res, next) => {
  try {
    const populateOptions = [
      { path: 'product', select: 'name images' },
      { path: 'order', select: 'totalPrice createdAt' }
    ];
    
    const result = await paginate(Return, { user: req.user.id }, req, populateOptions);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get seller's returns
// @route   GET /api/returns/seller
// @access  Private (Seller)
exports.getSellerReturns = async (req, res, next) => {
  try {
    const populateOptions = [
      { path: 'product', select: 'name images' },
      { path: 'user', select: 'fullName email phone' },
      { path: 'order', select: 'shippingAddress createdAt' }
    ];
    
    const result = await paginate(Return, { seller: req.user.id }, req, populateOptions);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get delivery boy's assigned returns
// @route   GET /api/returns/delivery
// @access  Private (Delivery)
exports.getDeliveryReturns = async (req, res, next) => {
  try {
    const populateOptions = [
      { path: 'product', select: 'name images' },
      { path: 'user', select: 'fullName email phone' },
      { path: 'seller', select: 'shopName fullName email phone shopAddress' },
      { path: 'order', select: 'shippingAddress createdAt' }
    ];
    
    const result = await paginate(Return, { deliveryBoy: req.user.id }, req, populateOptions);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all returns
// @route   GET /api/returns
// @access  Private (Admin)
exports.getAllReturns = async (req, res, next) => {
  try {
    const populateOptions = [
      { path: 'product', select: 'name images' },
      { path: 'user', select: 'fullName email phone mobileNumber' },
      { path: 'seller', select: 'shopName fullName email phone' },
      { path: 'deliveryBoy', select: 'fullName phone email' }
    ];
    
    const result = await paginate(Return, {}, req, populateOptions);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update return status
// @route   PUT /api/returns/:id/status
// @access  Private (Seller/Admin)
exports.updateReturnStatus = async (req, res, next) => {
  try {
    const { status, comment, dropoffProofImages } = req.body;
    
    const returnReq = await Return.findById(req.params.id);
    if (!returnReq) {
      return res.status(404).json({ success: false, error: 'Return request not found' });
    }

    // Authorization check
    if (req.user.role === 'seller' && returnReq.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this return' });
    }

    if (req.user.role === 'admin') {
      returnReq.adminComment = comment || returnReq.adminComment;
    } else if (req.user.role === 'seller') {
      returnReq.sellerComment = comment || returnReq.sellerComment;
    }

    returnReq.status = status;
    
    if (status === 'Completed' && dropoffProofImages) {
      returnReq.dropoffProofImages = dropoffProofImages;
    }

    // Retrieve original order
    const order = await Order.findById(returnReq.order);
    const itemIndex = order.orderItems.findIndex(item => item._id.toString() === returnReq.orderItem.toString());
    
    if (itemIndex !== -1) {
      order.orderItems[itemIndex].returnStatus = status;
      await order.save();
    }

    // Process Refund & Stock Restore ONLY when Received or Completed
    if (status === 'Received' || status === 'Completed') {
      // 1. Process Refund
      if (returnReq.refundStatus === 'Pending') {
        if (order.paymentMethod === 'COD' || order.paymentMethod === 'Wallet' || !order.paymentResult?.id) {
          // COD or Wallet payments do not go through Razorpay.
          // Refund is processed by crediting their Wallet directly (logged below).
          returnReq.refundStatus = 'Processed';
          console.log(`[FINTECH] COD/Wallet order return - skipping Razorpay API, marked refund processed directly.`);
        } else {
          try {
            const refundRes = await processRefund(
              order.paymentResult.id, 
              returnReq.refundAmount, 
              returnReq._id
            );
            returnReq.refundStatus = 'Processed';
          } catch (error) {
            console.error('Refund processing error:', error);
            returnReq.refundStatus = 'Failed';
          }
        }
      }

      // 2. Restore Stock
      if (itemIndex !== -1) {
        const inventoryService = require('../services/inventoryService');
        await inventoryService.returnStock(returnReq.product, order.orderItems[itemIndex].quantity);
      }

      // 3. Process Wallet Refund Deduction, Customer Wallet Credit & Tax Rollback Log
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
          await taxService.processRefundTax(order, [{
            product: returnReq.product,
            quantity: order.orderItems[itemIndex].quantity
          }]);
        }
      } catch (refundErr) {
        console.error('Failed to log wallet refund operations:', refundErr.message);
      }
    }

    await returnReq.save();

    // Trigger reverse logistics dispatch when Approved
    if (status === 'Approved' && returnReq.deliveryStatus === 'None') {
      try {
        const { broadcastNewReturn } = require('./dispatchController');
        await broadcastNewReturn(returnReq._id);
      } catch (dispatchErr) {
        console.error('Failed to dispatch return:', dispatchErr.message);
      }
    }

    // Queue Refund Confirmation Email
    if (status === 'Received' || status === 'Completed') {
      try {
        const User = require('../models/User');
        const customer = await User.findById(returnReq.user);
        if (customer && customer.email) {
          const emailService = require('../services/emailService');
          await emailService.queueEmail(customer.email, 'Refund Processed - Riddha Mart', 'refund', {
            order,
            refundAmount: returnReq.refundAmount
          });
        }
      } catch (emailErr) {
        console.error('Failed to queue refund email:', emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: returnReq
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger auto-assignment for a return
// @route   POST /api/returns/:id/auto-assign
// @access  Private (Admin)
exports.autoAssignReturn = async (req, res, next) => {
  try {
    const returnReq = await Return.findById(req.params.id);
    if (!returnReq) {
      return res.status(404).json({ success: false, error: 'Return request not found' });
    }

    if (returnReq.deliveryBoy) {
      return res.status(400).json({ success: false, error: 'A delivery partner is already assigned to this return.' });
    }

    if (returnReq.status !== 'Approved') {
      return res.status(400).json({ success: false, error: 'Return must be approved before assigning a delivery partner.' });
    }

    const { broadcastNewReturn } = require('./dispatchController');
    await broadcastNewReturn(returnReq._id);

    res.status(200).json({ success: true, message: 'Auto-assignment triggered successfully. Searching for nearby partners...' });
  } catch (err) {
    next(err);
  }
};
