import api from '../../../shared/utils/api';

export const estimatorService = {
  // Create new cost estimate
  createEstimate: async (estimateData) => {
    const res = await api.post('/estimates', estimateData);
    return res.data;
  },

  // Get user's saved cost estimates
  getEstimates: async (params = {}) => {
    const res = await api.get('/estimates', { params });
    return res.data;
  },

  // Get estimate details by ID
  getEstimateById: async (estimateId) => {
    const res = await api.get(`/estimates/${estimateId}`);
    return res.data;
  },

  // Update estimate
  updateEstimate: async (estimateId, data) => {
    const res = await api.put(`/estimates/${estimateId}`, data);
    return res.data;
  },

  // Get 3-tier comparison details
  getTierComparison: async (estimateId) => {
    const res = await api.get(`/estimates/${estimateId}/comparison`);
    return res.data;
  },

  // Download PDF estimate report directly
  downloadEstimatePDF: async (estimateId, estimateName = 'Cost_Estimate') => {
    const res = await api.get(`/estimates/${estimateId}/export`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${estimateName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Email estimate to client
  emailEstimate: async (estimateId, clientEmail) => {
    const res = await api.post(`/estimates/${estimateId}/email`, { clientEmail });
    return res.data;
  },

  // Save estimate as template
  saveAsTemplate: async (estimateId, templateName) => {
    const res = await api.post(`/estimates/${estimateId}/save-template`, { templateName });
    return res.data;
  },

  // Get saved estimate templates
  getTemplates: async () => {
    const res = await api.get('/estimates/templates');
    return res.data;
  },

  // Delete estimate
  deleteEstimate: async (estimateId) => {
    const res = await api.delete(`/estimates/${estimateId}`);
    return res.data;
  }
};
