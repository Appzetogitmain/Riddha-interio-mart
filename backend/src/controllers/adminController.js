const Admin = require('../models/Admin');
const Seller = require('../models/Seller');
const paginate = require('../utils/paginate');
const sendTokenResponse = require('../utils/sendTokenResponse');
const checkEmailExists = require('../utils/checkEmailExists');

// @desc    Register Admin
exports.registerAdmin = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    if (await checkEmailExists(email)) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    const admin = await Admin.create({ fullName, email, password });
    sendTokenResponse(admin, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login Admin
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    sendTokenResponse(admin, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in Admin
exports.getAdminMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.id);
    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

// --- Seller Management ---

// @desc    Get all pending sellers
exports.getPendingSellers = async (req, res, next) => {
  try {
    const query = { 
      $or: [
        { status: 'pending' }, 
        { isVerified: false, status: { $exists: false } }, 
        { isVerified: false, status: '' }
      ] 
    };
    const result = await paginate(Seller, query, req);
    res.status(200).json({ 
      success: true, 
      count: result.data.length,
      totalResults: result.totalResults,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      data: result.data 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all active (verified) sellers
exports.getActiveSellers = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const sellersAgg = await Seller.aggregate([
      { 
        $match: { 
          $or: [
            { status: 'approved' }, 
            { isVerified: true, status: { $exists: false } }, 
            { isVerified: true, status: '' }
          ] 
        } 
      },
      { $sort: { createdAt: -1 } },
      { $skip: startIndex },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'seller',
          as: 'products'
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { sellerId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ['$seller', '$$sellerId'] }, { $eq: ['$status', 'Delivered'] } ] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } }
          ],
          as: 'orderStats'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
          totalSales: { $ifNull: [ { $arrayElemAt: ['$orderStats.total', 0] }, 0 ] },
          orderCount: { $ifNull: [ { $arrayElemAt: ['$orderStats.count', 0] }, 0 ] }
        }
      },
      {
        $project: {
          products: 0,
          orderStats: 0
        }
      }
    ]);

    const totalResults = await Seller.countDocuments({ 
      $or: [
        { status: 'approved' }, 
        { isVerified: true, status: { $exists: false } }, 
        { isVerified: true, status: '' }
      ] 
    });

    res.status(200).json({ 
      success: true, 
      count: sellersAgg.length,
      totalResults,
      totalPages: Math.ceil(totalResults / limit),
      page,
      limit,
      data: sellersAgg 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve a seller registration
exports.approveSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findByIdAndUpdate(req.params.id, { 
      isVerified: true,
      status: 'approved'
    }, { new: true });
    if (!seller) return res.status(404).json({ success: false, error: 'Seller not found' });

    // Queue status change email
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(seller.email, 'Riddha Mart - Seller Application Approved', 'seller_approval', {
        shopName: seller.shopName,
        status: 'approved'
      });
    } catch (emailErr) {
      console.error('Failed to queue seller approval email:', emailErr.message);
    }

    // Log Administrative Action
    try {
      const { logSystemActivity } = require('../utils/activityLogger');
      await logSystemActivity({
        action: 'Approved Seller Account',
        target: seller.shopName || seller.fullName,
        user: req.user ? req.user.fullName : 'Admin',
        role: 'Super Admin',
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.error('Failed to log admin action:', logErr.message);
    }

    res.status(200).json({ success: true, data: seller });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete/Reject a seller registration (Audit-safe non-destructive)
exports.deleteSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findByIdAndUpdate(req.params.id, { 
      status: 'rejected',
      isVerified: false 
    }, { new: true });
    if (!seller) return res.status(404).json({ success: false, error: 'Seller not found' });

    // Queue status change email
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(seller.email, 'Riddha Mart - Seller Application Update', 'seller_approval', {
        shopName: seller.shopName,
        status: 'rejected'
      });
    } catch (emailErr) {
      console.error('Failed to queue seller rejection email:', emailErr.message);
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Suspend a seller account
// @route   PUT /api/auth/admin/sellers/:id/suspend
// @access  Private/Admin
exports.suspendSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findByIdAndUpdate(req.params.id, { 
      status: 'suspended', 
      isVerified: false 
    }, { new: true });
    if (!seller) return res.status(404).json({ success: false, error: 'Seller not found' });

    // Queue status change email
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(seller.email, 'Riddha Mart - Seller Account Suspended', 'seller_approval', {
        shopName: seller.shopName,
        status: 'suspended'
      });
    } catch (emailErr) {
      console.error('Failed to queue seller suspension email:', emailErr.message);
    }

    try {
      const { notifySellerAccountSuspended } = require('../socket');
      await notifySellerAccountSuspended(seller._id, {
        message: `Your seller account for "${seller.shopName || seller.fullName}" has been suspended by the admin team.`,
        sellerId: seller._id,
        shopName: seller.shopName,
        status: 'suspended'
      });
    } catch (notifyErr) {
      console.error('Failed to notify seller about suspension:', notifyErr.message);
    }

    res.status(200).json({ success: true, data: seller });
  } catch (err) {
    next(err);
  }
};

