import api from '../../../shared/utils/api';

export const trackingService = {
  // Get full order tracking info
  getOrderTracking: async (orderId) => {
    const res = await api.get(`/tracking/orders/${orderId}/track`);
    return res.data;
  },

  // Get live location coordinates
  getLiveLocation: async (orderId) => {
    const res = await api.get(`/tracking/orders/${orderId}/live-location`);
    return res.data;
  },

  // Get status history timeline
  getStatusHistory: async (orderId) => {
    const res = await api.get(`/tracking/orders/${orderId}/status-history`);
    return res.data;
  },

  // Get Gemini AI delivery time prediction
  getETAPrediction: async (orderId) => {
    const res = await api.get(`/tracking/orders/${orderId}/eta`);
    return res.data;
  },

  // Check for delays
  checkDelays: async (orderId) => {
    const res = await api.post(`/tracking/orders/${orderId}/check-delays`);
    return res.data;
  },

  // Report delivery issue with Gemini solution
  reportIssue: async (orderId, issueData) => {
    const res = await api.post(`/tracking/orders/${orderId}/report-issue`, issueData);
    return res.data;
  },

  // Get single issue
  getIssueById: async (issueId) => {
    const res = await api.get(`/tracking/issues/${issueId}`);
    return res.data;
  },

  // Upload proof of delivery (Partner endpoint)
  uploadProofOfDelivery: async (orderId, proofData) => {
    const res = await api.post(`/tracking/orders/${orderId}/proof-of-delivery`, proofData);
    return res.data;
  },

  // Rate delivery (5-star rating)
  rateDelivery: async (orderId, ratingData) => {
    const res = await api.post(`/tracking/orders/${orderId}/rate`, ratingData);
    return res.data;
  },

  // Get partner delivery route (Partner View)
  getPartnerRoute: async (partnerId) => {
    const res = await api.get(`/tracking/delivery-partners/${partnerId}/route`);
    return res.data;
  },

  // Update partner status & GPS
  updatePartnerStatus: async (partnerId, statusData) => {
    const res = await api.post(`/tracking/delivery-partners/${partnerId}/status`, statusData);
    return res.data;
  },

  // Admin Tracking Analytics
  getAnalytics: async () => {
    const res = await api.get('/tracking/analytics/dashboard');
    return res.data;
  }
};
