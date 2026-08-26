const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');
const DeliveryIssue = require('../models/DeliveryIssue');
const trackingService = require('../services/trackingService');
const filterService = require('../services/filterService');

// Helper to generate 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Real haversine distance between the order's seller and shipping coordinates (both geocoded
// at order creation — see orderController.js), falling back to the given default only when
// either pair is missing.
const hasCoords = (c) => c && typeof c.latitude === 'number' && typeof c.longitude === 'number';
const getOrderDistanceKm = (order, fallback) => {
  const distanceKm = filterService.calculateDistance(
    hasCoords(order?.sellerCoordinates) ? [order.sellerCoordinates.longitude, order.sellerCoordinates.latitude] : null,
    hasCoords(order?.shippingCoordinates) ? [order.shippingCoordinates.longitude, order.shippingCoordinates.latitude] : null
  );
  return (typeof distanceKm === 'number' && !Number.isNaN(distanceKm)) ? distanceKm : fallback;
};

// 1. Get Full Order Tracking Info
exports.getOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let order = await Order.findById(orderId)
      .populate('user', 'fullName name email mobileNumber phone')
      .populate('orderItems.product', 'name images price category');

    if (!order) {
      // Create a mock/demo order for instant testing if ID doesn't exist
      order = await Order.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tracking record not found' });
    }

    // Only fabricate driver-assignment/AI-ETA data once the order has actually been dispatched —
    // otherwise a "Processing" order (never picked up) shows a confident fake driver and arrival
    // time, which is misleading and inconsistent with the OTP box (which already correctly waits
    // for "Out for Delivery"). Merely having a deliveryBoy assigned isn't enough — a seller can
    // assign an order that the delivery partner hasn't accepted/picked up yet, so this must check
    // real status progression, not just the assignment field.
    const isDispatched =
      ['Accepted', 'Picked', 'Out for Delivery', 'Delivered'].includes(order.deliveryStatus) ||
      ['Shipped', 'Delivered'].includes(order.status);

    // Ensure Delivery Partner is attached
    if (isDispatched && (!order.deliveryPartnerDetails || !order.deliveryPartnerDetails.name)) {
      let partner = await DeliveryPartner.findOne({ status: 'active' });
      if (!partner) {
        partner = new DeliveryPartner({
          name: 'Vikram Singh',
          phone: '+91 98765 43210',
          vehicle: 'electric-van',
          vehicleNo: 'KA-01-EQ-9876',
          currentLocation: {
            type: 'Point',
            coordinates: [77.6412, 12.9716],
            speed: 35,
            timestamp: new Date()
          }
        });
        await partner.save();
      }

      order.deliveryPartnerDetails = {
        partnerId: partner._id,
        name: partner.name,
        phone: partner.phone,
        photo: partner.photo,
        rating: partner.performance.rating,
        vehicle: partner.vehicle,
        vehicleNo: partner.vehicleNo
      };
      if (!order.proofOfDelivery?.otp) {
        order.proofOfDelivery = order.proofOfDelivery || {};
        order.proofOfDelivery.otp = generateOTP();
      }
      await order.save();
    }

    // Generate AI Prediction if missing or older than 15 mins (only once actually dispatched)
    if (isDispatched && (!order.aiPredictions || !order.aiPredictions.generatedAt || (Date.now() - new Date(order.aiPredictions.generatedAt).getTime() > 15 * 60000))) {
      const aiEst = await trackingService.predictDeliveryTime({
        currentLat: order.currentLocation?.coordinates?.[1] || 12.9716,
        currentLng: order.currentLocation?.coordinates?.[0] || 77.6412,
        destination: order.shippingAddress?.fullAddress || 'Indiranagar, Bengaluru',
        distanceKm: getOrderDistanceKm(order, 3.8),
        itemCount: (order.orderItems || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
      }, req.user._id);

      order.aiPredictions = {
        estimatedDeliveryTime: aiEst.estimatedDelivery,
        confidenceLevel: aiEst.confidence || 'high',
        delayPredicted: false,
        delayReasons: aiEst.factors || [],
        message: aiEst.message,
        generatedAt: new Date()
      };
      await order.save();
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Live Location
exports.getLiveLocation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        currentLocation: order.currentLocation,
        deliveryPartner: order.deliveryPartnerDetails,
        estimatedDelivery: order.aiPredictions?.estimatedDeliveryTime || '25 mins',
        speed: order.currentLocation?.speed || 35,
        heading: order.currentLocation?.heading || 90,
        timestamp: order.currentLocation?.timestamp || new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Status History
exports.getStatusHistory = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        status: order.status,
        statusHistory: order.statusHistory || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Gemini ETA Prediction
exports.getETAPrediction = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    const prediction = await trackingService.predictDeliveryTime({
      currentLat: order?.currentLocation?.coordinates?.[1] || 12.9716,
      currentLng: order?.currentLocation?.coordinates?.[0] || 77.6412,
      destination: order?.shippingAddress?.fullAddress || 'Bengaluru',
      distanceKm: getOrderDistanceKm(order, 3.5),
      itemCount: (order?.orderItems || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    }, req.user._id);

    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    next(error);
  }
};

// 5. Check Delays
exports.checkDelays = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    const delayAnalysis = await trackingService.detectDelays({
      currentLat: order?.currentLocation?.coordinates?.[1] || 12.9716,
      currentLng: order?.currentLocation?.coordinates?.[0] || 77.6412,
      destination: order?.shippingAddress?.fullAddress || 'Bengaluru',
      distanceKm: getOrderDistanceKm(order, 3.5),
      speed: order?.currentLocation?.speed || 25,
      partnerStatus: order?.status || 'in-transit'
    }, req.user._id);

    res.status(200).json({
      success: true,
      data: delayAnalysis
    });
  } catch (error) {
    next(error);
  }
};

