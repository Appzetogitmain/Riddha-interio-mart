const Order = require('../models/Order');
const SellerAdvertisement = require('../models/SellerAdvertisement');
const Product = require('../models/Product');
const walletService = require('./walletService');

class CronService {
  constructor() {
    this.intervalId = null;
  }

  start() {
    // Run the escrow clearance check every hour (3600000 ms)
    console.log('[CRON] Starting background services...');
    this.intervalId = setInterval(async () => {
      await this.clearExpiredEscrows();
      await this.clearExpiredAdvertisements();
    }, 60 * 60 * 1000);
    
    // Run once immediately on start
    this.clearExpiredEscrows();
    this.clearExpiredAdvertisements();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('[CRON] Background services stopped.');
    }
  }

  async clearExpiredEscrows() {
    try {
      console.log('[CRON] Checking for expired escrow periods...');
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find all orders that are Delivered and were delivered at least 7 days ago
      const eligibleOrders = await Order.find({
        status: 'Delivered',
        deliveredAt: { $lte: sevenDaysAgo }
      }).select('_id');

      let clearedCount = 0;
      for (const order of eligibleOrders) {
        try {
          // The walletService will internally check for idempotency and only clear if it's still 'pending'
          await walletService.clearPendingSale(order._id, `escrow_clear_${order._id}`);
          clearedCount++;
        } catch (err) {
          console.error(`[CRON] Failed to clear escrow for order ${order._id}:`, err.message);
        }
      }

      if (clearedCount > 0) {
        console.log(`[CRON] Successfully cleared escrow for ${clearedCount} orders.`);
      }
    } catch (error) {
      console.error('[CRON] Error in clearExpiredEscrows task:', error.message);
    }
  }

  async clearExpiredAdvertisements() {
    try {
      console.log('[CRON] Checking for expired advertisements...');
      const now = new Date();
      
      const expiredAds = await SellerAdvertisement.find({
        status: 'Active',
        endDate: { $lte: now }
      });

      if (expiredAds.length === 0) return;

      let expiredCount = 0;
      for (const ad of expiredAds) {
        try {
          ad.status = 'Expired';
          await ad.save();
          
          if (ad.products && ad.products.length > 0) {
            await Product.updateMany(
              { _id: { $in: ad.products } },
              { isAdvertised: false, advertisementEndDate: null }
            );
          }
          expiredCount++;
        } catch (err) {
          console.error(`[CRON] Failed to clear advertisement ${ad._id}:`, err.message);
        }
      }

      console.log(`[CRON] Successfully cleared ${expiredCount} expired advertisements.`);
    } catch (error) {
      console.error('[CRON] Error in clearExpiredAdvertisements task:', error.message);
    }
  }
}

module.exports = new CronService();
