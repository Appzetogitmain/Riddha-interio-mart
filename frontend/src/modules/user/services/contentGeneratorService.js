import api from '../../../shared/utils/api';

export const contentGeneratorService = {
  // Generate content using Gemini AI
  generateContent: async (params) => {
    const res = await api.post('/content/generate', params);
    return res.data;
  },

  // Get single content details
  getContentById: async (contentId) => {
    const res = await api.get(`/content/${contentId}`);
    return res.data;
  },

  // Get seller content library
  getSellerLibrary: async (params = {}) => {
    const res = await api.get('/content/seller/library', { params });
    return res.data;
  },

  // Update content
  updateContent: async (contentId, data) => {
    const res = await api.put(`/content/${contentId}`, data);
    return res.data;
  },

  // Delete content
  deleteContent: async (contentId) => {
    const res = await api.delete(`/content/${contentId}`);
    return res.data;
  },

  // 1-Click Publish content to product
  publishContent: async (contentId, publishData) => {
    const res = await api.post(`/content/${contentId}/publish`, publishData);
    return res.data;
  },

  // Bulk generate content
  bulkGenerate: async (bulkData) => {
    const res = await api.post('/content/bulk-generate', bulkData);
    return res.data;
  },

  // Content templates
  getTemplates: async () => {
    const res = await api.get('/content/templates');
    return res.data;
  },

  createTemplate: async (templateData) => {
    const res = await api.post('/content/templates', templateData);
    return res.data;
  }
};
