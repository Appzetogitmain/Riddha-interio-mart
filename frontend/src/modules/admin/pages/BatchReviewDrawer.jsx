import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, ChevronRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const statusColors = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'  },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200'},
  rejected: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'    },
};

const batchStatusMeta = {
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700'     },
  in_progress:    { label: 'In Progress',    color: 'bg-blue-100 text-blue-700'       },
  completed:      { label: 'Completed',      color: 'bg-emerald-100 text-emerald-700' },
};

// Avatar-style fallback with product name initials
const ProductThumb = ({ images, name }) => {
  const src = images && images[0];
  const isValidUrl = src && src.startsWith('http');

  const initials = (name || 'P')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (isValidUrl) {
    return (
      <div className="w-12 h-12 shrink-0">
        <img
          src={src}
          alt=""
          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<div class="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center"><span class="text-slate-600 text-xs font-black">${initials}</span></div>`;
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
      <span className="text-slate-600 text-xs font-black">{initials}</span>
    </div>
  );
};

// ── Single product review row ────────────────────────────────────
const ProductReviewItem = ({ item, batchId, onReviewed }) => {
  const p = item.product || {};
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [reason, setReason] = useState('');
  const [b2cCommission, setB2cCommission] = useState('');
  const [b2bCommission, setB2bCommission] = useState('');
  const [loading, setLoading] = useState(null);
  const s = statusColors[item.status] || statusColors.pending;

  const displayPrice = p.price || p.sellerPrice || 0;
  const rawDesc = p.description ? p.description.replace(/<[^>]+>/g, '').trim() : null;
  const descSnippet = rawDesc ? rawDesc.slice(0, 72) : null;

  const submit = async (action) => {
    if (action === 'rejected' && !reason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setLoading(action);
    try {
      const payload = {
        action,
        rejectionReason: action === 'rejected' ? reason.trim() : ''
      };
      if (action === 'approved') {
        payload.adminCommission = Number(b2cCommission) || 0;
        payload.b2bAdminCommission = Number(b2bCommission) || 0;
      }
      
      await api.patch(`/product-batches/${batchId}/products/${p._id}`, payload);
      toast.success(action === 'approved' ? `"${p.name}" approved!` : `"${p.name}" rejected`);
      onReviewed(p._id, action, reason);
      setShowReject(false);
      setShowApprove(false);
      setReason('');
      setB2cCommission('');
      setB2bCommission('');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Action failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <ProductThumb images={p.images} name={p.name} />

        {/* Product info — 3 rows */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Row 1: name */}
          <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
            {p.name || <span className="text-slate-400 italic text-xs">Unnamed product</span>}
          </p>

          {/* Row 2: category chips + price */}
          <div className="flex flex-wrap items-center gap-1.5">
            {p.category && (
              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-md">
                {p.category}
              </span>
            )}
            {p.subcategory && (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {p.subcategory}
              </span>
            )}
            <span className="text-xs font-bold text-slate-800 ml-auto">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Row 3: description snippet + SKU */}
          {(descSnippet || p.sku) && (
            <p className="text-[11px] text-slate-400 leading-snug">
              {descSnippet && (
                <span>{descSnippet}{rawDesc.length > 72 ? '…' : ''}</span>
              )}
              {descSnippet && p.sku && <span className="mx-1">·</span>}
              {p.sku && <span>SKU: {p.sku}</span>}
            </p>
          )}
        </div>

        {/* Status badge or action buttons */}
        {item.status !== 'pending' ? (
          <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${s.bg} ${s.text} ${s.border}`}>
            {item.status === 'approved' ? <Check size={11} /> : <XCircle size={11} />}
            <span className="capitalize">{item.status}</span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { setShowApprove(v => !v); setShowReject(false); }}
              disabled={!!loading}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all disabled:opacity-50 ${
                showApprove
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Check size={12} />
              Approve
            </button>
            <button
              onClick={() => { setShowReject(v => !v); setShowApprove(false); }}
              disabled={!!loading}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all disabled:opacity-50 ${
                showReject
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              }`}
            >
              <XCircle size={12} />
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Rejection reason display after review */}
      {item.status === 'rejected' && item.rejectionReason && (
        <div className="mx-3 mb-3 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
          <p className="text-[11px] text-red-600 font-semibold">Reason: {item.rejectionReason}</p>
        </div>
      )}

      {/* Inline rejection textarea */}
      <AnimatePresence>
        {showReject && item.status === 'pending' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-3 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rejection Reason</p>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Image quality is poor, description is incomplete…"
                rows={2}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-red-400/30 focus:border-red-400 outline-none resize-none bg-slate-50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => submit('rejected')}
                  disabled={!!loading || !reason.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {loading === 'rejected'
                    ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <XCircle size={12} />}
                  Confirm Reject
                </button>
                <button
                  onClick={() => { setShowReject(false); setReason(''); }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {showApprove && item.status === 'pending' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-3 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    B2C Commission (%)
                  </label>
                  <input
                    type="number"
                    value={b2cCommission}
                    onChange={e => setB2cCommission(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-slate-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    B2B Commission (%)
                  </label>
                  <input
                    type="number"
                    value={b2bCommission}
                    onChange={e => setB2bCommission(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 bg-slate-50"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => submit('approved')}
                  disabled={!!loading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {loading === 'approved'
                    ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Check size={12} />}
                  Confirm Approve
                </button>
                <button
                  onClick={() => { setShowApprove(false); setB2cCommission(''); setB2bCommission(''); }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Drawer ───────────────────────────────────────────────────────
const BatchReviewDrawer = ({ batch: initialBatch, onClose, onBatchUpdate }) => {
  const [batch, setBatch] = useState(initialBatch);
  const meta = batchStatusMeta[batch.status] || batchStatusMeta.pending_review;
  const seller = batch.seller || {};
  const reviewed = batch.approvedCount + batch.rejectedCount;
  const pct = batch.totalProducts > 0 ? Math.round((reviewed / batch.totalProducts) * 100) : 0;

  const handleReviewed = (productId, action, rejReason) => {
    setBatch(prev => {
      const products = prev.products.map(item =>
        item.product?._id === productId || item.product === productId
          ? { ...item, status: action, rejectionReason: rejReason }
          : item
      );
      const approvedCount = products.filter(i => i.status === 'approved').length;
      const rejectedCount = products.filter(i => i.status === 'rejected').length;
      const pendingCount  = products.filter(i => i.status === 'pending').length;
      const status = pendingCount === 0 ? 'completed' : 'in_progress';
      const updated = { ...prev, products, approvedCount, rejectedCount, pendingCount, status };
      if (onBatchUpdate) onBatchUpdate(updated);
      return updated;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative ml-auto w-full max-w-lg h-full bg-slate-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900">
                  {seller.shopName || seller.fullName || 'Seller'}
                </h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-500">{batch.totalProducts} products</span>
                {' · '}
                Submitted {new Date(batch.submittedAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>{reviewed} of {batch.totalProducts} reviewed</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold pt-0.5">
              <span className="text-emerald-600">{batch.approvedCount} Approved</span>
              <span className="text-red-500">{batch.rejectedCount} Rejected</span>
              <span className="text-slate-400">{batch.pendingCount} Pending</span>
            </div>
          </div>
        </div>

        {/* Scrollable product list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {(!batch.products || batch.products.length === 0) ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <Package size={36} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-400">No products in this batch</p>
            </div>
          ) : (
            batch.products.map(item => (
              <ProductReviewItem
                key={item._id || item.product?._id}
                item={item}
                batchId={batch._id}
                onReviewed={handleReviewed}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <ChevronRight size={15} />
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BatchReviewDrawer;
