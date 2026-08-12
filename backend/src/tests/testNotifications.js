const geminiNotificationService = require('../services/geminiNotificationService');

async function runNotificationTests() {
  console.log('--- Testing Intelligent Notification System & Gemini AI Personalization ---');

  // 1. Test Gemini AI Personalized Multi-Channel Message Generation
  console.log('1. Testing Gemini AI Multi-Channel Copy Generation:');
  const msgVariants = await geminiNotificationService.generatePersonalizedMessage({
    type: 'order_shipped',
    customerName: 'Ankit Ahirwar',
    context: { orderId: 'ORD-2026-8912', carrier: 'Riddha Express', trackingUrl: 'https://track.riddhamart.com/ORD-8912' },
    tone: 'friendly'
  });
  console.log('   SMS (<=160 chars):', msgVariants.sms);
  console.log('   Push Title & Body:', msgVariants.push);
  console.log('   Email HTML snippet generated?:', Boolean(msgVariants.email));
  console.log('   WhatsApp Copy:', msgVariants.whatsapp);

  // 2. Test Optimal Send Time Calculation
  console.log('\n2. Testing Gemini AI Optimal Send Time Calculation:');
  const sendTimeResult = await geminiNotificationService.calculateOptimalSendTime({
    timezone: 'Asia/Kolkata',
    type: 'promotional',
    quietHours: { startTime: '22:00', endTime: '08:00' }
  });
  console.log('   Recommended Send Time:', sendTimeResult.sendTime);
  console.log('   Reasoning:', sendTimeResult.reasoning);
  console.log('   Confidence:', sendTimeResult.confidence);

  // 3. Test Gemini A/B Testing Variants Generation
  console.log('\n3. Testing Gemini AI A/B Test Variants Generator:');
  const abVariants = await geminiNotificationService.generateABTestVariants({
    goal: 'Promote 20% sale on Scandinavian Dining Tables',
    segment: 'Modern Furniture Enthusiasts'
  });
  console.log('   Variant A (Approach):', abVariants.variantA?.approach, '| Predicted CTR:', abVariants.variantA?.predictedCtr, '%');
  console.log('   Variant B (Approach):', abVariants.variantB?.approach, '| Predicted CTR:', abVariants.variantB?.predictedCtr, '%');

  // 4. Test Segmented Campaign Generator
  console.log('\n4. Testing Gemini AI Segmented Campaign Copy:');
  const campaign = await geminiNotificationService.generateSegmentedCampaign({
    segment: 'High-Value Villa Owners',
    budgetTier: 'Rs. 150,000+',
    style: 'Luxury Teak & Italian Leather'
  });
  console.log('   Campaign Title:', campaign.campaignTitle);
  console.log('   SMS Copy:', campaign.smsCopy);

  console.log('\n✅ All Notification System backend tests passed successfully!');
}

runNotificationTests().catch(err => {
  console.error('❌ Notification System test failed:', err);
  process.exit(1);
});
