import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LuArrowLeft,
  LuPackage,
  LuTruck,
  LuClock,
  LuPrinter,
  LuDownload,
  LuMapPin,
  LuPhone,
  LuUser,
  LuCalendar,
  LuCreditCard,
  LuCheck,
  LuX,
  LuRefreshCw,
} from 'react-icons/lu';
import { FiCheckCircle, FiBox } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const statusConfig = {
  Pending:    { color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Processing: { color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Packed:     { color: 'bg-violet-50 text-violet-700 border-violet-200' },
  Shipped:    { color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  Delivered:  { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Cancelled:  { color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const STATUS_ACTIONS = {
  Pending:    [{ label: 'Accept Order',    next: 'Processing', style: 'bg-seller-primary text-white hover:opacity-90' },
               { label: 'Cancel Order',    next: 'Cancelled',  style: 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50' }],
  Processing: [{ label: 'Mark as Packed',  next: 'Packed',     style: 'bg-seller-primary text-white hover:opacity-90' }],
  Packed:     [{ label: 'Mark as Shipped', next: 'Shipped',    style: 'bg-seller-primary text-white hover:opacity-90' }],
  Shipped:    [{ label: 'Mark Delivered',  next: 'Delivered',  style: 'bg-emerald-600 text-white hover:bg-emerald-700' }],
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      if (data.success) setOrder(data.data);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrderDetail(); }, [id]);

  const handleStatusUpdate = async (nextStatus) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { status: nextStatus });
      await fetchOrderDetail();
      toast.success(`Order marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = () => window.print();

  const handleDownloadLabel = () => {
    if (!order) return;
    const addr = order.shippingAddress || {};
    const lines = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '          SHIPPING LABEL',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `TO:`,
      `  ${addr.fullName || 'N/A'}`,
      `  ${addr.address || ''}`,
      `  ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`,
      `  Phone: ${addr.phone || 'N/A'}`,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Order #: ${order._id.slice(-8).toUpperCase()}`,
      `Items  : ${order.orderItems?.length || 1}`,
      `Total  : ₹${order.totalPrice?.toLocaleString()}`,
      `Payment: ${order.paymentMethod} (${order.isPaid ? 'Paid' : 'COD'})`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'FROM: Riddha Interio Mart',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label-${order._id.slice(-8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Label downloaded');
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-seller-primary rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading…</p>
        </div>
      </PageWrapper>
    );
  }

  if (!order) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Order not found</p>
          <button onClick={() => navigate('/seller/orders')} className="mt-3 text-seller-primary font-black text-xs underline uppercase">
            Return to Orders
          </button>
        </div>
      </PageWrapper>
    );
  }

  const steps = [
    { label: 'Placed',     status: 'Pending',    icon: FiBox,         date: order.createdAt },
    { label: 'Processing', status: 'Processing', icon: LuClock,       date: order.processingAt },
    { label: 'Packed',     status: 'Packed',     icon: LuPackage,     date: order.packedAt },
    { label: 'Shipped',    status: 'Shipped',    icon: LuTruck,       date: order.shippedAt },
    { label: 'Delivered',  status: 'Delivered',  icon: FiCheckCircle, date: order.deliveredAt },
  ];

  const statusOrder = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIdx = statusOrder.indexOf(order.status);
  const addr = order.shippingAddress || {};
  const actions = STATUS_ACTIONS[order.status] || [];
  const cfg = statusConfig[order.status] || statusConfig.Pending;

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto pb-10 space-y-4">

        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => navigate('/seller/orders')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-all">
              <LuArrowLeft size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Orders</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <LuPrinter size={13} /> Print Invoice
            </button>
            <button
              onClick={handleDownloadLabel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <LuDownload size={13} /> Download Label
            </button>
          </div>
        </div>

        {/* Page grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT: products + stepper */}
          <div className="lg:col-span-2 space-y-4">

            {/* Order header */}
            <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order ID</p>
                  <h2 className="text-sm font-black text-slate-900 mt-0.5">#{order._id.slice(-8).toUpperCase()}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.color}`}>
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><LuCalendar size={9} /> Date</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{fmt(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><LuUser size={9} /> Customer</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{addr.fullName || 'Guest'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><LuCreditCard size={9} /> Payment</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5 capitalize">{order.paymentMethod}</p>
                  <span className={`text-[9px] font-black uppercase ${order.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">₹{order.totalPrice?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-50">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                  Items ({order.orderItems?.length || 0})
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-black text-slate-800 shrink-0">₹{item.price?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Order Total</span>
                <span className="text-sm font-black text-slate-900">₹{order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>

            {/* Stepper */}
            <div className="bg-white rounded-2xl border border-slate-100 px-5 py-5">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-5">Order Progress</p>
              <div className="relative">
                {/* horizontal line */}
                <div className="hidden sm:block absolute top-4 left-4 right-4 h-0.5 bg-slate-100 -z-0">
                  <div
                    className="h-full bg-seller-primary transition-all duration-700"
                    style={{ width: currentStepIdx >= 0 ? `${(currentStepIdx / (steps.length - 1)) * 100}%` : '0%' }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-between relative z-10 gap-4 sm:gap-0">
                  {steps.map((step, idx) => {
                    const done = idx <= currentStepIdx && currentStepIdx >= 0;
                    const StepIcon = step.icon;
                    return (
                      <div key={idx} className="flex sm:flex-col items-center gap-3 sm:gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 ${
                          done ? 'bg-seller-primary border-seller-primary text-white' : 'bg-white border-slate-200 text-slate-300'
                        }`}>
                          <StepIcon size={14} />
                        </div>
                        <div className="text-left sm:text-center">
                          <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${done ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                            {step.date ? fmt(step.date) : '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: info cards */}
          <div className="space-y-4">

            {/* Status actions */}
            {actions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Update Status</p>
                <div className="space-y-2">
                  {actions.map((action) => (
                    <button
                      key={action.next}
                      disabled={updating}
                      onClick={() => handleStatusUpdate(action.next)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${action.style} disabled:opacity-50`}
                    >
                      {updating ? <LuRefreshCw size={13} className="animate-spin" /> : <LuCheck size={13} />}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping address */}
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <LuMapPin size={12} className="text-seller-primary" /> Shipping Address
              </p>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800">{addr.fullName || '—'}</p>
                <p className="font-semibold">{addr.address || '—'}</p>
                <p className="font-semibold">{[addr.city, addr.state].filter(Boolean).join(', ')}{addr.pincode ? ` - ${addr.pincode}` : ''}</p>
                {addr.phone && (
                  <p className="flex items-center gap-1 font-semibold text-slate-500">
                    <LuPhone size={10} /> {addr.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Payment summary */}
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Payment Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Subtotal</span>
                  <span className="font-bold text-slate-700">₹{(order.itemsPrice ?? order.totalPrice)?.toLocaleString()}</span>
                </div>
                {order.shippingPrice != null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Shipping</span>
                    <span className="font-bold text-slate-700">₹{order.shippingPrice?.toLocaleString()}</span>
                  </div>
                )}
                {order.taxPrice != null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Tax</span>
                    <span className="font-bold text-slate-700">₹{order.taxPrice?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-black text-slate-800">Total</span>
                  <span className="font-black text-slate-900">₹{order.totalPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Method</span>
                  <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${order.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {order.paymentMethod} · {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Quick Actions</p>
              <div className="space-y-2">
                <button
                  onClick={handlePrintInvoice}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <LuPrinter size={13} className="text-slate-400" /> Print Invoice
                </button>
                <button
                  onClick={handleDownloadLabel}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <LuDownload size={13} className="text-slate-400" /> Download Shipping Label
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default OrderDetail;
