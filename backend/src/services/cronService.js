const Order = require('../models/Order');
const SellerAdvertisement = require('../models/SellerAdvertisement');
const Product = require('../models/Product');
const User = require('../models/User');
const Seller = require('../models/Seller');
const SystemSettings = require('../models/SystemSettings');
const invoicePdfService = require('./invoicePdfService');
const emailService = require('./emailService');
const walletService = require('./walletService');

class CronService {
  constructor() {
    this.intervalId = null;
    this.invoiceIntervalId = null;
  }

  start() {
    console.log('[CRON] Starting background services...');
    // Run the escrow clearance check every hour (3600000 ms)
    this.intervalId = setInterval(async () => {
      await this.clearExpiredEscrows();
      await this.clearExpiredAdvertisements();
    }, 60 * 60 * 1000);
    
    // Run customer invoice pending auto-sender every 60 seconds (1 minute)
    this.invoiceIntervalId = setInterval(async () => {
      await this.sendPendingCustomerInvoices();
    }, 60 * 1000);
    
    // Run once immediately on start
    this.clearExpiredEscrows();
    this.clearExpiredAdvertisements();
    this.sendPendingCustomerInvoices();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('[CRON] Background services stopped.');
    }
    if (this.invoiceIntervalId) {
      clearInterval(this.invoiceIntervalId);
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

  async sendPendingCustomerInvoices() {
    try {
      console.log('[CRON] Scanning for pending customer tax invoices (5 mins cooldown)...');
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Find orders shared more than 5 minutes ago and not yet sent
      const pendingOrders = await Order.find({
        sellerInvoiceShared: true,
        sellerInvoiceSharedAt: { $lte: fiveMinutesAgo },
        customerInvoiceSentStatus: 'pending'
      });

      if (pendingOrders.length === 0) return;

      console.log(`[CRON] Found ${pendingOrders.length} pending customer invoices to send.`);

      for (const order of pendingOrders) {
        try {
          const user = await User.findById(order.user);
          if (!user) {
            console.error(`[CRON] User ${order.user} not found for order ${order._id}`);
            order.customerInvoiceSentStatus = 'failed';
            await order.save();
            continue;
          }

          const seller = await Seller.findById(order.seller);
          if (!seller) {
            console.error(`[CRON] Seller ${order.seller} not found for order ${order._id}`);
            order.customerInvoiceSentStatus = 'failed';
            await order.save();
            continue;
          }

          let settings = await SystemSettings.findOne();
          if (!settings) {
            settings = {};
          }

          // Generate Marketplace -> Customer Invoice (Bill C)
          const pdfBuffer = await invoicePdfService.generateMarketplaceToCustomerInvoice(order, seller, settings);

          // Send via emailService
          await emailService.sendCustomerInvoiceEmail(user.email, order, pdfBuffer);

          order.customerInvoiceSentStatus = 'sent';
          order.customerInvoiceSentAt = new Date();
          await order.save();
          
          console.log(`[CRON] Sent customer invoice (Bill C) for order ${order._id} to ${user.email}`);
        } catch (itemErr) {
          console.error(`[CRON] Failed to send customer invoice for order ${order._id}:`, itemErr.message);
          order.customerInvoiceSentStatus = 'failed';
          await order.save();
        }
      }
    } catch (error) {
      console.error('[CRON] Error in sendPendingCustomerInvoices task:', error.message);
    }
  }
}

module.exports = new CronService();
