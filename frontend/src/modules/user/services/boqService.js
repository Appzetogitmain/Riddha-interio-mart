import api from '../../../shared/utils/api';

export const boqService = {
  // Create manual or empty BOQ
  createBOQ: async (boqData) => {
    const res = await api.post('/boqs', boqData);
    return res.data;
  },

  // Get user's BOQs
  getBOQs: async (params = {}) => {
    const res = await api.get('/boqs', { params });
    return res.data;
  },

  // Get single BOQ by ID
  getBOQById: async (boqId) => {
    const res = await api.get(`/boqs/${boqId}`);
    return res.data;
  },

  // Update BOQ details or items array
  updateBOQ: async (boqId, data) => {
    const res = await api.put(`/boqs/${boqId}`, data);
    return res.data;
  },

  // Add single item to BOQ
  addItemToBOQ: async (boqId, itemData) => {
    const res = await api.post(`/boqs/${boqId}/items`, itemData);
    return res.data;
  },

  // Update BOQ item
  updateBOQItem: async (boqId, itemId, itemData) => {
    const res = await api.put(`/boqs/${boqId}/items/${itemId}`, itemData);
    return res.data;
  },

  // Delete BOQ item
  deleteBOQItem: async (boqId, itemId) => {
    const res = await api.delete(`/boqs/${boqId}/items/${itemId}`);
    return res.data;
  },

  // Upload Drawing/Sketch Image for Gemini AI Extraction
  extractFromDrawing: async (formData) => {
    const res = await api.post('/boqs/upload-drawing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Auto-Generate BOQ from Client Brief (Req #8)
  generateFromBrief: async (briefId) => {
    const res = await api.post(`/boqs/from-brief/${briefId}`);
    return res.data;
  },

  // Enhance Item Description with Gemini
  enhanceItemDescription: async (boqId, itemId) => {
    const res = await api.post(`/boqs/${boqId}/items/${itemId}/enhance-description`);
    return res.data;
  },

  // Request sourcing for single unlisted item
  requestItemSourcing: async (boqId, itemId, notes = '') => {
    const res = await api.post(`/boqs/${boqId}/items/${itemId}/request-sourcing`, { notes });
    return res.data;
  },

  // Request sourcing for ALL unlisted items
  requestAllUnlistedSourcing: async (boqId) => {
    const res = await api.post(`/boqs/${boqId}/request-all-sourcing`);
    return res.data;
  },

  // Download PDF Report
  downloadBOQPDF: async (boqId, boqName = 'BOQ_Report') => {
    const res = await api.get(`/boqs/${boqId}/export`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${boqName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Export CSV Spreadsheet
  downloadBOQCSV: async (boqId, boqName = 'BOQ_Items') => {
    const res = await api.get(`/boqs/${boqId}/export/csv`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${boqName.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Email BOQ Report to Client or Supplier
  emailBOQ: async (boqId, emails) => {
    const res = await api.post(`/boqs/${boqId}/email`, { emails });
    return res.data;
  },

  // Delete BOQ
  deleteBOQ: async (boqId) => {
    const res = await api.delete(`/boqs/${boqId}`);
    return res.data;
  }
};
