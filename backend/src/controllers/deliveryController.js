const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const sendTokenResponse = require('../utils/sendTokenResponse');
const checkEmailExists = require('../utils/checkEmailExists');
const { notifyAdminNewDelivery, notifyDeliveryApproval } = require('../socket');

// @desc    Register Delivery Partner
// @route   POST /api/auth/delivery/register
// @access  Public
exports.registerDelivery = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, vehicleType, vehicleNumber, documents } = req.body;

    if (await checkEmailExists(email)) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const phoneExists = await Delivery.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ success: false, error: 'Phone number already registered' });
    }

    const delivery = await Delivery.create({ fullName, email, password, phone, vehicleType, vehicleNumber, documents });
    
    // Notify Admin about new registration
    notifyAdminNewDelivery({
      id: delivery._id,
      fullName: delivery.fullName,
      email: delivery.email,
      phone: delivery.phone,
      vehicleType: delivery.vehicleType
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your delivery partner account is pending admin approval.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login Delivery Partner
// @route   POST /api/auth/delivery/login
// @access  Public
exports.loginDelivery = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Please provide email and password' });

    const delivery = await Delivery.findOne({ email }).select('+password');
    if (!delivery || !(await delivery.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const appStatus = delivery.approvalStatus || 'Approved';
    if (appStatus === 'Pending') {
      return res.status(403).json({ success: false, error: 'Your delivery partner account is pending admin approval.' });
    }
    if (appStatus === 'Rejected') {
      return res.status(403).json({ success: false, error: 'Your delivery partner registration was rejected. Please contact support.' });
    }
    if (appStatus === 'Suspended') {
      return res.status(403).json({ success: false, error: 'Your delivery partner account has been suspended for policy violations.' });
    }

    sendTokenResponse(delivery, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in Delivery Partner
exports.getDeliveryMe = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.user.id);
    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Delivery Profile
exports.updateDeliveryProfile = async (req, res, next) => {
  try {
    const { fullName, email, phone, vehicleType, vehicleNumber, avatar, documents } = req.body;
    
    const delivery = await Delivery.findById(req.user.id);
    if (!delivery) return res.status(404).json({ success: false, error: 'Partner not found' });

    // Check if email is being changed and if new email is already taken
    if (email && email !== delivery.email) {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already in use by another account' });
      }
    }

    const fieldsToUpdate = {
      fullName: fullName || delivery.fullName,
      email: email || delivery.email,
      phone: phone || delivery.phone,
      vehicleType: vehicleType || delivery.vehicleType,
      vehicleNumber: vehicleNumber || delivery.vehicleNumber,
      avatar: avatar || delivery.avatar
    };

    if (documents) {
      fieldsToUpdate.documents = {
        ...delivery.documents,
        ...documents
      };
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: updatedDelivery });
  } catch (err) {
    next(err);
  }
};

// @desc    Get available delivery partners
// @route   GET /api/delivery/available
// @access  Private/Seller
exports.getAvailableDeliveryBoys = async (req, res, next) => {
  try {
    const { pincode } = req.query;
    const filter = { status: 'Available', approvalStatus: 'Approved' };
    if (pincode) {
      filter.servicePincodes = pincode;
    }
    const deliveryBoys = await Delivery.find(filter).select('-password');
    res.status(200).json({ success: true, data: deliveryBoys });
  } catch (err) {
    next(err);
  }
};

// @desc    Get pending delivery partners (for admin)
// @route   GET /api/delivery/pending
// @access  Private/Admin
exports.getPendingDeliveryBoys = async (req, res, next) => {
  try {
    const pendingBoys = await Delivery.find({ approvalStatus: 'Pending' }).sort({ createdAt: -1 }).select('-password');
    res.status(200).json({ success: true, data: pendingBoys });
  } catch (err) {
    next(err);
  }
};

// @desc    Update delivery status
// @route   PUT /api/delivery/status
// @access  Private/Delivery
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    if (status === 'Available') {
      updateData.lastOnlineTime = Date.now();
      updateData.activeShift = {
        isClockedIn: true,
        clockedInAt: new Date(),
        currentPayloadWeight: 0,
        currentPayloadCount: 0
      };
    } else if (status === 'Offline') {
      updateData.lastOnlineTime = null;
      updateData.activeShift = {
        isClockedIn: false,
        clockedInAt: null,
        currentPayloadWeight: 0,
        currentPayloadCount: 0
      };
    }
    const delivery = await Delivery.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all delivery partners (for admin)
// @route   GET /api/delivery
// @access  Private/Admin
exports.getAllDeliveryPartners = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100; // Prevent memory overload with safe pagination limit
    const skip = (page - 1) * limit;

    const pipeline = [
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          password: 0
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { partnerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$deliveryBoy', '$$partnerId'] }
              }
            },
            {
              $group: {
                _id: null,
                totalDeliveries: {
                  $sum: {
                    $cond: [{ $eq: ['$deliveryStatus', 'Delivered'] }, 1, 0]
                  }
                },
                activeDeliveries: {
                  $sum: {
                    $cond: [
                      { $in: ['$deliveryStatus', ['Accepted', 'Picked', 'Out for Delivery']] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          as: 'counts'
        }
      },
      {
        $addFields: {
          counts: { $arrayElemAt: ['$counts', 0] }
        }
      },
      {
        $addFields: {
          totalDeliveries: { $ifNull: ['$counts.totalDeliveries', 0] },
          activeDeliveries: { $ifNull: ['$counts.activeDeliveries', 0] }
        }
      },
      {
        $project: {
          counts: 0
        }
      }
    ];

    const partners = await Delivery.aggregate(pipeline);

    res.status(200).json({ success: true, data: partners });
  } catch (err) {
    next(err);
  }
};

// @desc    Update delivery approval status
// @route   PUT /api/delivery/:id/approve
// @access  Private/Admin
exports.updateDeliveryApprovalStatus = async (req, res, next) => {
  try {
    const { approvalStatus } = req.body; // 'Approved', 'Rejected', or 'Suspended'
    
    const updateData = { approvalStatus };
    if (approvalStatus === 'Suspended') {
      updateData.status = 'Offline';
    }

    const partner = await Delivery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });

    let message = '';
    if (approvalStatus === 'Approved') {
      message = 'Congratulations! Your delivery partner account has been approved.';
    } else if (approvalStatus === 'Rejected') {
      message = 'Your delivery partner account application has been rejected.';
    } else if (approvalStatus === 'Suspended') {
      message = 'Your delivery partner account has been suspended for policy violations.';
    }

    // Notify partner about approval status
    notifyDeliveryApproval(partner._id, {
      id: partner._id,
      status: approvalStatus,
      message
    });

    res.status(200).json({ success: true, data: partner });
  } catch (err) {
    next(err);
  }
};

// @desc    Update live coordinates of delivery partner
// @route   PUT /api/delivery/location
// @access  Private/Delivery
exports.updateDeliveryLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude coordinates are required.' });
    }

    const partner = await Delivery.findById(req.user.id);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    partner.currentLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      updatedAt: new Date()
    };
    
    await partner.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Location updated successfully',
      data: partner.currentLocation 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change own password
