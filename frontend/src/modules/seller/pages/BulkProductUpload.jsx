import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Clock, ChevronDown, ChevronUp,
  Package, AlertCircle, Send, RefreshCw, ImageOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { connectSocket } from '../../../shared/utils/socket';
import PageWrapper from '../components/PageWrapper';

const statusColors = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  dot: 'bg-amber-500'  },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',dot: 'bg-emerald-500'},
  rejected: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',    dot: 'bg-red-500'    },
};

const batchStatusMeta = {
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700'      },
  in_progress:    { label: 'In Progress',    color: 'bg-blue-100 text-blue-700'        },
  completed:      { label: 'Completed',      color: 'bg-emerald-100 text-emerald-700'  },
};

const ProductThumb = ({ images }) => {
  const src = images && images[0];
  if (!src || src.startsWith('C:')) return (
    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
      <ImageOff size={18} className="text-slate-400" />
    </div>
  );
  return <img src={src} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0" />;
};

// ── Batch History Card ──────────────────────────────────────────────
const BatchCard = ({ batch }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = batchStatusMeta[batch.status] || batchStatusMeta.pending_review;
  const pct = batch.totalProducts > 0
    ? Math.round((batch.approvedCount / batch.totalProducts) * 100)
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${meta.color}`}>
              {meta.label}
            </span>
            <span className="text-[11px] text-slate-400">
              {new Date(batch.submittedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              {batch.pendingCount} Pending
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {batch.approvedCount} Approved
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {batch.rejectedCount} Rejected
            </span>
            <span className="text-slate-400">/ {batch.totalProducts} total</span>
          </div>
          <div className="mt-3 w-full max-w-xs bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors mt-0.5"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-4 space-y-2">
              {batch.products.map((item) => {
                const p = item.product || {};
                const s = statusColors[item.status] || statusColors.pending;
                return (
                  <div key={item._id || p._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <ProductThumb images={p.images} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.name || '—'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p.category || ''}{p.sku ? ` · SKU: ${p.sku}` : ''}
                      </p>
                      {item.status === 'rejected' && item.rejectionReason && (
                        <p className="mt-1 text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-lg inline-block">
                          Reason: {item.rejectionReason}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      <span className="capitalize">{item.status}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────
const BulkProductUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    new URLSearchParams(location.search).get('tab') === 'history' ? 'history' : 'submit'
  );
  const [pendingProducts, setPendingProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products/my-products');
      const all = res.data.data || [];
      const eligible = all.filter(p => p.approvalStatus === 'pending' && !p.batchId);
      setPendingProducts(eligible);
      setSelectedIds(new Set(eligible.map(p => p._id)));
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const res = await api.get('/product-batches/my-batches');
      setBatches(res.data.data || []);
    } catch {
      toast.error('Failed to load batch history');
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  useEffect(() => {
    if (activeTab === 'history') fetchBatches();
  }, [activeTab, fetchBatches]);

  // Silently refresh batch history when admin reviews a product
  // (popup notification + sound is handled globally by SellerNotifications in App.jsx)
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('riddha_user') || '{}');
    const token = userData?.token;
    if (!token) return;

    const socket = connectSocket({ token });
    socket.on('batch:product_reviewed', fetchBatches);
    return () => { socket.off('batch:product_reviewed', fetchBatches); };
  }, [fetchBatches]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pendingProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pendingProducts.map(p => p._id)));
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return toast.error('Select at least one product');
    setSubmitting(true);
    try {
      await api.post('/product-batches');
      toast.success(`${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''} submitted for review!`);
      setPendingProducts([]);
      setSelectedIds(new Set());
      setActiveTab('history');
      fetchBatches();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const allSelected = pendingProducts.length > 0 && selectedIds.size === pendingProducts.length;

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6 pb-32">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Submission</h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit your pending products to admin for approval in one go.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {[
            { key: 'submit',  label: 'Submit Batch',  badge: pendingProducts.length },
            { key: 'history', label: 'Batch History', badge: batches.length         },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-seller-primary text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Submit Batch Tab ── */}
          {activeTab === 'submit' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {loadingProducts ? (
                <div className="py-24 flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-seller-primary rounded-full animate-spin" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading products…</p>
                </div>
              ) : pendingProducts.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center px-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                    <Package size={36} className="text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs">
                      No pending products to submit. Add products first via <strong>Add New Product</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/seller/add-product?mode=new&from=bulk-upload')}
                    className="px-5 py-2.5 bg-seller-primary text-white rounded-xl font-bold text-sm hover:bg-seller-dark transition-all"
                  >
                    + Add Product
                  </button>
                </div>
              ) : (
                <>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 accent-seller-primary rounded cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-700">
                        {selectedIds.size > 0 ? `${selectedIds.size} of ${pendingProducts.length} selected` : 'Select all'}
                      </span>
                    </label>
                    <button
                      onClick={fetchPending}
                      title="Refresh"
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>

                  {/* Product Cards */}
                  <div className="grid grid-cols-1 gap-3">
                    {pendingProducts.map((p, i) => (
                      <motion.div
                        key={p._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => toggleSelect(p._id)}
                        className={`flex items-center gap-4 p-4 bg-white rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${
                          selectedIds.has(p._id)
                            ? 'border-seller-primary bg-seller-primary/5 shadow-seller-primary/10 shadow-md'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p._id)}
                          onChange={() => toggleSelect(p._id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 accent-seller-primary rounded shrink-0"
                        />
                        <ProductThumb images={p.images} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-slate-500">{p.category}</span>
                            {p.sku && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                SKU: {p.sku}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900">
                            ₹{(p.sellerPrice || p.price || 0).toLocaleString()}
                          </p>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 inline-flex items-center gap-1">
                            <Clock size={9} />Pending
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Batch History Tab ── */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {loadingBatches ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-seller-primary rounded-full animate-spin" />
                </div>
              ) : batches.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No batches submitted yet.</p>
                </div>
              ) : (
                batches.map(batch => <BatchCard key={batch._id} batch={batch} />)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Submit Bar */}
      <AnimatePresence>
        {activeTab === 'submit' && pendingProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-4 bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 rounded-2xl px-6 py-4">
              <div className="text-sm">
                <p className="font-bold text-slate-900">
                  {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
                <p className="text-slate-500 text-xs">Will be sent to admin for review</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedIds.size === 0}
                className="flex items-center gap-2 px-6 py-3 bg-seller-primary text-white rounded-xl font-bold text-sm hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit for Review
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default BulkProductUpload;
