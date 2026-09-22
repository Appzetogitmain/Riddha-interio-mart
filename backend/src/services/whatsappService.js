const axios = require('axios');
const AssetResolver = require('../utils/assetResolver');
const Seller = require('../models/Seller');

/**
 * WhatsApp Notification Service
 * Built using the official Meta WhatsApp Business Cloud API architecture.
 */
class WhatsAppService {
  constructor() {
    this.baseUrl = process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
    this.welcomeTemplateName = process.env.WHATSAPP_SELLER_WELCOME_TEMPLATE || 'seller_welcome_notification';
    this.templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
  }

  /**
   * Checks whether the WhatsApp Cloud API credentials are fully configured in the environment
   * @returns {boolean}
   */
  isConfigured() {
    // Re-check env vars in case they are updated at runtime
    const token = process.env.WHATSAPP_ACCESS_TOKEN || this.accessToken;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || this.phoneNumberId;
    return Boolean(token && token.trim().length > 0 && phoneId && phoneId.trim().length > 0);
  }

  /**
   * Sanitizes and formats phone number to standard international E.164 without leading plus
   * e.g. "+91 98765-43210" -> "919876543210"
   * e.g. "9876543210" -> "919876543210" (defaults to India 91 country code for 10-digit numbers)
   * @param {string} phone 
   * @returns {string}
   */
  formatPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If 10 digits (standard Indian mobile number), prepend country code 91
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }

    // Remove leading 0 if present before country code (e.g. 09876543210 -> 919876543210)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '91' + cleaned.substring(1);
    }

    return cleaned;
  }

  /**
   * Builds the formatted free-form fallback text message for seller welcome
   * @param {Object} seller 
   * @param {string} portalUrl 
   * @returns {string}
   */
  buildWelcomeTextMessage(seller, portalUrl) {
    const sellerName = seller.fullName || 'Seller Partner';
    const shopName = seller.shopName || 'your store';
    const loginLink = `${portalUrl}/seller/login`;

    return `🎉 *Welcome to Riddha Interior Mart!*

Dear *${sellerName}*,

Congratulations! Your seller registration for *${shopName}* has been successfully completed on *Riddha Interior Mart* — India's largest B2B and consumer marketplace for tiles, marble, sanitaryware, paints & hardware.

🚀 *What you can do next:*
• *Access Seller Portal:* ${loginLink}
• *Add Your Catalog:* List your products and custom GST pricing
• *Manage Inventory:* Track real-time stock levels
• *Merchant Intelligence:* Monitor orders & view customer inquiries
• *Meet Tejas:* Your 24/7 dedicated AI business advisor is ready in your dashboard!

Need any assistance? Contact our seller onboarding team at support@riddhamart.com or +91 9230621957.

Warm regards,
*Team Riddha Interior Mart Pvt Ltd*
🌐 www.riddhainteriormart.com
_Sell. Grow. Succeed Together._`;
  }

  /**
   * Constructs the official WhatsApp Cloud API Template Payload
   * Compliant with WhatsApp Business Platform message template specifications
   * @param {string} recipientPhone 
   * @param {Object} seller 
   * @param {string} portalUrl 
   * @returns {Object}
   */
  buildTemplatePayload(recipientPhone, seller, portalUrl) {
    const welcomeImageUrl = AssetResolver.getWelcomeImageUrl();
    const sellerName = seller.fullName || 'Seller Partner';
    const shopName = seller.shopName || 'your store';
    const loginLink = `${portalUrl}/seller/login`;

    const components = [
      // 1. Header Component (Userwellcome.png image banner)
      {
        type: 'header',
        parameters: [
          {
            type: 'image',
            image: {
              link: welcomeImageUrl
            }
          }
        ]
      },
      // 2. Body Component with dynamic template parameters
      {
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: sellerName
          },
          {
            type: 'text',
            text: shopName
          },
          {
            type: 'text',
            text: loginLink
          }
        ]
      }
    ];

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'template',
      template: {
        name: this.welcomeTemplateName,
        language: {
          code: this.templateLanguage
        },
        components
      }
    };
  }

  /**
   * Constructs direct interactive/text payload for direct session messaging
   * @param {string} recipientPhone 
   * @param {string} messageText 
   * @returns {Object}
   */
  buildTextPayload(recipientPhone, messageText) {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: messageText
      }
    };
  }

  /**
   * Sends the official Seller Welcome WhatsApp notification
   * Handles both configured Cloud API delivery and graceful not_configured fallback
   * @param {Object} sellerDoc 
   * @returns {Promise<{success: boolean, notConfigured?: boolean, skipped?: boolean, messageId?: string, error?: string}>}
   */
  async sendSellerWelcomeMessage(sellerDoc) {
    if (!sellerDoc || !sellerDoc.phone) {
      console.warn('[WhatsAppService] ⚠️ Cannot send WhatsApp welcome: missing seller or phone number.');
      return { success: false, error: 'Missing seller phone number.' };
    }

    const sellerId = sellerDoc._id;
    const recipientPhone = this.formatPhoneNumber(sellerDoc.phone);

    if (!recipientPhone || recipientPhone.length < 10) {
      console.warn(`[WhatsAppService] ⚠️ Invalid recipient phone number format: "${sellerDoc.phone}"`);
      await Seller.findByIdAndUpdate(sellerId, {
        $set: {
          'welcomeNotifications.whatsapp.status': 'failed',
          'welcomeNotifications.whatsapp.error': `Invalid phone number format: ${sellerDoc.phone}`
        }
      });
      return { success: false, error: 'Invalid phone number format.' };
    }

    // 1. Idempotency Check: Prevent duplicate messages
    if (sellerDoc.welcomeNotifications?.whatsapp?.status === 'sent') {
      console.log(`[WhatsAppService] ℹ️ WhatsApp welcome notification already sent to ${recipientPhone} at ${sellerDoc.welcomeNotifications.whatsapp.sentAt}. Skipping duplicate.`);
      return { success: true, skipped: true, reason: 'already_sent' };
    }

    // 2. Configuration Check
    if (!this.isConfigured()) {
      console.log(`[WhatsAppService] ℹ️ WhatsApp Business API is not configured in environment (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing). Keeping status as 'not_configured'.`);
      
      try {
        await Seller.findByIdAndUpdate(sellerId, {
          $set: {
            'welcomeNotifications.whatsapp.status': 'not_configured',
            'welcomeNotifications.whatsapp.error': 'WhatsApp API credentials not configured in environment',
            'welcomeNotifications.whatsapp.sentAt': null
          }
        });
      } catch (dbErr) {
        console.error('[WhatsAppService] Failed to update not_configured status in DB:', dbErr.message);
      }

      return {
        success: false,
        notConfigured: true,
        message: 'WhatsApp credentials not configured yet. Notification marked as pending/not_configured.'
      };
    }

    // 3. WhatsApp Cloud API Dispatch
    const token = process.env.WHATSAPP_ACCESS_TOKEN || this.accessToken;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || this.phoneNumberId;
    const apiUrl = `${this.baseUrl}/${this.apiVersion}/${phoneId}/messages`;
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const payload = this.buildTemplatePayload(recipientPhone, sellerDoc, portalUrl);

    try {
      console.log(`[WhatsAppService] 📤 Dispatching WhatsApp welcome message to ${recipientPhone}...`);

      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const messageId = response.data?.messages && response.data.messages[0]?.id ? response.data.messages[0].id : 'wamid.success';

      // Update DB with successful delivery status
      await Seller.findByIdAndUpdate(sellerId, {
        $set: {
          'welcomeNotifications.whatsapp.status': 'sent',
          'welcomeNotifications.whatsapp.sentAt': new Date(),
          'welcomeNotifications.whatsapp.messageId': messageId,
          'welcomeNotifications.whatsapp.error': null
        }
      });

      console.log(`[WhatsAppService] ✅ WhatsApp welcome message successfully sent to ${recipientPhone} (Message ID: ${messageId})`);
      return { success: true, messageId };

    } catch (apiErr) {
      const errorDetail = apiErr.response?.data?.error?.message || apiErr.message;
      const errorCode = apiErr.response?.data?.error?.code || 'API_ERROR';

      console.error(`[WhatsAppService] ❌ Meta WhatsApp Cloud API Error (${errorCode}):`, errorDetail);

      // Record graceful failure in DB without throwing
      try {
        await Seller.findByIdAndUpdate(sellerId, {
          $set: {
            'welcomeNotifications.whatsapp.status': 'failed',
            'welcomeNotifications.whatsapp.error': `WhatsApp Cloud API error (${errorCode}): ${errorDetail}`
          }
        });
      } catch (dbErr) {
        console.error('[WhatsAppService] Failed to update whatsapp failure in DB:', dbErr.message);
      }

      return { success: false, error: errorDetail };
    }
  }
}

module.exports = new WhatsAppService();
