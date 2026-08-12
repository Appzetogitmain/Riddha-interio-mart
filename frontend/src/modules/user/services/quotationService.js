import api from '../../../shared/utils/api';

export const quotationService = {
  // Create new quotation
  createQuotation: async (quotationData) => {
    const res = await api.post('/quotations', quotationData);
    return res.data;
  },

  // Get user quotations list
  getQuotations: async (params = {}) => {
    const res = await api.get('/quotations', { params });
    return res.data;
  },

  // Get single quotation details
  getQuotationById: async (quotationId) => {
    const res = await api.get(`/quotations/${quotationId}`);
    return res.data;
  },

  // Update quotation
  updateQuotation: async (quotationId, quotationData) => {
    const res = await api.put(`/quotations/${quotationId}`, quotationData);
    return res.data;
  },

  // Delete quotation
  deleteQuotation: async (quotationId) => {
    const res = await api.delete(`/quotations/${quotationId}`);
    return res.data;
  },

  // Import items from Cost Estimate (Req #10)
  loadFromEstimate: async (quotationId, estimateId) => {
    const res = await api.post(`/quotations/${quotationId}/load-estimate`, { estimateId });
    return res.data;
  },

  // Import items from BOQ (Req #11)
  loadFromBOQ: async (quotationId, boqId) => {
    const res = await api.post(`/quotations/${quotationId}/load-boq`, { boqId });
    return res.data;
  },

  // Generate Gemini AI message enhancements
  generateAIEnhancements: async (data) => {
    const res = await api.post('/quotations/ai-enhance', data);
    return res.data;
  },

  // Download PDF Report
  downloadQuotationPDF: async (quotationId, quotationNumber = 'Quotation') => {
    const res = await api.get(`/quotations/${quotationId}/export`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${quotationNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Email Quotation to Client
  emailQuotation: async (quotationId, clientEmail, message = '') => {
    const res = await api.post(`/quotations/${quotationId}/send`, { clientEmail, message });
    return res.data;
  },

  // Update Status (Accepted / Rejected)
  updateStatus: async (quotationId, status, acceptedBy = '') => {
    const res = await api.put(`/quotations/${quotationId}/status`, { status, acceptedBy });
    return res.data;
  },

  // Save Quotation Template
  saveTemplate: async (templateData) => {
    const res = await api.post('/quotations/templates', templateData);
    return res.data;
  },

  // Fetch Templates
  getTemplates: async () => {
    const res = await api.get('/quotations/templates');
    return res.data;
  },

  // Analytics
  getAnalytics: async () => {
    const res = await api.get('/quotations/analytics/dashboard');
    return res.data;
  }
};
