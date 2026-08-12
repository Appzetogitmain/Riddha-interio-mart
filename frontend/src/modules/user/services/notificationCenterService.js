import api from '../../../shared/utils/api';

export const notificationCenterService = {
  // Get user notification inbox
  getUserNotifications: async (params = {}) => {
    const res = await api.get('/notifications-center/user', { params });
    return res.data;
  },

  // Send manual / triggered notification
  sendNotification: async (notificationData) => {
    const res = await api.post('/notifications-center/send', notificationData);
    return res.data;
  },

  // Mark notification as read (or 'all')
  markAsRead: async (notificationId) => {
    const res = await api.put(`/notifications-center/${notificationId}`);
    return res.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const res = await api.delete(`/notifications-center/${notificationId}`);
    return res.data;
  },

  // Get notification preferences
  getUserPreferences: async () => {
    const res = await api.get('/notifications-center/preferences');
    return res.data;
  },

  // Update notification preferences
  updateUserPreferences: async (preferencesData) => {
    const res = await api.put('/notifications-center/preferences', preferencesData);
    return res.data;
  },

  // Create campaign with Gemini A/B test variants (Admin)
  createCampaign: async (campaignData) => {
    const res = await api.post('/notifications-center/campaign', campaignData);
    return res.data;
  },

  // Get campaign details & analytics
  getCampaignById: async (campaignId) => {
    const res = await api.get(`/notifications-center/campaign/${campaignId}`);
    return res.data;
  },

  // Dispatch campaign
  dispatchCampaign: async (campaignId) => {
    const res = await api.post(`/notifications-center/campaign/${campaignId}/send`);
    return res.data;
  },

  // Analytics Dashboard
  getAnalytics: async () => {
    const res = await api.get('/notifications-center/analytics/dashboard');
    return res.data;
  },

  // Gemini AI Personalized Message Generator
  generateMessage: async (data) => {
    const res = await api.post('/notifications-center/generate-message', data);
    return res.data;
  },

  // Calculate Optimal Send Time
  getOptimalSendTime: async (data) => {
    const res = await api.post('/notifications-center/optimal-send-time', data);
    return res.data;
  }
};
