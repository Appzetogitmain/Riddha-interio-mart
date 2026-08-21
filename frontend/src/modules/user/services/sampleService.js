import api from '../../../shared/utils/api';

/** Categories that carry a "Request Sample" CTA — mirrors the backend rules engine. */
export const SAMPLE_ELIGIBLE_CATEGORIES = [
  'marble', 'granite', 'tiles', 'laminates', 'laminate', 'veneer', 'veneers',
  'fabric', 'fabrics', 'wallpaper', 'wallpapers', 'flooring', 'paint', 'paints',
  'acrylic', 'solid surface', 'hardware'
];

export const SAMPLE_PURPOSES = [
  { value: 'personal', label: 'Personal' },
  { value: 'project', label: 'Project' },
  { value: 'client_presentation', label: 'Client presentation' },
  { value: 'comparison', label: 'Comparison' }
];

export const SAMPLE_STATUS_LABELS = {
  requested: 'Requested',
  approved: 'Approved',
  declined: 'Declined',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  feedback_given: 'Feedback given'
};

export const SAMPLE_STATUS_STYLES = {
  requested: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-teal-50 text-teal-700 border-teal-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
  dispatched: 'bg-amber-50 text-amber-700 border-amber-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  feedback_given: 'bg-slate-100 text-slate-600 border-slate-200'
};

export const SAMPLE_TIMELINE = ['requested', 'approved', 'dispatched', 'delivered', 'feedback_given'];

/**
 * Whether to show the "Request Sample" CTA for a product. Matches the backend
 * rule: the product must opt in AND sit in a touch-and-feel category.
 */
export const isSampleable = (product) => {
  if (!product || !product.sampleAvailable) return false;

  const category = product.category && typeof product.category === 'object'
    ? product.category.name
    : '';
  const haystack = [category, product.material, product.name].filter(Boolean).join(' ').toLowerCase();

  return SAMPLE_ELIGIBLE_CATEGORIES.some((c) => haystack.includes(c));
};

export const sampleService = {
  getEligibility: async () => {
    const res = await api.get('/samples/eligibility');
    return res.data;
  },

  createSampleRequest: async (payload) => {
    const res = await api.post('/samples', payload);
    return res.data;
  },

  getSampleRequests: async (params = {}) => {
    const res = await api.get('/samples', { params });
    return res.data;
  },

  getSampleRequestById: async (id) => {
    const res = await api.get(`/samples/${id}`);
    return res.data;
  },

  approve: async (id, note = '') => {
    const res = await api.post(`/samples/${id}/approve`, { note });
    return res.data;
  },

  decline: async (id, reason) => {
    const res = await api.post(`/samples/${id}/decline`, { reason });
    return res.data;
  },

  dispatch: async (id, payload) => {
    const res = await api.post(`/samples/${id}/dispatch`, payload);
    return res.data;
  },

  markDelivered: async (id) => {
    const res = await api.post(`/samples/${id}/deliver`, {});
    return res.data;
  },

  submitFeedback: async (id, payload) => {
    const res = await api.post(`/samples/${id}/feedback`, payload);
    return res.data;
  },

  refundCharge: async (id, orderId) => {
    const res = await api.post(`/samples/${id}/refund`, { orderId });
    return res.data;
  }
};

export default sampleService;
