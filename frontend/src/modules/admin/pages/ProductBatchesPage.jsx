import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Clock, CheckCircle2, Activity, RefreshCw,
  Users, Search, Download, Trash2, Store,
  Eye, X as XIcon, Phone, Mail, CalendarDays, MessageSquare, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../shared/utils/api';
import PageWrapper from '../components/PageWrapper';
import BatchReviewDrawer from './BatchReviewDrawer';

// ── Status meta ──────────────────────────────────────────────────
const batchStatusMeta = {
  pending_review: {
    label: 'Pending Review',
    cardBorder: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  in_progress: {
    label: 'In Progress',
    cardBorder: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  completed: {
    label: 'Completed',
    cardBorder: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

const customerStatusColor = (status) => {
  if (status === 'Pending')    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (status === 'Contacted')  return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'Processing') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (status === 'Resolved')   return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

// ── Shared sub-components ─────────────────────────────────────────
const SellerAvatar = ({ seller }) => {
  const initials = (seller?.shopName || seller?.fullName || 'S')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (seller?.avatar) {
    return <img src={seller.avatar} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200" />;
  }
  return (
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0">
      <span className="text-white text-sm font-black">{initials}</span>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

// ── Batch Card (Seller) ──────────────────────────────────────────
const BatchCard = ({ batch, onReview, isLoading }) => {
  const meta = batchStatusMeta[batch.status] || batchStatusMeta.pending_review;
  const seller = batch.seller || {};
  const reviewed = batch.approvedCount + batch.rejectedCount;
  const pct = batch.totalProducts > 0 ? Math.round((reviewed / batch.totalProducts) * 100) : 0;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(batch.submittedAt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${meta.cardBorder}`}
    >
      <div className={`h-1 w-full ${meta.dot}`} />
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <SellerAvatar seller={seller} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">
              {seller.shopName || seller.fullName || 'Unknown Seller'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{seller.fullName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${meta.badge}`}>
            {meta.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Total',    value: batch.totalProducts,  color: 'text-slate-700',  bg: 'bg-slate-50'  },
            { label: 'Approved', value: batch.approvedCount,  color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Rejected', value: batch.rejectedCount,  color: 'text-red-600',    bg: 'bg-red-50'    },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-xl py-2 px-1`}>
              <p className={`text-lg font-black ${c.color}`}>{c.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
            <span>{reviewed} reviewed</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <button
          onClick={() => batch.status !== 'completed' && onReview(batch)}
          disabled={batch.status === 'completed' || isLoading}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            batch.status === 'completed'
              ? 'bg-slate-100 text-slate-400 cursor-default'
              : isLoading
                ? 'bg-violet-400 text-white cursor-wait'
                : 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20 active:scale-95'
          }`}
        >
          {batch.status === 'completed' ? (
            <><CheckCircle2 size={16} /> Completed</>
          ) : isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Loading…</>
          ) : (
            <>Review Batch</>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════
// Seller Bulk Order Tab
// ════════════════════════════════════════════════════════════════
const SellerBulkOrderTab = () => {
  const [batches, setBatches]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeBatch, setActiveBatch]   = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const res = await api.get('/product-batches', { params });
      setBatches(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const handleOpenDrawer = async (batch) => {
    setDrawerLoading(true);
    try {
      const res = await api.get(`/product-batches/${batch._id}`);
      setActiveBatch(res.data.data);
    } catch {
      setActiveBatch(batch);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleBatchUpdate = (updated) => {
    setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
  };

  const total        = batches.length;
  const pendingCount = batches.filter(b => b.status === 'pending_review').length;
  const inProgress   = batches.filter(b => b.status === 'in_progress').length;
  const completed    = batches.filter(b => b.status === 'completed').length;

  const filterOptions = [
    { value: 'all',            label: 'All Batches'    },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'in_progress',    label: 'In Progress'    },
    { value: 'completed',      label: 'Completed'      },
  ];

  const displayed = filterStatus === 'all' ? batches : batches.filter(b => b.status === filterStatus);

  return (
    <>
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Layers}       label="Total Batches"  value={total}        color="bg-violet-50 text-violet-600"  />
          <StatCard icon={Clock}        label="Pending Review" value={pendingCount} color="bg-amber-50 text-amber-600"    />
          <StatCard icon={Activity}     label="In Progress"    value={inProgress}   color="bg-blue-50 text-blue-600"      />
          <StatCard icon={CheckCircle2} label="Completed"      value={completed}    color="bg-emerald-50 text-emerald-600"/>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
          {filterOptions.map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filterStatus === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading batches…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Layers size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-600">No batches found</p>
            <p className="text-sm text-slate-400 mt-1">Batches appear here when sellers submit products for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayed.map((batch, i) => (
              <motion.div key={batch._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <BatchCard batch={batch} onReview={handleOpenDrawer} onUpdate={handleBatchUpdate} isLoading={drawerLoading} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeBatch && (
          <BatchReviewDrawer
            batch={activeBatch}
            onClose={() => setActiveBatch(null)}
            onBatchUpdate={handleBatchUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ── Bulk Order Detail Drawer ─────────────────────────────────────
const BulkOrderDetailDrawer = ({ order, onClose, onStatusChange, updatingId }) => {
  const statusColor = customerStatusColor(order.status);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">Order Details</h2>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
              Bulk Inquiry #{order._id.slice(-6).toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Status + Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
              <CalendarDays size={13} />
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <select
              value={order.status}
              disabled={updatingId === order._id}
              onChange={e => onStatusChange(order._id, e.target.value)}
              className={`text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer transition-colors ${statusColor}`}
            >
              <option value="Pending">Pending</option>
              <option value="Contacted">Contacted</option>
              <option value="Processing">Processing</option>
              <option value="Resolved">Resolved</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Information</p>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-violet-700">
                    {order.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{order.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Full Name</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{order.phone}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Phone Number</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail size={13} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 break-all">{order.email}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Email Address</p>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Products Ordered ({order.items.length})
              </p>
            </div>

            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    {item.category && (
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.category}</p>
                    )}
                  </div>
                  <div className="ml-3 shrink-0 bg-violet-50 text-violet-700 text-xs font-black px-3 py-1 rounded-lg border border-violet-100">
                    ×{item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 rounded-xl">
              <p className="text-xs font-bold text-slate-400">Total Items</p>
              <p className="text-sm font-black text-white">
                {order.items.reduce((s, i) => s + (i.quantity || 0), 0)} units across {order.items.length} product{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Notes */}
          {order.message && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes / Special Requirements</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                <p className="text-sm text-amber-900 leading-relaxed">{order.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </>
  );
};

// ════════════════════════════════════════════════════════════════
// Customer Bulk Order Tab
// ════════════════════════════════════════════════════════════════
const CustomerBulkOrderTab = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/bulk-orders');
      setOrders(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch bulk orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await api.put(`/bulk-orders/${id}`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
      // keep drawer in sync if open
      setSelectedOrder(prev => prev?._id === id ? { ...prev, status: newStatus } : prev);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (id, name) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-left">
        <p className="text-sm font-bold text-gray-800">Delete inquiry from "{name}"?</p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                setDeletingId(id);
                await api.delete(`/bulk-orders/${id}`);
                setOrders(prev => prev.filter(o => o._id !== id));
                toast.success('Bulk order inquiry deleted.');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to delete inquiry.');
              } finally {
                setDeletingId(null);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const dataToExport = orders.map(order => ({
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Customer Name': order.name,
      'Phone Number': order.phone,
      'Email Address': order.email,
      'Products': order.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', '),
      'Message': order.message,
      'Status': order.status,
    }));
    const XLSX_lib = XLSX;
    const ws = XLSX_lib.utils.json_to_sheet(dataToExport);
    const wb = XLSX_lib.utils.book_new();
    XLSX_lib.utils.book_append_sheet(wb, ws, 'Customer Bulk Orders');
    XLSX_lib.writeFile(wb, `Customer_Bulk_Orders_${new Date().toLocaleDateString()}.xlsx`);
  };

  const filtered = orders.filter(o =>
    o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pending   = orders.filter(o => o.status === 'Pending').length;
  const contacted = orders.filter(o => o.status === 'Contacted').length;
  const resolved  = orders.filter(o => o.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Inquiries" value={orders.length} color="bg-violet-50 text-violet-600"  />
        <StatCard icon={Clock}        label="Pending"         value={pending}       color="bg-amber-50 text-amber-600"    />
        <StatCard icon={Activity}     label="Contacted"       value={contacted}     color="bg-blue-50 text-blue-600"      />
        <StatCard icon={CheckCircle2} label="Resolved"        value={resolved}      color="bg-emerald-50 text-emerald-600"/>
      </div>

      {/* Search + Export */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-violet-400 transition-colors"
          />
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors shadow-sm"
        >
          <Download size={15} /> Export Excel
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading inquiries…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-600">No inquiries found</p>
          <p className="text-sm text-slate-400 mt-1">Customer bulk order inquiries will appear here.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
          <table className="w-full text-sm text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{order.name}</td>
                  <td className="px-4 py-3 text-slate-600">{order.phone}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{order.email}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-[220px] space-y-0.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="text-[11px] text-slate-600 leading-tight">
                          • {item.name} <span className="text-slate-400">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-500 text-xs max-w-[140px] truncate" title={order.message}>
                      {order.message || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={e => handleStatusChange(order._id, e.target.value)}
                      className={`text-xs font-bold rounded-lg px-2 py-1 outline-none border cursor-pointer transition-colors ${customerStatusColor(order.status)}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Processing">Processing</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(order._id, order.name)}
                        disabled={deletingId === order._id}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <BulkOrderDetailDrawer
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════
const TABS = [
  { key: 'seller',   label: 'Seller Bulk Order',   icon: Store },
  { key: 'customer', label: 'Customer Bulk Order',  icon: Users },
];

const ProductBatchesPage = () => {
  const [activeTab, setActiveTab] = useState('seller');

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Bulk Orders</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {activeTab === 'seller'
                ? 'Review seller product submissions batch by batch.'
                : 'Manage bulk order inquiries from customers.'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'seller'
              ? <SellerBulkOrderTab />
              : <CustomerBulkOrderTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default ProductBatchesPage;
