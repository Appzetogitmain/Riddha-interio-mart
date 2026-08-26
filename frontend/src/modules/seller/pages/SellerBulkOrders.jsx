import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Clock, CheckCircle, Activity,
  Search, Download, Eye, X, Phone, Mail,
  CalendarDays, Package, MessageSquare, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../shared/utils/api';
import PageWrapper from '../components/PageWrapper';

// ── Helpers ───────────────────────────────────────────────────────
const statusColor = (status) => {
  if (status === 'Pending')    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (status === 'Contacted')  return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'Processing') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (status === 'Resolved')   return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

const assignmentStatusColor = (status) => {
  if (status === 'accepted') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
};

// ── Assignment response form: quote qty/price/ETA to accept, or decline ───
const AssignmentResponseCard = ({ order, myAssignment, onResponded }) => {
  const [form, setForm] = useState({ availableQuantity: '', unitPrice: '', deliveryEstimate: '', notes: '' });
  const [submitting, setSubmitting] = useState(null); // 'accepted' | 'rejected'

  const submit = async (decision) => {
    if (decision === 'accepted' && (!form.availableQuantity || !form.unitPrice || !form.deliveryEstimate)) {
      toast.error('Available quantity, unit price, and delivery estimate are required to accept.');
      return;
    }
    try {
      setSubmitting(decision);
      const res = await api.put(`/bulk-orders/${order._id}/respond`, { decision, ...form });
      toast.success(decision === 'accepted' ? 'Quote sent to admin!' : 'Request declined.');
      onResponded(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setSubmitting(null);
    }
  };

  if (myAssignment.status !== 'pending') {
    return (
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Response</p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border capitalize ${assignmentStatusColor(myAssignment.status)}`}>
            {myAssignment.status}
          </span>
        </div>
        {myAssignment.status === 'accepted' && (
          <p className="text-sm text-slate-700">
            Qty: <span className="font-bold">{myAssignment.availableQuantity}</span> · Rs. <span className="font-bold">{myAssignment.unitPrice}</span>/unit · ETA: <span className="font-bold">{myAssignment.deliveryEstimate}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Respond to this Bulk Order Request</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Available Qty</label>
          <input
            type="number"
            value={form.availableQuantity}
            onChange={(e) => setForm({ ...form, availableQuantity: e.target.value })}
            className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#189D91]"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Unit Price (Rs)</label>
          <input
            type="number"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#189D91]"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase">Delivery Estimate</label>
        <input
          type="text"
          placeholder="e.g. 5-7 business days"
          value={form.deliveryEstimate}
          onChange={(e) => setForm({ ...form, deliveryEstimate: e.target.value })}
          className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#189D91]"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase">Notes (optional)</label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full mt-0.5 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#189D91] resize-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => submit('accepted')}
          disabled={submitting !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#189D91] text-white font-bold text-xs hover:bg-[#14847a] disabled:opacity-50"
        >
          <CheckCircle size={14} /> {submitting === 'accepted' ? 'Sending...' : 'Accept & Quote'}
        </button>
        <button
          onClick={() => submit('rejected')}
          disabled={submitting !== null}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 disabled:opacity-50"
        >
          <XCircle size={14} /> {submitting === 'rejected' ? 'Sending...' : 'Decline'}
        </button>
      </div>
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

// ── Detail Drawer ─────────────────────────────────────────────────
const DetailDrawer = ({ order, onClose, onResponded }) => (
  <>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      onClick={onClose}
    />
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
            Inquiry #{order._id.slice(-6).toUpperCase()}
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Date + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <CalendarDays size={13} />
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${statusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Admin-assigned request needing a response (accept + quote, or decline) */}
        {order.myAssignment && (
          <AssignmentResponseCard order={order} myAssignment={order.myAssignment} onResponded={onResponded} />
        )}

        {/* Customer Info */}
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Information</p>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#189D91]/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-[#189D91]">
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

        {/* Your Products */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {order.myAssignment?.matchType === 'category' ? 'Requested Items' : 'Your Products in This Order'} ({order.items.length})
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
                <div className="ml-3 shrink-0 bg-[#189D91]/10 text-[#189D91] text-xs font-black px-3 py-1 rounded-lg border border-[#189D91]/20">
                  ×{item.quantity}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 rounded-xl">
            <p className="text-xs font-bold text-slate-400">Total</p>
            <p className="text-sm font-black text-white">
              {order.items.reduce((s, i) => s + (i.quantity || 0), 0)} units · {order.items.length} product{order.items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Notes */}
        {order.message && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Notes</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <p className="text-sm text-amber-900 leading-relaxed">{order.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 shrink-0">
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors">
          Close
        </button>
      </div>
    </motion.div>
  </>
);

// ── Main Page ─────────────────────────────────────────────────────
const SellerBulkOrders = () => {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/bulk-orders/seller');
      setOrders(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch bulk orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const rows = orders.map(o => ({
      'Date':          new Date(o.createdAt).toLocaleDateString('en-IN'),
      'Customer Name': o.name,
      'Phone':         o.phone,
      'Email':         o.email,
      'Your Products': o.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', '),
      'Total Units':   o.items.reduce((s, i) => s + (i.quantity || 0), 0),
      'Notes':         o.message || '',
      'Status':        o.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'My Bulk Orders');
    XLSX.writeFile(wb, `My_Bulk_Orders_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
  };

  // The /respond response has the full bulk order but assignments[].seller isn't populated
  // here (this seller already knows it's their own row) — re-locate "my" assignment by its
  // stable _id so the accepted/rejected status and quote persist in local state.
  const mergeMyAssignment = (updatedOrder, prevOrder) => {
    const myAssignment = updatedOrder.assignments?.find(a => String(a._id) === String(prevOrder?.myAssignment?._id));
    return { ...updatedOrder, myAssignment: myAssignment || prevOrder?.myAssignment || null };
  };

  const handleResponded = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? mergeMyAssignment(updatedOrder, o) : o));
    setSelectedOrder(prev => prev && prev._id === updatedOrder._id ? mergeMyAssignment(updatedOrder, prev) : prev);
  };

  const filtered = orders.filter(o =>
    o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.items?.some(i => i.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pending   = orders.filter(o => o.status === 'Pending').length;
  const contacted = orders.filter(o => o.status === 'Contacted').length;
  const resolved  = orders.filter(o => o.status === 'Resolved').length;

  return (
    <PageWrapper>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bulk Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Customers who enquired about your products in bulk.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ShoppingBag}  label="Total Inquiries" value={orders.length} color="bg-teal-50 text-[#189D91]"      />
          <StatCard icon={Clock}        label="Pending"         value={pending}       color="bg-amber-50 text-amber-600"      />
          <StatCard icon={Activity}     label="Contacted"       value={contacted}     color="bg-blue-50 text-blue-600"        />
          <StatCard icon={CheckCircle}  label="Resolved"        value={resolved}      color="bg-emerald-50 text-emerald-600"  />
        </div>

        {/* Search + Export */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, product…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#189D91] transition-colors"
            />
          </div>
          <button
            onClick={exportToExcel}
            disabled={orders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#189D91] text-white rounded-xl font-bold text-sm hover:bg-[#14847a] transition-colors shadow-sm disabled:opacity-40"
          >
            <Download size={15} /> Export Excel
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#189D91] rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <ShoppingBag size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-600">No bulk inquiries yet</p>
            <p className="text-sm text-slate-400 mt-1">When customers place bulk orders for your products, they'll appear here.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Your Products</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 text-sm">{order.name}</p>
                      <p className="text-[11px] text-slate-400">{order.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{order.phone}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 max-w-[200px]">
                        {order.items.slice(0, 3).map((item, i) => (
                          <p key={i} className="text-[11px] text-slate-600 leading-tight">
                            • {item.name} <span className="text-slate-400">×{item.quantity}</span>
                          </p>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-[10px] text-slate-400 font-bold">+{order.items.length - 3} more</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-700 text-sm">
                        {order.items.reduce((s, i) => s + (i.quantity || 0), 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.myAssignment?.status === 'pending' && (
                        <span className="block mt-1 text-[10px] font-bold text-amber-600 animate-pulse">
                          Action needed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-[#189D91] hover:bg-teal-50 rounded-lg transition-colors"
                        title="View full details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <DetailDrawer
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onResponded={handleResponded}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default SellerBulkOrders;
