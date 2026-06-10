import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiCheck, FiArrowRight, FiShoppingBag, FiAlertCircle,
  FiCopy, FiCheckCircle, FiPackage, FiCreditCard
} from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [noOrder, setNoOrder] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        let ids = [];
        const saved = localStorage.getItem('last_order_ids');
        if (saved) ids = JSON.parse(saved);
        else { const old = localStorage.getItem('last_order_id'); if (old) ids = [old]; }

        if (!ids.length) { setNoOrder(true); setLoading(false); return; }

        const fetched = await Promise.all(
          ids.map(id => api.get(`/orders/${id}`).then(r => r.data?.data || null).catch(() => null))
        );
        const valid = fetched.filter(Boolean);
        if (!valid.length) setNoOrder(true);
        else setOrders(valid);
      } catch { setNoOrder(true); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExit = (path) => {
    localStorage.removeItem('last_order_ids');
    localStorage.removeItem('last_order_id');
    navigate(path);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-[3px] border-[#189D91] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Verifying transaction…</p>
    </div>
  );

  if (noOrder) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 text-amber-400">
        <FiAlertCircle size={28} />
      </div>
      <h2 className="text-base font-bold text-gray-800 mb-1">No Order Found</h2>
      <p className="text-xs text-gray-400 mb-6 max-w-xs leading-relaxed">This page was accessed directly or your session expired.</p>
      <button onClick={() => navigate('/products')}
        className="px-8 py-2.5 bg-[#189D91] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#14847a] transition-colors">
        Browse Products
      </button>
    </div>
  );

  const totalAmount = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const first = orders[0] || {};
  const paymentMethod = first.paymentMethod || 'Online';
  const isAllPaid = orders.every(o => o.isPaid || o.paymentStatus === 'paid');
  const statusLabel = isAllPaid ? 'Paid & Captured' : paymentMethod === 'COD' ? 'COD Pending' : 'Pending';
  const orderDate = first.createdAt
    ? new Date(first.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : '—';

  const timelineSteps = [
    { label: 'Order Placed',      desc: `Confirmed on ${orderDate}`,                              done: true,   pulse: false },
    { label: 'Payment Verified',  desc: paymentMethod === 'COD' ? 'Payment on delivery confirmed.' : 'Captured via payment gateway.', done: isAllPaid || paymentMethod === 'COD', pulse: false },
    { label: 'Seller Processing', desc: 'Items being packed for dispatch.',                        done: true,   pulse: true  },
    { label: 'Out for Delivery',  desc: 'Courier dispatched to your location.',                    done: false,  pulse: false },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-8">

      {/* ── Success header ── */}
      <div className="bg-[#189D91] pt-10 pb-8 px-4 text-center text-white">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-14 h-14 bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-4"
        >
          <FiCheck size={28} className="text-white stroke-[3]" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h1 className="text-xl font-black uppercase tracking-wider mb-1">
            {orders.length > 1 ? 'Orders Confirmed!' : 'Order Confirmed!'}
          </h1>
          <p className="text-[12px] text-white/70 font-medium max-w-xs mx-auto leading-relaxed">
            Payment processed. Your items are being prepared for dispatch.
          </p>
        </motion.div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-3">

        {/* ── Transaction summary ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-gray-100">

          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction Summary</p>
          </div>

          <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-50">
            <MetaCell label="Date" value={orderDate} />
            <MetaCell label="Amount" value={`₹${totalAmount.toLocaleString('en-IN')}`} bold />
            <MetaCell label="Payment" value={paymentMethod.toUpperCase()} />
            <MetaCell label="Status">
              <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-wide border ${
                isAllPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {statusLabel}
              </span>
            </MetaCell>
          </div>
        </motion.div>

        {/* ── Order references ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white border border-gray-100">

          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Order References ({orders.length})
            </p>
          </div>

          <div className="divide-y divide-gray-50">
            {orders.map((order, idx) => (
              <div key={order._id} className="px-4 py-3 flex items-center gap-3">
                <span className="w-6 h-6 bg-[#189D91]/10 text-[#189D91] text-[11px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-black text-gray-800 font-mono">
                      #{order._id?.slice(-10).toUpperCase()}
                    </span>
                    <button onClick={() => handleCopy(order._id)}
                      className="p-0.5 text-gray-300 hover:text-[#189D91] transition-colors shrink-0">
                      {copiedId === order._id
                        ? <FiCheckCircle size={12} className="text-emerald-500" />
                        : <FiCopy size={12} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {order.orderItems?.length || 0} item{order.orderItems?.length !== 1 ? 's' : ''} · {order.seller?.shopName || 'Riddha Seller'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-black text-gray-900">₹{order.totalPrice?.toLocaleString('en-IN')}</p>
                  <p className="text-[9px] font-black text-[#189D91] uppercase tracking-wide mt-0.5">
                    {order.status || 'Processing'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Timeline ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white border border-gray-100">

          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Timeline</p>
          </div>

          <div className="px-4 py-4 relative">
            <div className="absolute left-[27px] top-6 bottom-6 w-px bg-gray-100" />
            <div className="space-y-5">
              {timelineSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className={`w-7 h-7 shrink-0 flex items-center justify-center border-2 border-white relative z-10 ${
                    step.done ? 'bg-[#189D91]' : 'bg-gray-100'
                  } ${step.pulse ? 'ring-4 ring-[#189D91]/20' : ''}`}>
                    {step.done
                      ? <FiCheck size={12} className="text-white stroke-[3]" />
                      : <span className="w-2 h-2 bg-gray-300" />
                    }
                  </div>
                  <div className={`flex-1 pt-0.5 ${!step.done ? 'opacity-45' : ''}`}>
                    <p className="text-[12px] font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                      {step.label}
                      {step.pulse && <span className="w-1.5 h-1.5 bg-[#189D91] rounded-full animate-ping inline-block" />}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Dispatch info ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-white border border-gray-100 flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 bg-[#189D91]/10 flex items-center justify-center text-[#189D91] shrink-0">
            <FiPackage size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Estimated Dispatch</p>
            <p className="text-[12px] font-bold text-gray-800">Within 24–48 hours</p>
          </div>
        </motion.div>

        {/* ── Action buttons ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="space-y-2 pt-1">
          <button onClick={() => handleExit('/')}
            className="w-full h-12 bg-[#189D91] hover:bg-[#14847a] text-white font-black text-[12px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
            Continue Shopping <FiArrowRight size={15} />
          </button>
          <button onClick={() => handleExit('/orders')}
            className="w-full h-10 bg-white border border-gray-200 text-gray-600 hover:border-gray-400 font-bold text-[11px] uppercase tracking-wider transition-colors">
            View My Orders
          </button>
        </motion.div>

      </div>
    </div>
  );
};

/* ── tiny helper ── */
const MetaCell = ({ label, value, bold = false, children }) => (
  <div className="px-4 py-3">
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    {children ?? <p className={`text-[12px] ${bold ? 'font-black text-gray-900' : 'font-semibold text-gray-700'} leading-snug`}>{value}</p>}
  </div>
);

export default OrderSuccessPage;
