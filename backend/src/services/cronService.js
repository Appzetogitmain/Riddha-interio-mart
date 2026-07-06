const Order = require('../models/Order');
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
    }, 60 * 60 * 1000);
    
    // Run once immediately on start
    this.clearExpiredEscrows();
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
}

module.exports = new CronService();
