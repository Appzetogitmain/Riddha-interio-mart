import api from '../../../shared/utils/api';

/** Units the RFQ form and the backend agree on. */
export const RFQ_UNITS = ['sq.ft', 'sq.m', 'pcs', 'nos', 'kg', 'box', 'rft', 'set'];

export const RFQ_UNIT_LABELS = {
  'sq.ft': 'sq.ft',
  'sq.m': 'sq.m',
  pcs: 'pieces',
  nos: 'nos',
  kg: 'kg',
  box: 'box',
  rft: 'running ft',
  set: 'set'
};

export const RFQ_STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  quoted: 'Quoted',
  negotiation: 'In negotiation',
  accepted: 'Accepted',
  converted_to_order: 'Order placed',
  rejected: 'Closed',
  expired: 'Expired'
};

export const RFQ_STATUS_STYLES = {
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  quoted: 'bg-teal-50 text-teal-700 border-teal-200',
  negotiation: 'bg-purple-50 text-purple-700 border-purple-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  converted_to_order: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-slate-100 text-slate-600 border-slate-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200'
};

/** The lifecycle order used by the detail timeline. */
export const RFQ_TIMELINE = ['submitted', 'under_review', 'quoted', 'negotiation', 'accepted', 'converted_to_order'];

export const rfqService = {
  /** AI-parse free text (and optionally a file) into structured line items. */
  parseRequirement: async ({ rawInput = '', fileSummary = '', file = null } = {}) => {
    if (file) {
      const form = new FormData();
      form.append('file', file);
      if (rawInput) form.append('rawInput', rawInput);
      if (fileSummary) form.append('fileSummary', fileSummary);
      const res = await api.post('/rfq/parse', form);
      return res.data;
    }
    const res = await api.post('/rfq/parse', { rawInput, fileSummary });
    return res.data;
  },

  createRFQ: async (payload) => {
    const res = await api.post('/rfq', payload);
    return res.data;
  },

  getRFQs: async (params = {}) => {
    const res = await api.get('/rfq', { params });
    return res.data;
  },

  getRFQById: async (rfqId) => {
    const res = await api.get(`/rfq/${rfqId}`);
    return res.data;
  },

  updateRFQ: async (rfqId, payload) => {
    const res = await api.put(`/rfq/${rfqId}`, payload);
    return res.data;
  },

  uploadAttachments: async (rfqId, files) => {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('files', file));
    const res = await api.post(`/rfq/${rfqId}/attachments`, form);
    return res.data;
  },

  routeRFQ: async (rfqId, sellerIds = []) => {
    const res = await api.post(`/rfq/${rfqId}/route`, { sellerIds });
    return res.data;
  },

  submitQuote: async (rfqId, payload) => {
    const res = await api.post(`/rfq/${rfqId}/quote`, payload);
    return res.data;
  },

  getMessages: async (rfqId, params = {}) => {
    const res = await api.get(`/rfq/${rfqId}/messages`, { params });
    return res.data;
  },

  postMessage: async (rfqId, payload) => {
    const res = await api.post(`/rfq/${rfqId}/messages`, payload);
    return res.data;
  },

  acceptQuotation: async (rfqId, quotationId) => {
    const res = await api.post(`/rfq/${rfqId}/accept`, { quotationId });
    return res.data;
  },

  rejectRFQ: async (rfqId, reason) => {
    const res = await api.post(`/rfq/${rfqId}/reject`, { reason });
    return res.data;
  },

  convertToOrder: async (rfqId, payload = {}) => {
    const res = await api.post(`/rfq/${rfqId}/convert`, payload);
    return res.data;
  },

  getAnalytics: async (params = {}) => {
    const res = await api.get('/rfq/analytics', { params });
    return res.data;
  }
};

/**
 * Hours left on a seller's 24-hour response SLA.
 * @returns {{ hours: number, breached: boolean, label: string, tone: string }}
 */
export const slaCountdown = (slaDueAt, respondedAt = null) => {
  if (!slaDueAt) return { hours: 0, breached: false, label: 'No SLA set', tone: 'neutral' };

  const reference = respondedAt ? new Date(respondedAt) : new Date();
  const hours = (new Date(slaDueAt) - reference) / 3600000;

  if (respondedAt) {
    return {
      hours,
      breached: hours < 0,
      label: hours < 0 ? 'Responded late' : 'Responded on time',
      tone: hours < 0 ? 'warn' : 'ok'
    };
  }
  if (hours < 0) {
    return { hours, breached: true, label: `SLA breached by ${Math.abs(hours).toFixed(1)}h`, tone: 'breach' };
  }
  return {
    hours,
    breached: false,
    label: hours < 1 ? `${Math.round(hours * 60)}m left` : `${hours.toFixed(1)}h left`,
    tone: hours < 4 ? 'warn' : 'ok'
  };
};

export const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default rfqService;