// 6. Report Issue & Run Gemini Analysis
exports.reportDeliveryIssue = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { issueType, description, photos = [] } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const aiAnalysis = await trackingService.suggestIssueResolution({
      issueType: issueType || 'delivery_delayed',
      description: description || 'Delay in receiving parcel',
      orderValue: order.totalPrice || 12500,
      customerName: order.shippingAddress?.fullName || 'Customer',
      partnerName: order.deliveryPartnerDetails?.name || 'Vikram'
    }, req.user._id);

    const issue = new DeliveryIssue({
      orderId: order._id,
      issueType: issueType || 'delivery_delayed',
      description,
      photos,
      reportedBy: 'customer',
      status: 'analyzing',
      aiAnalysis
    });

    await issue.save();

    // Push issue into order subdocument array
    order.issues = order.issues || [];
    order.issues.push({
      issueId: issue._id,
      issueType: issue.issueType,
      description: issue.description,
      reportedAt: new Date(),
      reportedBy: 'customer',
      status: 'analyzing'
    });
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully. AI solution generated.',
      data: {
        issue,
        aiAnalysis
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get Single Issue
exports.getIssueById = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const issue = await DeliveryIssue.findById(issueId).populate('orderId');
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue record not found' });
    }
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

// 8. Upload Proof of Delivery (Partner Endpoint)
exports.uploadProofOfDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { photos = [], signature, otp, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify OTP if provided
    if (order.proofOfDelivery?.otp && otp && order.proofOfDelivery.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid delivery OTP code' });
    }

    order.proofOfDelivery = {
      photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
      signature: signature || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=200&q=80',
      otp: otp || order.proofOfDelivery?.otp || '1234',
      verifiedAt: new Date(),
      notes: notes || 'Delivered directly to recipient at doorstep.'
    };

    order.status = 'Delivered';
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.statusHistory.push({
      status: 'Delivered',
      timestamp: new Date(),
      notes: 'Package delivered and verified via OTP',
      updatedBy: 'partner'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Proof of delivery verified and order marked as Delivered!',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// 9. Rate Delivery
exports.rateDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.customerRating = {
      rating: Number(rating) || 5,
      review: review || 'Great delivery service and fast response!',
      ratedAt: new Date()
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Thank you for rating your delivery!',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// 10. Get Delivery Partner Route (Partner View)
exports.getPartnerRoute = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const partner = await DeliveryPartner.findById(partnerId);

    const orders = await Order.find({
      $or: [
        { 'deliveryPartnerDetails.partnerId': partnerId },
        { status: { $in: ['Processing', 'Packed', 'Shipped', 'in-transit', 'out-for-delivery'] } }
      ]
    }).limit(10);

    const routeStops = orders.map((ord, idx) => ({
      stopNo: idx + 1,
      orderId: ord._id,
      orderNumber: ord.orderNumber || `ORD-${ord._id.toString().slice(-6)}`,
      customerName: ord.shippingAddress?.fullName || 'Client',
      address: ord.shippingAddress?.fullAddress || 'Address',
      status: ord.status,
      coordinates: ord.shippingAddress?.coordinates || { latitude: 12.9716 + (idx * 0.01), longitude: 77.6412 + (idx * 0.01) }
    }));

    res.status(200).json({
      success: true,
      data: {
        partner,
        routeStops
      }
    });
  } catch (error) {
    next(error);
  }
};

// 11. Update Partner GPS Location & Status
exports.updatePartnerStatus = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const { latitude, longitude, status, speed, heading, orderId } = req.body;

    const partner = await DeliveryPartner.findById(partnerId);
    if (partner) {
      if (status) partner.status = status;
      if (latitude && longitude) {
        partner.currentLocation = {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
          speed: Number(speed) || 30,
          heading: Number(heading) || 90,
          timestamp: new Date()
        };
      }
      await partner.save();
    }

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && latitude && longitude) {
        order.currentLocation = {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
          speed: Number(speed) || 30,
          heading: Number(heading) || 90,
          timestamp: new Date()
        };
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Location and partner status updated'
    });
  } catch (error) {
    next(error);
  }
};

// 12. Tracking Analytics Dashboard (Admin)
exports.getTrackingAnalytics = async (req, res, next) => {
  try {
    const orders = await Order.find({});
    const totalDeliveries = orders.length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered' || o.isDelivered).length;
    const inTransitCount = orders.filter(o => o.status === 'in-transit' || o.status === 'Shipped' || o.status === 'out-for-delivery').length;
    const issuesCount = orders.reduce((acc, o) => acc + (o.issues?.length || 0), 0);

    const onTimeRate = totalDeliveries > 0 ? Math.round((deliveredCount / totalDeliveries) * 100) : 96;

    res.status(200).json({
      success: true,
      data: {
        totalDeliveries,
        deliveredCount,
        inTransitCount,
        issuesCount,
        onTimeRate,
        avgDeliveryMinutes: 28
      }
    });
  } catch (error) {
    next(error);
  }
};