// @route   PUT /api/delivery/change-password
// @access  Private/Delivery
exports.changeDeliveryPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please provide current and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    const delivery = await Delivery.findById(req.user.id).select('+password');
    if (!delivery) return res.status(404).json({ success: false, error: 'Partner not found' });
    if (!(await delivery.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    delivery.password = newPassword;
    await delivery.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete own delivery account
// @route   DELETE /api/delivery/me
// @access  Private/Delivery
exports.deleteDeliveryAccount = async (req, res, next) => {
  try {
    await Order.updateMany({ deliveryBoy: req.user.id }, { $unset: { deliveryBoy: '' } });
    await Delivery.findByIdAndDelete(req.user.id);
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Permanently delete a delivery partner (admin only)
// @route   DELETE /api/delivery/:id
// @access  Private/Admin
exports.deleteDeliveryPartner = async (req, res, next) => {
  try {
    const partner = await Delivery.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Delivery partner not found' });
    }

    // Anonymize their order history — remove direct reference but keep order records intact
    await Order.updateMany(
      { deliveryBoy: req.params.id },
      { $unset: { deliveryBoy: '' } }
    );

    await Delivery.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Delivery partner "${partner.fullName}" has been permanently removed.`
    });
  } catch (err) {
    next(err);
  }
};