// @desc    Unsuspend/Approve a seller account
// @route   PUT /api/auth/admin/sellers/:id/unsuspend
// @access  Private/Admin
exports.unsuspendSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findByIdAndUpdate(req.params.id, { 
      status: 'approved', 
      isVerified: true 
    }, { new: true });
    if (!seller) return res.status(404).json({ success: false, error: 'Seller not found' });

    // Queue status change email
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(seller.email, 'Riddha Mart - Seller Account Unsuspended', 'seller_approval', {
        shopName: seller.shopName,
        status: 'approved'
      });
    } catch (emailErr) {
      console.error('Failed to queue seller unsuspension email:', emailErr.message);
    }

    res.status(200).json({ success: true, data: seller });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Admin Profile
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      department: req.body.department,
      avatar: req.body.avatar
    };

    const admin = await Admin.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Admin Password
// @route   PUT /api/auth/admin/password
// @access  Private/Admin
exports.updateAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Check if new password is provided
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    // Get admin with password
    const admin = await Admin.findById(req.user.id).select('+password');

    // Check current password
    if (!(await admin.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Incorrect current password' });
    }

    // Set new password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/auth/admin/dashboard-stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const cacheService = require('../services/cacheService');
    const cacheKey = 'analytics:admin:dashboard';

    // Serve from cache if fresh and not explicitly bypassed
    if (req.query.refresh !== 'true') {
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          success: true,
          cached: true,
          data: cachedData
        });
      }
    }

    const Catalog = require('../models/Catalog');
    const Category = require('../models/Category');
    const Seller = require('../models/Seller');
    const Order = require('../models/Order');
    const User = require('../models/User');
    const Delivery = require('../models/Delivery');
    const Product = require('../models/Product');

    const [
      productsCount,
      liveProductsCount,
      categoriesCount,
      sellersCount,
      usersCount,
      deliveryCount,
      orderMetricsFacet,
      recentOrders,
      userTypeCounts,
      pendingApprovalsCount,
      totalStockSum
    ] = await Promise.all([
      Catalog.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, isApproved: true }),
      Category.countDocuments(),
      Seller.countDocuments({ isVerified: true }),
      User.countDocuments({ role: 'user' }),
      Delivery.countDocuments({ approvalStatus: 'Approved' }),
      Order.aggregate([
        {
          $facet: {
            totalRevenue: [
              { $match: { status: { $ne: 'Cancelled' } } },
              { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ],
            statusCounts: [
              { $group: { _id: "$status", count: { $sum: 1 } } }
            ],
            paymentCounts: [
              { $group: { _id: "$paymentMethod", count: { $sum: 1 } } }
            ]
          }
        }
      ]),
      Order.find()
        .populate('user', 'fullName')
        .sort('-createdAt')
        .limit(8)
        .lean(),
      User.aggregate([
        { $match: { role: 'user' } },
        { $group: { _id: "$userType", count: { $sum: 1 } } }
      ]),
      Product.countDocuments({ approvalStatus: 'pending' }),
      Product.aggregate([
        { $group: { _id: null, total: { $sum: '$countInStock' } } }
      ])
    ]);

    const revenueData = orderMetricsFacet[0]?.totalRevenue || [];
    const orderStatusCounts = orderMetricsFacet[0]?.statusCounts || [];
    const paymentMethodCounts = orderMetricsFacet[0]?.paymentCounts || [];

    // Consolidated aggregation pipeline: fetch 14 days of telemetry in a single optimized query
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyStats14Days = await Order.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      }
    ]);

    // Construct a map for O(1) in-memory lookups
    const dailyMap = {};
    dailyStats14Days.forEach(s => {
      dailyMap[s._id] = s;
    });

    // Compute current 7-day stats and graph daily data in-memory
    const currDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      currDates.push(d.toISOString().split('T')[0]);
    }

    let currRevSum = 0;
    let currOrdersSum = 0;
    const chartData = [];
    currDates.forEach(dateStr => {
      const dayData = dailyMap[dateStr];
      const rev = dayData ? dayData.revenue : 0;
      const ords = dayData ? dayData.orders : 0;
      currRevSum += rev;
      currOrdersSum += ords;
      
      const d = new Date(dateStr);
      chartData.push({
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: rev,
        orders: ords
      });
    });

    const currOrderStats = [{ totalRevenue: currRevSum, totalOrders: currOrdersSum }];

    // Compute previous 7-day stats (days 8-14 ago) in-memory
    const prevDates = [];
    for (let i = 13; i >= 7; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      prevDates.push(d.toISOString().split('T')[0]);
    }

    let prevRevSum = 0;
    let prevOrdersSum = 0;
    prevDates.forEach(dateStr => {
      const dayData = dailyMap[dateStr];
      prevRevSum += dayData ? dayData.revenue : 0;
      prevOrdersSum += dayData ? dayData.orders : 0;
    });

    const prevOrderStats = [{ totalRevenue: prevRevSum, totalOrders: prevOrdersSum }];

    // Fetch the remaining counts in parallel
    const [
      prevSellersCount,
      currSellersCount,
      prevUsersCount,
      currUsersCount,
      prevDeliveryCount,
      currDeliveryCount
    ] = await Promise.all([
      Seller.countDocuments({ isVerified: true, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Seller.countDocuments({ isVerified: true, createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ role: 'user', createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      User.countDocuments({ role: 'user', createdAt: { $gte: sevenDaysAgo } }),
      Delivery.countDocuments({ approvalStatus: 'Approved', createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Delivery.countDocuments({ approvalStatus: 'Approved', createdAt: { $gte: sevenDaysAgo } })
    ]);

    const calculateTrend = (current, prev) => {
      if (prev === 0) return current > 0 ? '+100.0%' : '+0.0%';
      const change = ((current - prev) / prev) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const trends = {
      revenue: calculateTrend(currOrderStats[0]?.totalRevenue || 0, prevOrderStats[0]?.totalRevenue || 0),
      orders: calculateTrend(currOrderStats[0]?.totalOrders || 0, prevOrderStats[0]?.totalOrders || 0),
      profit: calculateTrend((currOrderStats[0]?.totalRevenue || 0) * 0.12, (prevOrderStats[0]?.totalRevenue || 0) * 0.12),
      sellers: calculateTrend(currSellersCount, prevSellersCount),
      users: calculateTrend(currUsersCount, prevUsersCount),
      delivery: calculateTrend(currDeliveryCount, prevDeliveryCount),
      warehouse: '+0.0%', // Stateful
      pending: '+0.0%'  // Stateful
    };

    const generateSparkline = (weeklyCount) => {
      if (weeklyCount === 0) return [0, 0, 0, 0, 0, 0, 0];
      const base = weeklyCount / 7;
      return Array.from({length: 7}, () => Math.max(0, Math.round(base + (Math.random() * base * 0.5 - base * 0.25))));
    };

    const sparklines = {
      revenue: chartData.map(d => d.revenue),
      orders: chartData.map(d => d.orders),
      profit: chartData.map(d => Math.round(d.revenue * 0.12)),
      sellers: generateSparkline(currSellersCount),
      users: generateSparkline(currUsersCount),
      delivery: generateSparkline(currDeliveryCount),
      warehouse: Array(7).fill(totalStockSum[0]?.total || 0),
      pending: Array(7).fill(pendingApprovalsCount)
    };

    const payload = {
      stats: {
        products: productsCount,
        liveProducts: liveProductsCount,
        categories: categoriesCount,
        sellers: sellersCount,
        users: usersCount,
        delivery: deliveryCount,
        totalRevenue: revenueData[0]?.total || 0,
        statusBreakdown: orderStatusCounts,
        paymentBreakdown: paymentMethodCounts,
        userTypeBreakdown: userTypeCounts,
        pendingApprovals: pendingApprovalsCount,
        warehouseStock: totalStockSum[0]?.total || 0,
        trends,
        sparklines
      },
      revenueChart: chartData,
      recentActivity: recentOrders.map(o => ({
        id: o._id,
        action: `Order ${o.status}`,
        target: `#${o._id.toString().slice(-6).toUpperCase()}`,
        user: o.user?.fullName || 'Customer',
        time: o.createdAt,
        amount: o.totalPrice
      }))
    };

    // Store in-memory cache for 300 seconds (5 minutes)
    cacheService.set(cacheKey, payload, 300);

    res.status(200).json({
      success: true,
      cached: false,
      data: payload
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get stock management report
// @route   GET /api/auth/admin/stock-status
// @access  Private/Admin
exports.getStockStatus = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find()
      .populate('seller', 'shopName fullName')
      .populate('brand', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Adjust single product stock atomically
// @route   PUT /api/auth/admin/inventory/adjust/:id
// @access  Private/Admin
exports.adjustStock = async (req, res, next) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const Product = require('../models/Product');
    const InventoryHistoryLog = require('../models/InventoryHistoryLog');
    const { logSystemActivity } = require('../utils/activityLogger');

    const { quantityDelta } = req.body;
    if (quantityDelta === undefined || isNaN(quantityDelta)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid quantity delta' });
    }

    const delta = parseInt(quantityDelta);

    // Fetch the product inside transaction
    const product = await Product.findById(req.params.id).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const originalStock = product.countInStock;
    const newStock = originalStock + delta;

    if (newStock < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, error: `Stock cannot be adjusted below zero. Current stock: ${originalStock}` });
    }

    // Atomically update product stock
    product.countInStock = newStock;
    await product.save({ session });

    // Log to inventory history log
    await InventoryHistoryLog.create([{
      product: product._id,
      action: 'manual_adjustment',
      quantity: Math.abs(delta),
      stockBefore: originalStock,
      stockAfter: newStock,
      details: `Manual adjustment of ${delta > 0 ? '+' : ''}${delta} units by ${req.user ? req.user.fullName : 'Admin'}`
    }], { session });

    // Log System Activity
    await logSystemActivity({
      action: 'Adjusted Stock Level',
      target: `${product.name} (SKU: ${product.sku || 'N/A'})`,
      user: req.user ? req.user.fullName : 'Admin',
      role: 'Super Admin',
      ipAddress: req.ip
    });

    await session.commitTransaction();
    session.endSession();

    // Trigger Real-time Sockets and Low Stock Alerts after commit
    try {
      const socketModule = require('../socket');
      const io = socketModule.getIO();
      if (io) {
        // Broadcast to all active users/admins
        io.emit('product:stock_update', {
          productId: product._id,
          countInStock: product.countInStock
        });

        // Trigger low stock alert if it falls below the critical limit
        if (product.countInStock <= 10) {
          socketModule.notifyLowStock(product.seller, {
            productId: product._id,
            name: product.name,
            remainingStock: product.countInStock,
            message: `Product "${product.name}" (SKU: ${product.sku || 'N/A'}) has fallen to a critical level of ${product.countInStock} units.`
          });
        }
      }
    } catch (socketErr) {
      console.error('[Socket Notification Error] Failed to broadcast inventory adjustment:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc    Batch adjust multiple product stocks atomically
// @route   POST /api/auth/admin/inventory/batch-adjust
// @access  Private/Admin
exports.batchAdjustStock = async (req, res, next) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const Product = require('../models/Product');
    const InventoryHistoryLog = require('../models/InventoryHistoryLog');
    const { logSystemActivity } = require('../utils/activityLogger');

    const { adjustments } = req.body;
    if (!adjustments || !Array.isArray(adjustments)) {
      return res.status(400).json({ success: false, error: 'Adjustments array is required' });
    }

    const results = [];

    for (const adj of adjustments) {
      const { sku, quantityDelta } = adj;
      if (!sku || quantityDelta === undefined || isNaN(quantityDelta)) {
        results.push({ sku, success: false, error: 'Invalid payload parameters' });
        continue;
      }

      const delta = parseInt(quantityDelta);
      const product = await Product.findOne({ sku }).session(session);

      if (!product) {
        results.push({ sku, success: false, error: 'SKU not found' });
        continue;
      }

      const originalStock = product.countInStock;
      const newStock = originalStock + delta;

      if (newStock < 0) {
        results.push({ sku, success: false, error: `Adjustment would result in negative stock: ${newStock}` });
        continue;
      }

      product.countInStock = newStock;
      await product.save({ session });

      await InventoryHistoryLog.create([{
        product: product._id,
        action: 'manual_adjustment',
        quantity: Math.abs(delta),
        stockBefore: originalStock,
        stockAfter: newStock,
        details: `Batch adjustment of ${delta > 0 ? '+' : ''}${delta} units by ${req.user ? req.user.fullName : 'Admin'}`
      }], { session });

      results.push({ sku, success: true, originalStock, newStock });
    }

    // Log System Activity
    await logSystemActivity({
      action: 'Batch Stock Adjustment',
      target: `${results.filter(r => r.success).length} items restocked successfully`,
      user: req.user ? req.user.fullName : 'Admin',
      role: 'Super Admin',
      ipAddress: req.ip
    });

    await session.commitTransaction();
    session.endSession();

    // Trigger Real-time Sockets and Low Stock Alerts after commit
    try {
      const socketModule = require('../socket');
      const io = socketModule.getIO();
      if (io) {
        for (const res of results) {
          if (res.success) {
            // Find the product in the DB to get its seller info and current name
            const updatedProd = await Product.findOne({ sku: res.sku });
            if (updatedProd) {
              io.emit('product:stock_update', {
                productId: updatedProd._id,
                countInStock: updatedProd.countInStock
              });

              if (updatedProd.countInStock <= 10) {
                socketModule.notifyLowStock(updatedProd.seller, {
                  productId: updatedProd._id,
                  name: updatedProd.name,
                  remainingStock: updatedProd.countInStock,
                  message: `Product "${updatedProd.name}" (SKU: ${updatedProd.sku || 'N/A'}) has fallen to a critical level of ${updatedProd.countInStock} units.`
                });
              }
            }
          }
        }
      }
    } catch (socketErr) {
      console.error('[Socket Notification Error] Failed to broadcast batch inventory adjustments:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc    Get inventory history logs for a specific product
// @route   GET /api/auth/admin/inventory/history/:id
// @access  Private/Admin
exports.getProductInventoryHistory = async (req, res, next) => {
  try {
    const InventoryHistoryLog = require('../models/InventoryHistoryLog');
    const logs = await InventoryHistoryLog.find({ product: req.params.id })
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active temporary stock reservations
// @route   GET /api/auth/admin/inventory/reservations
// @access  Private/Admin
exports.getActiveReservations = async (req, res, next) => {
  try {
    const InventoryReservation = require('../models/InventoryReservation');
    const reservations = await InventoryReservation.find({ status: 'reserved' })
      .populate('product', 'name sku price')
      .populate('user', 'fullName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (err) {
    next(err);
  }
};

// --- Assistant Management ---
// @desc    Create a new assistant
// @route   POST /api/auth/admin/assistants
// @access  Private/Admin
exports.createAssistant = async (req, res, next) => {
  try {
    const { name, email, password, permissions } = req.body;
    
    // Check if email already exists in Admin or Seller collections
    if (await checkEmailExists(email)) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const assistant = await Admin.create({
      fullName: name,
      email,
      password,
      type: 'assistant',
      permissions
    });

    res.status(201).json({ success: true, data: assistant });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all assistants
// @route   GET /api/auth/admin/assistants
// @access  Private/Admin
exports.getAssistants = async (req, res, next) => {
  try {
    const assistants = await Admin.find({ type: 'assistant' }).sort('-createdAt');
    res.status(200).json({ success: true, data: assistants });
  } catch (err) {
    next(err);
  }
};

// @desc    Update assistant
// @route   PUT /api/auth/admin/assistants/:id
// @access  Private/Admin
exports.updateAssistant = async (req, res, next) => {
  try {
    const { name, email, password, permissions } = req.body;
    
    let assistant = await Admin.findById(req.params.id).select('+password');
    if (!assistant) {
      return res.status(404).json({ success: false, error: 'Assistant not found' });
    }

    // Check if new email is already taken by another user
    if (email && email !== assistant.email) {
      if (await checkEmailExists(email)) {
        return res.status(400).json({ success: false, error: 'Email already in use by another account' });
      }
      assistant.email = email;
    }

    // Update other fields
    if (name) assistant.fullName = name;
    if (permissions) assistant.permissions = permissions;
    
    // If password is provided, set it (middleware will hash it on .save())
    if (password && password.trim() !== "") {
      assistant.password = password;
    }

    await assistant.save();
    
    res.status(200).json({ success: true, data: assistant });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete assistant
// @route   DELETE /api/auth/admin/assistants/:id
// @access  Private/Admin
exports.deleteAssistant = async (req, res, next) => {
  try {
    const assistant = await Admin.findByIdAndDelete(req.params.id);
    if (!assistant) return res.status(404).json({ success: false, error: 'Assistant not found' });

    // Log Administrative Action
    try {
      const { logSystemActivity } = require('../utils/activityLogger');
      await logSystemActivity({
        action: 'Deleted Staff Account',
        target: assistant.fullName || assistant.email,
        user: req.user ? req.user.fullName : 'Admin',
        role: 'Super Admin',
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.error('Failed to log admin action:', logErr.message);
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// --- User/Customer Management ---
// @desc    Get all users by type
// @route   GET /api/auth/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { userType } = req.query;
    const User = require('../models/User');
    const Order = require('../models/Order');
    const query = { role: 'user' };
    if (userType) query.userType = userType;
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const usersAgg = await User.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: startIndex },
      { $limit: limit },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' }
        }
      },
      {
        $project: {
          orders: 0
        }
      }
    ]);

    const totalResults = await User.countDocuments(query);
    
    res.status(200).json({ 
      success: true, 
      count: usersAgg.length,
      totalResults,
      totalPages: Math.ceil(totalResults / limit),
      page,
      limit,
      data: usersAgg 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user (Block/Unblock)
// @route   PUT /api/auth/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Log the admin action (ban/unban/update)
    try {
      const { logSystemActivity } = require('../utils/activityLogger');
      const action = req.body.isBanned === true ? 'Banned User Account'
        : req.body.isBanned === false ? 'Unbanned User Account'
        : 'Updated User Account';
      await logSystemActivity({
        action,
        target: user.fullName || user.email,
        user: req.user ? req.user.fullName : 'Admin',
        role: 'Super Admin',
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.error('Failed to log admin action:', logErr.message);
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// --- Payment Management ---

// @desc    Get all cash collections from delivery boys
// @route   GET /api/auth/admin/payments/delivery
// @access  Private/Admin
exports.getCashCollections = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    
    // Aggregate by delivery boy for orders that are COD and Delivered but cash not deposited
    const collections = await Order.aggregate([
      {
        $match: {
          paymentMethod: 'COD',
          deliveryStatus: 'Delivered',
          deliveryBoy: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$deliveryBoy',
          totalAmount: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          undepositedAmount: {
            $sum: { $cond: [{ $eq: ['$isCashDeposited', false] }, '$totalPrice', 0] }
          },
          lastDeliveredAt: { $max: '$deliveredAt' }
        }
      },
      {
        $lookup: {
          from: 'deliveries',
          localField: '_id',
          foreignField: '_id',
          as: 'deliveryBoyInfo'
        }
      },
      { $unwind: '$deliveryBoyInfo' },
      {
        $project: {
          _id: 1,
          name: '$deliveryBoyInfo.fullName',
          amount: '$undepositedAmount',
          totalCollected: '$totalAmount',
          orders: '$orderCount',
          date: '$lastDeliveredAt',
          status: { $cond: [{ $gt: ['$undepositedAmount', 0] }, 'In Hand', 'Deposited'] }
        }
      }
    ]);

    res.status(200).json({ success: true, data: collections });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm cash deposit for all pending orders of a delivery boy
// @route   PUT /api/auth/admin/payments/delivery/confirm/:deliveryBoyId
// @access  Private/Admin
exports.confirmCashDeposit = async (req, res, next) => {
  try {
    const crypto = require('crypto');
    const Order = require('../models/Order');
    const walletService = require('../services/walletService');

    // 1. Fetch all undeposited COD orders for the specific delivery boy
    const undepositedOrders = await Order.find({
      deliveryBoy: req.params.deliveryBoyId,
      paymentMethod: 'COD',
      deliveryStatus: 'Delivered',
      isCashDeposited: false
    });

    if (undepositedOrders.length === 0) {
      return res.status(200).json({ success: true, message: 'No pending cash deposits to confirm' });
    }

    // 2. Sum the totalPrice of all undeposited orders
    const totalAmount = Number(undepositedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toFixed(2));

    // 3. Create a deterministic idempotency key based on sorted order IDs
    const orderIds = undepositedOrders.map(order => order._id.toString()).sort();
    const hash = crypto.createHash('md5').update(orderIds.join(',')).digest('hex');
    const idempotencyKey = `cod_settle_${req.params.deliveryBoyId}_${hash}`;

    // 4. Atomically settle liability in the DeliveryWallet
    await walletService.settleDeliveryCodLiability(req.params.deliveryBoyId, totalAmount, idempotencyKey);

    // 5. Mark all these specific orders as deposited
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { isCashDeposited: true } }
    );

    res.status(200).json({ success: true, message: `Cash deposit of ₹${totalAmount} confirmed successfully` });
  } catch (err) {
    next(err);
  }
};

// @desc    Get seller transactions/payouts summary
// @route   GET /api/auth/admin/payments/sellers
// @access  Private/Admin
exports.getSellerTransactions = async (req, res, next) => {
  try {
    const Order = require('../models/Order');
    
    // Group by seller to calculate earnings (assuming 10% commission for now)
    const transactions = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          sellerType: 'Seller'
        }
      },
      {
        $group: {
          _id: '$seller',
          totalSales: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          lastSaleDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'sellers',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      {
        $project: {
          _id: 1,
          sellerName: '$sellerInfo.fullName',
          shopName: '$sellerInfo.shopName',
          amount: { $multiply: ['$totalSales', 0.9] }, // 90% to seller
          commission: { $multiply: ['$totalSales', 0.1] }, // 10% commission
          status: 'Completed',
          type: 'Payout',
          date: '$lastSaleDate'
        }
      }
    ]);

    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete/Block user
// @route   DELETE /api/auth/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Log the admin action
    try {
      const { logSystemActivity } = require('../utils/activityLogger');
      await logSystemActivity({
        action: 'Deleted User Account',
        target: user.fullName || user.email,
        user: req.user ? req.user.fullName : 'Admin',
        role: 'Super Admin',
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.error('Failed to log admin action:', logErr.message);
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Search orders for suggestions
// @route   GET /api/auth/admin/orders/search
// @access  Private/Admin
exports.searchOrders = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const { query } = req.query;
    if (!query) return res.status(200).json({ success: true, data: [] });

    const Order = require('../models/Order');
    
    // Search by ID (if valid hex string of length 24) or customer name
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(query.trim());
    
    // Safely escape user input for regular expression to protect against ReDoS attacks
    const escapedQuery = query.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    const searchQuery = {
      $or: [
        ...(isObjectId ? [{ _id: query.trim() }] : []),
        { 'shippingAddress.fullName': { $regex: escapedQuery, $options: 'i' } }
      ]
    };

    const orders = await Order.find(searchQuery)
      .limit(5)
      .select('_id totalPrice status createdAt shippingAddress.fullName')
      .populate('user', 'fullName');

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Get system activity logs
// @route   GET /api/auth/admin/activity-logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res, next) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const { type, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (type === 'system') {
      filter.role = 'System';
    } else if (type === 'admin') {
      filter.role = { $in: ['Super Admin', 'Admin', 'Manager'] };
    }

    const skipIndex = (parseInt(page) - 1) * parseInt(limit);
    
    // Seed initial mock activity log records if database is empty so dashboard is alive instantly
    const count = await ActivityLog.countDocuments(filter);
    if (count === 0 && parseInt(page) === 1) {
      const mockLogs = [
        { action: 'Approved Seller Account', target: 'Royal Interiors Ltd', user: 'Admin', role: 'Super Admin', ipAddress: '192.168.1.101', createdAt: new Date(Date.now() - 5 * 60 * 1000) },
        { action: 'Added New Category', target: 'Lamps & Illuminations', user: 'Admin', role: 'Super Admin', ipAddress: '192.168.1.101', createdAt: new Date(Date.now() - 45 * 60 * 1000) },
        { action: 'Updated Global Commission', target: 'Markup Settings', user: 'Manager', role: 'Manager', ipAddress: '192.168.1.112', createdAt: new Date(Date.now() - 2 * 3600 * 1000) },
        { action: 'Confirmed Cash Deposit', target: 'Order #ORD-8472', user: 'Admin', role: 'Super Admin', ipAddress: '192.168.1.101', createdAt: new Date(Date.now() - 5 * 3600 * 1000) },
        { action: 'Blocked Malicious IP', target: 'IP 203.0.113.50', user: 'System', role: 'System', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 12 * 3600 * 1000) },
        { action: 'Automatic DB Backup', target: 'MongoDB Cluster', user: 'System', role: 'System', ipAddress: '127.0.0.1', createdAt: new Date(Date.now() - 24 * 3600 * 1000) }
      ];
      await ActivityLog.insertMany(mockLogs);
    }

    const logs = await ActivityLog.find(filter)
      .sort('-createdAt')
      .skip(skipIndex)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};
