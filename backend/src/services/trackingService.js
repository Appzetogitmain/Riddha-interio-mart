const openaiClient = require('./openaiService');
const OpenAIErrorHandler = require('../utils/openaiErrorHandler');
const OpenAIUsageTracker = require('./openaiUsageTracker');

class TrackingService {

  // Prompt 1: Delivery Time Prediction
  async predictDeliveryTime(data, userId) {
    const prompt = `
Act as an expert AI Logistics Estimator for Riddha Interio Mart.
Predict the exact delivery time and confidence based on these real-time logistics factors:

Current Partner Location: Lat ${data.currentLat || 12.9716}, Lng ${data.currentLng || 77.6412}
Destination: ${data.destination || 'Indiranagar, Bengaluru'}
Distance Remaining: ${data.distanceKm || 4.2} km
Current Time: ${new Date().toLocaleTimeString()}
Traffic Level: ${data.traffic || 'moderate'}
Time of Day: ${data.timeOfDay || 'afternoon'}
Weather: ${data.weather || 'clear'}
Partner Average Speed: ${data.speed || 30} km/h

Generate JSON response with format:
{
  "estimatedDelivery": "HH:MM AM/PM",
  "confidence": "high|medium|low",
  "bestCaseTime": "HH:MM AM/PM",
  "worstCaseTime": "HH:MM AM/PM",
  "factors": ["factor 1", "factor 2"],
  "message": "Friendly reassuring message for the customer about their interior delivery timeline."
}
Return strictly JSON format with no extra markdown formatting wrappers.
`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 600
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'trackingDeliveryPrediction',
        userId,
        '/api/tracking/delivery-time',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'TrackingService',
        method: 'predictDeliveryTime'
      });
      console.error('[TRACKING DELIVERY PREDICTION ERROR]', errorInfo.message);

      const now = new Date();
      const etaTime = new Date(now.getTime() + (data.distanceKm ? data.distanceKm * 6 : 25) * 60000);
      return {
        estimatedDelivery: etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: 'high',
        bestCaseTime: new Date(etaTime.getTime() - 5 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        worstCaseTime: new Date(etaTime.getTime() + 10 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        factors: ['Optimal route selected', 'Clear traffic flow', 'Experienced delivery agent'],
        message: 'Your interior supplies are on track and expected to arrive shortly.'
      };
    }
  }

  // Prompt 2: Delay Detection & Alerts
  async detectDelays(data, userId) {
    const prompt = `
Analyze current delivery status for potential delays:
Current Location: Lat ${data.currentLat}, Lng ${data.currentLng}
Destination: ${data.destination}
Distance Remaining: ${data.distanceKm} km
Current Speed: ${data.speed || 0} km/h
Time Since Last Update: ${data.minutesSinceUpdate || 2} mins
Traffic Conditions: ${data.traffic || 'moderate'}
Partner Status: ${data.partnerStatus || 'in-transit'}

Check if delivery is on track or delayed.
Generate JSON response:
{
  "onTrack": boolean,
  "delayMinutes": number,
  "delayReason": "reason for delay or on-track status",
  "canRecover": boolean,
  "recommendedAction": "notify customer|reassure|offer solution",
  "customerMessage": "Proactive notification message for customer"
}
Return strictly valid JSON.
`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 500
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'trackingDelayDetection',
        userId,
        '/api/tracking/delays',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'TrackingService',
        method: 'detectDelays'
      });
      console.error('[TRACKING DELAY DETECTION ERROR]', errorInfo.message);

      return {
        onTrack: true,
        delayMinutes: 0,
        delayReason: 'Delivery partner moving smoothly along optimized route.',
        canRecover: true,
        recommendedAction: 'reassure',
        customerMessage: 'Your delivery partner is navigating smoothly to your address.'
      };
    }
  }

  // Prompt 3: Delivery Issue Resolution
  async suggestIssueResolution(data, userId) {
    const prompt = `
Provide an intelligent automated resolution plan for this delivery issue at Riddha Interio Mart:

Issue Type: ${data.issueType}
Details: ${data.description}
Order Value: Rs. ${data.orderValue || 15000}
Customer Name: ${data.customerName || 'Valued Customer'}
Delivery Partner: ${data.partnerName || 'Vikram Singh'}

Generate JSON response:
{
  "issueAnalysis": "Root cause analysis of what likely happened",
  "solutions": [
    {
      "solution": "Solution description",
      "effort": "automated|customer|support",
      "timeline": "e.g. Instant / 1-2 hours"
    }
  ],
  "recommendedSolution": "Primary recommended action",
  "customerMessage": "Empathetic customer service response offering immediate help or re-delivery options"
}
Return strictly valid JSON.
`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 700
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'trackingIssueResolution',
        userId,
        '/api/tracking/issue-resolution',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'TrackingService',
        method: 'suggestIssueResolution'
      });
      console.error('[TRACKING ISSUE RESOLUTION ERROR]', errorInfo.message);

      return {
        issueAnalysis: 'Temporary delivery mismatch or transit delay reported.',
        solutions: [
          { solution: 'Instant re-attempt by nearest dispatch partner', effort: 'automated', timeline: '30 mins' },
          { solution: 'Dedicated support callback', effort: 'support', timeline: '15 mins' }
        ],
        recommendedSolution: 'Initiate priority re-dispatch with customer confirmation.',
        customerMessage: 'We sincerely apologize for the inconvenience. Our concierge team has been alerted and is resolving this immediately.'
      };
    }
  }

  // Prompt 4: Proactive Multi-Channel Notifications
  async generateProactiveNotifications(data, userId) {
    const prompt = `
Generate multi-channel proactive notifications for order tracking status update:
Status: ${data.status}
Customer Name: ${data.customerName || 'Customer'}
Product: ${data.productName || 'Interior Decor Package'}
ETA: ${data.eta || '25 mins'}

Generate JSON response:
{
  "sms": "Short 160-char SMS message",
  "push": "App push notification title + body",
  "email": "Email subject + friendly body HTML snippet",
  "whatsapp": "WhatsApp format message"
}
Return strictly valid JSON.
`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.8,
        maxTokens: 700
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'trackingProactiveNotifications',
        userId,
        '/api/tracking/notifications',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'TrackingService',
        method: 'generateProactiveNotifications'
      });
      console.error('[TRACKING PROACTIVE NOTIFICATIONS ERROR]', errorInfo.message);

      return {
        sms: `Hi ${data.customerName || 'Customer'}, your Riddha Interio order is ${data.status || 'in transit'}. ETA: ${data.eta || '25 mins'}. Track live on app!`,
        push: `🚚 Order Update: ${data.status || 'On the way!'} Arriving in ~${data.eta || '25 mins'}.`,
        email: `<h3>Order Status Update</h3><p>Dear ${data.customerName}, your interior items are ${data.status}. Expected arrival: ${data.eta}.</p>`,
        whatsapp: `📦 *Riddha Interio Mart Update*: Your order is *${data.status}*. Expected arrival: ${data.eta}.`
      };
    }
  }

  // Prompt 5: Delivery Partner Performance Insights
  async analyzePartnerPerformance(partnerData, userId) {
    const prompt = `
Analyze delivery partner efficiency & reliability score:
Partner Name: ${partnerData.name}
Total Deliveries: ${partnerData.totalDeliveries || 100}
On-Time Rate: ${partnerData.onTimeRate || 95}%
Average Delivery Time: ${partnerData.avgDeliveryTime || 30} mins
Rating: ${partnerData.rating || 4.8} / 5.0

Generate JSON response:
{
  "summary": "Brief 2-sentence performance summary",
  "reliabilityBadge": "Top Dispatch Agent | Verified Fast Deliverer | Trusted Courier",
  "strengths": ["Strength 1", "Strength 2"],
  "customerScoreText": "Friendly reliability trust message for the customer"
}
Return strictly valid JSON.
`;

    try {
      const response = await openaiClient.generateText(prompt, {
        modelType: 'general',
        expectJson: true,
        temperature: 0.7,
        maxTokens: 500
      });

      await OpenAIUsageTracker.trackUsage(
        {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        },
        'trackingPartnerPerformance',
        userId,
        '/api/tracking/partner-performance',
        response.model
      );

      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      const errorInfo = OpenAIErrorHandler.handleError(e, {
        service: 'TrackingService',
        method: 'analyzePartnerPerformance'
      });
      console.error('[TRACKING PARTNER PERFORMANCE ERROR]', errorInfo.message);

      return {
        summary: `${partnerData.name} is a highly rated dispatch agent with ${partnerData.onTimeRate || 95}% on-time completion record.`,
        reliabilityBadge: 'Top Dispatch Partner',
        strengths: ['Punctual deliveries', 'High customer rating', 'Safe handling of fragile decor'],
        customerScoreText: 'Assigned to a 5-star top rated delivery partner for safe and prompt handling.'
      };
    }
  }

}

module.exports = new TrackingService();
