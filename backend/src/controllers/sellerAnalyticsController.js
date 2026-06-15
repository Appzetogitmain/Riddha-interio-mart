const Order = require('../models/Order');
const Product = require('../models/Product');
const SellerWallet = require('../models/SellerWallet');
const mongoose = require('mongoose');

// Helper to get date boundaries based on timeRange
const getDateRange = (timeRange, startDate, endDate) => {
  const now = new Date();
  let start = new Date();
  let end = new Date(now);

  switch (timeRange) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'custom':
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start.setMonth(now.getMonth() - 1); // Default to monthly
  }
  return { start, end };
};

// @desc    Get seller dashboard analytics
// @route   GET /api/seller/analytics
// @access  Private (Seller)
exports.getSellerAnalytics = async (req, res, next) => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    
    const cacheService = require('../services/cacheService');
    const cacheKey = `analytics:seller:${req.user.id}:${timeRange || 'monthly'}:${startDate || ''}:${endDate || ''}`;

    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        cached: true,
        data: cachedData
      });
    }

    const { start, end } = getDateRange(timeRange, startDate, endDate);
    const sellerId = new mongoose.Types.ObjectId(req.user.id);

    // Date filter for queries
    const dateFilter = {
      createdAt: { $gte: start, $lte: end }
    };

    // 1. Order Stats (Total, Pending, Completed) within date range
    const orderStatsAgg = await Order.aggregate([
      { $match: { seller: sellerId, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    let totalOrders = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let periodRevenue = 0;

    orderStatsAgg.forEach(stat => {
      totalOrders += stat.count;
      if (stat._id !== 'Cancelled') {
        periodRevenue += stat.revenue;
      }
      if (stat._id === 'Pending' || stat._id === 'Processing') {
        pendingOrders += stat.count;
      } else if (stat._id === 'Delivered') {
        completedOrders += stat.count;
      }
    });

    // 2. Total Revenue (All-time)
    const totalRevenueAgg = await Order.aggregate([
      { $match: { seller: sellerId, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    // 3. Revenue Trends (Grouped by date/month)
    let groupFormat = '%Y-%m-%d';
    if (timeRange === 'yearly') {
      groupFormat = '%Y-%m';
    }

    const revenueTrends = await Order.aggregate([
      { $match: { seller: sellerId, status: { $ne: 'Cancelled' }, ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Top Selling Products
    const topProducts = await Order.aggregate([
      { $match: { seller: sellerId, status: { $ne: 'Cancelled' }, ...dateFilter } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          image: { $first: '$orderItems.image' },
          totalQuantity: { $sum: '$orderItems.quantity' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // 5. Low Stock Products
    const LOW_STOCK_THRESHOLD = 5;
    const lowStockProductsRaw = await Product.find({
      seller: req.user.id,
      countInStock: { $lt: LOW_STOCK_THRESHOLD }
    })
    .select('name images countInStock price')
    .sort({ countInStock: 1 })
    .limit(5);

    const lowStockProducts = lowStockProductsRaw.map(p => ({
      _id: p._id,
      name: p.name,
      image: p.images && p.images.length > 0 ? p.images[0] : '',
      countInStock: p.countInStock,
      price: p.price
    }));

    // 6. Wallet Balance
    const wallet = await SellerWallet.findOne({ seller: sellerId });
    const walletBalance = wallet ? (wallet.withdrawableBalance + wallet.pendingBalance) : 0;

    const payload = {
      stats: {
        totalRevenue,
        periodRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        walletBalance
      },
      revenueTrends: revenueTrends.map(t => ({
        date: t._id,
        revenue: t.revenue,
        orders: t.orders
      })),
      topProducts,
      lowStockProducts
    };

    cacheService.set(cacheKey, payload, 600); // 10 minutes cache

    res.status(200).json({
      success: true,
      cached: false,
      data: payload
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving analytics' });
  }
};
