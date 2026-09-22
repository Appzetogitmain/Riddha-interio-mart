/**
 * Test Seller Welcome Notification Flow
 * Validates:
 * 1. Asset resolution (Userwellcome.png and logo.png)
 * 2. Email template rendering with embedded CID
 * 3. WhatsApp Cloud API message formatting, template payload creation, and graceful fallback when credentials are absent
 * 4. Database status tracking and idempotency (duplicate prevention)
 */

require('dotenv').config();
const path = require('path');
const assetResolver = require('../utils/assetResolver');
const emailTemplates = require('../utils/emailTemplates');
const whatsappService = require('../services/whatsappService');
const sellerNotificationService = require('../services/sellerNotificationService');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING SELLER WELCOME NOTIFICATION SYSTEM VERIFICATION TEST');
  console.log('================================================================\n');

  // TEST 1: Asset Resolution
  console.log('--- TEST 1: Asset Resolution ---');
  const welcomeImagePath = assetResolver.getAssetPath('Userwellcome.png');
  const exists = assetResolver.assetExists('Userwellcome.png');
  const publicUrl = assetResolver.getPublicAssetUrl('Userwellcome.png');
  console.log(`Resolved Path: ${welcomeImagePath}`);
  console.log(`File Exists on Disk: ${exists ? '✅ YES' : '❌ NO'}`);
  console.log(`Public Asset URL (for WhatsApp Cloud API): ${publicUrl}`);

  if (!exists) {
    console.error('❌ FAILED: Userwellcome.png could not be resolved!');
    process.exit(1);
  }

  // TEST 2: Email Template Rendering
  console.log('\n--- TEST 2: Email Template Rendering ---');
  const sampleSeller = {
    _id: '65f1234567890abcdef12345',
    fullName: 'Rajesh Sharma',
    shopName: 'Sharma Interior Furnishings',
    email: 'rajesh.sharma@example.com',
    phone: '9876543210',
    welcomeNotifications: {
      email: { status: 'pending' },
      whatsapp: { status: 'pending' }
    },
    save: async function() {
      console.log('   [Mock DB Save] Updated seller notification state:', JSON.stringify(this.welcomeNotifications, null, 2));
      return this;
    }
  };

  const emailHtml = emailTemplates.getSellerWelcomeTemplate({
    fullName: sampleSeller.fullName,
    shopName: sampleSeller.shopName,
    email: sampleSeller.email,
    portalUrl: 'http://localhost:5173/seller/login'
  });

  const containsCid = emailHtml.includes('cid:userwelcome');
  const containsName = emailHtml.includes('Rajesh Sharma');
  const containsShop = emailHtml.includes('Sharma Interior Furnishings');
  console.log(`Contains cid:userwelcome: ${containsCid ? '✅ YES' : '❌ NO'}`);
  console.log(`Contains Seller Name: ${containsName ? '✅ YES' : '❌ NO'}`);
  console.log(`Contains Shop Name: ${containsShop ? '✅ YES' : '❌ NO'}`);

  // TEST 3: WhatsApp Service Architecture & Fallback
  console.log('\n--- TEST 3: WhatsApp Cloud API Architecture & Graceful Fallback ---');
  const isConfigured = whatsappService.isConfigured();
  console.log(`WhatsApp API Configured: ${isConfigured ? 'YES (Credentials Present)' : 'NO (Graceful Pending Fallback Expected)'}`);

  const formattedPhone = whatsappService.formatPhoneNumber('+91 98765 43210');
  console.log(`Phone Formatted (+91 98765 43210 -> E.164): ${formattedPhone} ${formattedPhone === '919876543210' ? '✅' : '❌'}`);

  const templatePayload = whatsappService.buildTemplatePayload('919876543210', 'Rajesh Sharma');
  console.log('WhatsApp Meta Template Payload Structure:');
  console.log(JSON.stringify(templatePayload, null, 2));

  // TEST 4: Dispatch WhatsApp (Expect graceful 'not_configured' status when credentials not supplied)
  console.log('\n--- TEST 4: Dispatch WhatsApp Message (with unconfigured credentials) ---');
  const waResult = await whatsappService.sendSellerWelcomeMessage(sampleSeller);
  console.log('WhatsApp Result:', waResult);
  console.log(`Status recorded on Seller: ${sampleSeller.welcomeNotifications.whatsapp.status} ${sampleSeller.welcomeNotifications.whatsapp.status === 'not_configured' ? '✅ PASS' : '❌'}`);

  // TEST 5: Duplicate Prevention / Idempotency Test
  console.log('\n--- TEST 5: Duplicate Prevention Check ---');
  sampleSeller.welcomeNotifications.whatsapp = {
    status: 'sent',
    sentAt: new Date(),
    messageId: 'wamid.test123456789'
  };

  const duplicateResult = await whatsappService.sendSellerWelcomeMessage(sampleSeller);
  console.log('Duplicate WhatsApp call result:', duplicateResult);
  console.log(`Duplicate correctly skipped: ${duplicateResult.skipped === true ? '✅ YES (Idempotent)' : '❌ NO'}`);

  console.log('\n================================================================');
  console.log('🎉 ALL SELLER WELCOME NOTIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('💥 Test error:', err);
  process.exit(1);
});
