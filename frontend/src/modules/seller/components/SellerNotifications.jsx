import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, XCircle, ArrowRight, ShoppingBag, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../../../shared/utils/socket';
import { playSellerBatchSound, playBulkOrderSound } from '../../../shared/utils/notificationSound';

// ── Batch product reviewed popup (existing) ──────────────────────
const BatchReviewedPopup = ({ notification, onDismiss }) => {
  const navigate  = useNavigate();
  const isApproved = notification.action === 'approved';

  return (
    <motion.div
      key={notification.productId + notification.action}
      initial={{ opacity: 0, scale: 0.82, y: 56, x: '-50%' }}
      animate={{ opacity: 1, scale: 1,    y: 0,  x: '-50%' }}
      exit={{   opacity: 0, scale: 0.82, y: 28,  x: '-50%' }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="fixed bottom-10 left-1/2 z-[9999] w-[92%] max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.28)] border border-slate-100 p-6 flex items-start gap-4 overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-3xl ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {isApproved
          ? <Check size={28} strokeWidth={3} className="animate-bounce" />
          : <XCircle size={28} className="animate-bounce" />}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {isApproved ? '✓ Product Approved' : '✕ Product Rejected'}
          </h3>
          <button onClick={onDismiss} className="p-1 -mt-0.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 shrink-0">
            <X size={16} />
          </button>
        </div>

        <p className="text-lg font-bold text-slate-900 leading-snug truncate">
          {notification.productName}
        </p>

        {isApproved ? (
          <p className="text-xs text-emerald-700 font-semibold">Now live on the store!</p>
        ) : (
          notification.rejectionReason && (
            <p className="text-xs text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 leading-snug">
              Reason: {notification.rejectionReason}
            </p>
          )
        )}

        <div className="pt-3 flex gap-2.5">
          <button
            onClick={() => { navigate('/seller/bulk-upload?tab=history'); onDismiss(); }}
            className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              isApproved ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            View Batch History <ArrowRight size={13} />
          </button>
          <button onClick={onDismiss} className="px-5 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── New bulk order inquiry popup ─────────────────────────────────
const BulkOrderPopup = ({ notification, onDismiss }) => {
  const navigate = useNavigate();
  const items    = notification.items || [];

  return (
    <motion.div
      key={'bulk_' + notification.orderId}
      initial={{ opacity: 0, scale: 0.82, y: 56, x: '-50%' }}
      animate={{ opacity: 1, scale: 1,    y: 0,  x: '-50%' }}
      exit={{   opacity: 0, scale: 0.82, y: 28,  x: '-50%' }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="fixed bottom-10 left-1/2 z-[9999] w-[92%] max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.28)] border border-slate-100 p-6 flex items-start gap-4 overflow-hidden"
    >
      {/* Teal top bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-3xl bg-[#189D91]" />

      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-teal-50 text-[#189D91]">
        <ShoppingBag size={28} className="animate-bounce" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            🛒 New Bulk Order Inquiry
          </h3>
          <button onClick={onDismiss} className="p-1 -mt-0.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Customer name */}
        <p className="text-lg font-bold text-slate-900 leading-snug">
          {notification.customerName}
        </p>

        {/* Contact row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Phone size={11} className="text-[#189D91]" />
            {notification.customerPhone}
          </span>
          {notification.customerEmail && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Mail size={11} className="text-[#189D91]" />
              <span className="truncate max-w-[140px]">{notification.customerEmail}</span>
            </span>
          )}
        </div>

        {/* Products list */}
        {items.length > 0 && (
          <div className="bg-teal-50/60 rounded-xl px-3 py-2 space-y-1 border border-teal-100">
            {items.slice(0, 4).map((item, i) => (
              <p key={i} className="text-[11px] font-semibold text-slate-700 leading-tight">
                • {item.name}
                <span className="text-teal-700 font-bold ml-1">×{item.quantity}</span>
              </p>
            ))}
            {items.length > 4 && (
              <p className="text-[10px] text-slate-400 font-bold">+{items.length - 4} more product{items.length - 4 !== 1 ? 's' : ''}</p>
            )}
          </div>
        )}

        {/* Notes */}
        {notification.message && (
          <p className="text-xs text-slate-500 italic leading-snug line-clamp-2">
            "{notification.message}"
          </p>
        )}

        {/* Actions */}
        <div className="pt-1 flex gap-2.5">
          <button
            onClick={() => { navigate('/seller/orders'); onDismiss(); }}
            className="flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center gap-1.5 bg-[#189D91] text-white hover:bg-[#14847a] transition-all"
          >
            View Orders <ArrowRight size={13} />
          </button>
          <button
            onClick={onDismiss}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main component ───────────────────────────────────────────────
const SellerNotifications = ({ token }) => {
  // Each entry: { type: 'batch_reviewed' | 'bulk_order', data: payload }
  const [queue, setQueue]   = useState([]);
  const current             = queue[0] || null;

  const dismiss = useCallback(() => {
    setQueue(q => q.slice(1));
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket({ token });

    const onBatchReviewed = (payload) => {
      playSellerBatchSound(payload.action);
      setQueue(q => [...q, { type: 'batch_reviewed', data: payload }]);
    };

    const onBulkOrder = (payload) => {
      playBulkOrderSound();
      setQueue(q => [...q, { type: 'bulk_order', data: payload }]);
    };

    socket.on('batch:product_reviewed', onBatchReviewed);
    socket.on('bulk_order:new',         onBulkOrder);

    return () => {
      socket.off('batch:product_reviewed', onBatchReviewed);
      socket.off('bulk_order:new',         onBulkOrder);
    };
  }, [token]);

  // Auto-dismiss after 9 seconds
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismiss, 9000);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  return (
    <AnimatePresence>
      {current && (
        current.type === 'batch_reviewed'
          ? <BatchReviewedPopup key="br" notification={current.data} onDismiss={dismiss} />
          : <BulkOrderPopup     key="bo" notification={current.data} onDismiss={dismiss} />
      )}
    </AnimatePresence>
  );
};

export default SellerNotifications;
