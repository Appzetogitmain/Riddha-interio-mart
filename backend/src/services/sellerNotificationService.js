const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const Seller = require('../models/Seller');

/**
 * Seller Welcome Notification Orchestration Service
 * Coordinates Welcome Email and WhatsApp notifications with complete fault tolerance and independence.
 */
class SellerNotificationService {
  /**
   * Triggers the complete Seller Welcome Notification workflow (Email + WhatsApp)
   * Ensures 100% independence between channels.
   * @param {string|Object} sellerOrId - Seller Mongoose document or MongoDB ObjectId
   * @returns {Promise<{success: boolean, email: Object, whatsapp: Object}>}
   */
  async triggerSellerWelcomeNotifications(sellerOrId) {
    let seller = sellerOrId;

    try {
      if (typeof sellerOrId === 'string' || (sellerOrId && sellerOrId._id && !(sellerOrId instanceof Seller))) {
        const id = sellerOrId._id || sellerOrId;
        seller = await Seller.findById(id);
      }

      if (!seller) {
        console.warn('[SellerNotificationService] ⚠️ Cannot send welcome notifications: Seller record not found.');
        return { success: false, error: 'Seller not found.' };
      }

      console.log(`[SellerNotificationService] 🚀 Triggering Seller Welcome Notification flow for ${seller.fullName} (${seller.shopName || seller.email})...`);

      // Run Email and WhatsApp notification dispatches concurrently and completely independently
      const results = await Promise.allSettled([
        emailService.sendSellerWelcomeEmail(seller),
        whatsappService.sendSellerWelcomeMessage(seller)
      ]);

      const emailResult = results[0].status === 'fulfilled' 
        ? results[0].value 
        : { success: false, error: results[0].reason?.message || 'Email dispatch failed' };

      const whatsappResult = results[1].status === 'fulfilled'
        ? results[1].value
        : { success: false, error: results[1].reason?.message || 'WhatsApp dispatch failed' };

      console.log(`[SellerNotificationService] 📊 Notification summary for ${seller.email}:`, {
        email: emailResult.success ? (emailResult.skipped ? 'SKIPPED (Already Sent)' : 'SENT') : `FAILED (${emailResult.error})`,
        whatsapp: whatsappResult.success 
          ? (whatsappResult.skipped ? 'SKIPPED (Already Sent)' : 'SENT') 
          : (whatsappResult.notConfigured ? 'PENDING (API Not Configured)' : `FAILED (${whatsappResult.error})`)
      });

      return {
        success: true,
        email: emailResult,
        whatsapp: whatsappResult
      };

    } catch (err) {
      console.error('[SellerNotificationService] Unexpected error in welcome notification orchestrator:', err.message);
      // Fail-safe: Always resolve without crashing seller onboarding
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Retries any failed or pending welcome notifications for an existing seller
   * @param {string} sellerId 
   * @returns {Promise<Object>}
   */
  async retryPendingNotifications(sellerId) {
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return { success: false, error: 'Seller not found.' };
    }

    console.log(`[SellerNotificationService] 🔄 Retrying pending/failed notifications for seller ${seller.email}...`);
    return this.triggerSellerWelcomeNotifications(seller);
  }

  /**
   * Retrieves the current notification delivery status for a seller
   * @param {string} sellerId 
   * @returns {Promise<Object>}
   */
  async getNotificationStatus(sellerId) {
    const seller = await Seller.findById(sellerId).select('welcomeNotifications email phone fullName shopName');
    if (!seller) {
      return { success: false, error: 'Seller not found.' };
    }

    return {
      success: true,
      sellerId: seller._id,
      email: seller.email,
      phone: seller.phone,
      welcomeNotifications: seller.welcomeNotifications || {
        email: { status: 'pending' },
        whatsapp: { status: 'pending' }
      }
    };
  }
}

module.exports = new SellerNotificationService();
