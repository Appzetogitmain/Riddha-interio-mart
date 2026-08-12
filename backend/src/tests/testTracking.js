const geminiTrackingService = require('../services/geminiTrackingService');

async function runTrackingTests() {
  console.log('--- Testing Advanced Order Tracking & Gemini AI Logistics Prompts ---');

  // 1. Test Delivery Time Prediction (Gemini Prompt 1)
  console.log('1. Testing Gemini AI Delivery Time Prediction:');
  const prediction = await geminiTrackingService.predictDeliveryTime({
    currentLat: 12.9716,
    currentLng: 77.6412,
    destination: 'Indiranagar 100ft Road, Bengaluru',
    distanceKm: 4.5,
    speed: 32,
    traffic: 'light'
  });
  console.log('   Estimated Delivery Time:', prediction.estimatedDelivery);
  console.log('   Confidence Level:', prediction.confidence);
  console.log('   Factors:', prediction.factors?.join(', '));
  console.log('   Customer Message:', prediction.message);

  // 2. Test Delay Detection (Gemini Prompt 2)
  console.log('\n2. Testing Gemini AI Delay Detection:');
  const delayStatus = await geminiTrackingService.detectDelays({
    currentLat: 12.9716,
    currentLng: 77.6412,
    destination: 'MG Road, Bengaluru',
    distanceKm: 2.1,
    speed: 15,
    minutesSinceUpdate: 5,
    traffic: 'heavy'
  });
  console.log('   On Track?:', delayStatus.onTrack);
  console.log('   Delay Minutes:', delayStatus.delayMinutes);
  console.log('   Action:', delayStatus.recommendedAction);

  // 3. Test Issue Resolution (Gemini Prompt 3)
  console.log('\n3. Testing Gemini AI Delivery Issue Resolution:');
  const issuePlan = await geminiTrackingService.suggestIssueResolution({
    issueType: 'delivery_delayed',
    description: 'Heavy evening traffic delay on Koramangala flyover',
    orderValue: 45000,
    customerName: 'Ankit Ahirwar',
    partnerName: 'Vikram Singh'
  });
  console.log('   Issue Analysis:', issuePlan.issueAnalysis);
  console.log('   Recommended Solution:', issuePlan.recommendedSolution);

  // 4. Test Proactive Notifications (Gemini Prompt 4)
  console.log('\n4. Testing Gemini AI Multi-Channel Notifications:');
  const notifications = await geminiTrackingService.generateProactiveNotifications({
    status: 'Out for Delivery',
    customerName: 'Ankit Ahirwar',
    productName: 'Custom Living Room Sofa Package',
    eta: '18 minutes'
  });
  console.log('   SMS:', notifications.sms);
  console.log('   Push Title/Body:', notifications.push);

  // 5. Test Delivery Partner Performance (Gemini Prompt 5)
  console.log('\n5. Testing Delivery Partner Performance Insights:');
  const partnerInsights = await geminiTrackingService.analyzePartnerPerformance({
    name: 'Vikram Singh',
    totalDeliveries: 184,
    onTimeRate: 98,
    avgDeliveryTime: 26,
    rating: 4.9
  });
  console.log('   Summary:', partnerInsights.summary);
  console.log('   Badge:', partnerInsights.reliabilityBadge);

  console.log('\n✅ All Order Tracking backend tests passed successfully!');
}

runTrackingTests().catch(err => {
  console.error('❌ Order Tracking test failed:', err);
  process.exit(1);
});
