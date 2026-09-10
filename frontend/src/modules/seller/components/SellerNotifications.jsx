import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, XCircle, ArrowRight, ShoppingBag, Phone, Mail,
  MapPin, User, Bell, Minus, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../../../shared/utils/socket';
import { playSellerBatchSound, playBulkOrderSound, playNotificationSound } from '../../../shared/utils/notificationSound';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

// How often the ring repeats while a new order awaits a response (the underlying
// clip is a self-contained ~2.0s Web Audio sequence with no native loop option).
const SOUND_LOOP_MS = 2200;
// Stop ringing after this long if the seller is simply away — the order/badge
// stays until they actually act, only the sound gives up.
const SOUND_SAFETY_CAP_MS = 5 * 60 * 1000;

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

// ── New order modal: full details + Accept/Reject, non-auto-dismissing ──
const NewOrderModal = ({ notification, extraCount, responding, resolvedAs, onMinimize, onRespond }) => {
  const addr  = notification.shippingAddress || {};
  const items = notification.orderItems || [];

  return (
    <motion.div
      key={'order_' + notification.orderId}
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1,   y: 0 }}
      exit={{   opacity: 0, scale: 0.9,  y: 20 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-lg bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col"
    >
      <div className="h-1.5 shrink-0 bg-[#E36666]" />

      <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-red-50 text-[#E36666]">
              <ShoppingBag size={24} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                📦 New Order Received
              </h3>
              <p className="text-[10px] font-bold text-slate-400">#{notification.orderId?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onMinimize}
            title="Minimize"
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 shrink-0"
          >
            <Minus size={16} />
          </button>
        </div>

        {resolvedAs ? (
          <div className={`py-8 flex flex-col items-center gap-2 ${resolvedAs === 'Accepted' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {resolvedAs === 'Accepted' ? <Check size={40} strokeWidth={3} /> : <XCircle size={40} />}
            <p className="text-lg font-black">Order {resolvedAs}</p>
          </div>
        ) : (
          <>
            {/* Customer */}
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400" />
              <p className="text-base font-bold text-slate-900">{notification.customerName || 'Customer'}</p>
              {addr.mobileNumber && (
                <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold ml-1">
                  <Phone size={11} className="text-[#189D91]" /> {addr.mobileNumber}
                </span>
              )}
            </div>

            {/* Address */}
            {(addr.fullAddress || addr.city) && (
              <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <MapPin size={14} className="text-[#189D91] mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 font-medium leading-snug">
                  {addr.fullAddress}{addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city} {addr.pincode}
                </p>
              </div>
            )}

            {/* Products */}
            {items.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {items.length} Product{items.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0" />
                      )}
                      <p className="text-xs font-semibold text-slate-700 leading-tight flex-1 truncate">
                        {item.name} <span className="text-slate-400 font-bold">×{item.quantity}</span>
                      </p>
                      <p className="text-xs font-bold text-slate-500 shrink-0">₹{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
              <span className="text-lg font-black text-slate-900">₹{notification.totalPrice}</span>
            </div>

            {extraCount > 0 && (
              <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                +{extraCount} more new order{extraCount !== 1 ? 's' : ''} waiting — respond to this one first.
              </p>
            )}
          </>
        )}
      </div>

      {!resolvedAs && (
        <div className="p-5 pt-0 flex gap-2.5 shrink-0">
          <button
            disabled={!!responding}
            onClick={() => onRespond('Rejected')}
            className="flex-1 text-[11px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
          >
            {responding === 'Rejected' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
          </button>
          <button
            disabled={!!responding}
            onClick={() => onRespond('Accepted')}
            className="flex-1 text-[11px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-1.5 bg-[#189D91] text-white hover:bg-[#14847a] transition-all disabled:opacity-50"
          >
            {responding === 'Accepted' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Accept
          </button>
        </div>
      )}
    </motion.div>
  );
};

// ── Minimized badge for a pending order response ──────────────────
const PendingOrderBadge = ({ count, onExpand }) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    onClick={onExpand}
    className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 bg-[#E36666] text-white pl-3 pr-4 py-2.5 rounded-full shadow-[0_10px_30px_-8px_rgba(227,102,102,0.6)] hover:bg-[#c95353] transition-all"
  >
    <span className="relative flex items-center justify-center">
      <Bell size={16} />
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
    </span>
    <span className="text-[11px] font-black uppercase tracking-wide">
      Order{count > 1 ? `s (${count})` : ''} Awaiting Response
    </span>
  </motion.button>
);

// ── Main component ───────────────────────────────────────────────
const SellerNotifications = ({ token }) => {
  // Each entry: { type: 'batch_reviewed' | 'bulk_order', data: payload } — new-order
  // payloads get their own dedicated queue below since they must never be silently
  // pushed out by this queue's auto-dismiss/FIFO advancement.
  const [queue, setQueue]   = useState([]);
  const current             = queue[0] || null;

  // Dedicated new-order queue: non-auto-dismissing, sound loops until Accept/Reject.
  const [orderQueue, setOrderQueue]   = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [responding, setResponding]   = useState(null); // 'Accepted' | 'Rejected' | null
  const [resolvedAs, setResolvedAs]   = useState(null);
  const pendingOrder = orderQueue[0] || null;

  const soundIntervalRef      = useRef(null);
  const soundSafetyTimeoutRef = useRef(null);

  const dismiss = useCallback(() => {
    setQueue(q => q.slice(1));
  }, []);

  const stopSoundLoop = useCallback(() => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    if (soundSafetyTimeoutRef.current) {
      clearTimeout(soundSafetyTimeoutRef.current);
      soundSafetyTimeoutRef.current = null;
    }
  }, []);

  const startSoundLoop = useCallback(() => {
    if (soundIntervalRef.current) return; // already looping
    playNotificationSound();
    soundIntervalRef.current = setInterval(() => playNotificationSound(), SOUND_LOOP_MS);
    soundSafetyTimeoutRef.current = setTimeout(stopSoundLoop, SOUND_SAFETY_CAP_MS);
  }, [stopSoundLoop]);

  // Drop a specific order from the local queue (used on our own successful
  // response, and on the 'order:seller_response' echo from another tab/device).
  const removeOrderFromQueue = useCallback((orderId) => {
    setOrderQueue(q => {
      const next = q.filter(o => o.orderId !== orderId);
      if (next.length === 0) {
        stopSoundLoop();
      } else if (q[0]?.orderId === orderId) {
        // The one being shown just resolved — surface the next one automatically.
        setIsMinimized(false);
      }
      return next;
    });
  }, [stopSoundLoop]);

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

    const onOrderNew = (payload) => {
      setOrderQueue(q => {
        const wasEmpty = q.length === 0;
        if (wasEmpty) {
          setIsMinimized(false);
          setResolvedAs(null);
        }
        return [...q, payload];
      });
      startSoundLoop();
      // Let any currently-open Orders page (or other listeners) know to refresh
      // without a full page reload — see Orders.jsx's 'seller:new-order' listener.
      window.dispatchEvent(new CustomEvent('seller:new-order', { detail: payload }));
    };

    // Echo of our own accept/reject from another tab/device, or from OrderDetail.jsx.
    const onSellerResponseEcho = (payload) => {
      removeOrderFromQueue(payload.orderId);
    };

    socket.on('batch:product_reviewed', onBatchReviewed);
    socket.on('bulk_order:new',         onBulkOrder);
    socket.on('order:new',              onOrderNew);
    socket.on('order:seller_response',  onSellerResponseEcho);

    return () => {
      socket.off('batch:product_reviewed', onBatchReviewed);
      socket.off('bulk_order:new',         onBulkOrder);
      socket.off('order:new',              onOrderNew);
      socket.off('order:seller_response',  onSellerResponseEcho);
      stopSoundLoop();
    };
  }, [token, startSoundLoop, stopSoundLoop, removeOrderFromQueue]);

  // Catch-up: the live socket listener above only ever catches an order that arrives
  // while this component is already mounted+connected. A seller who logs in (or just
  // reloads the tab) after an order already landed would otherwise never see it —
  // it'd just sit there Pending with nothing to surface it. So on mount, pull any of
  // this seller's own orders that are still awaiting a response and seed the queue
  // with them too, exactly as if they'd just arrived live.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get('/orders?status=Pending');
        if (cancelled || !data?.success) return;

        const catchUp = (data.data || [])
          .filter(o => o.sellerType !== 'Admin' && (!o.sellerResponse || o.sellerResponse === 'Pending'))
          .map(o => ({
            orderId: String(o._id),
            totalPrice: o.totalPrice,
            status: o.status,
            sellerResponse: o.sellerResponse || 'Pending',
            createdAt: o.createdAt,
            customerName: o.user?.fullName || o.shippingAddress?.fullName || 'Customer',
            shippingAddress: o.shippingAddress,
            orderItems: o.orderItems
          }));

        if (catchUp.length === 0) return;

        setOrderQueue(q => {
          const existingIds = new Set(q.map(o => o.orderId));
          const toAdd = catchUp.filter(o => !existingIds.has(o.orderId));
          return toAdd.length ? [...q, ...toAdd] : q;
        });
        setIsMinimized(false);
        startSoundLoop();
      } catch (err) {
        console.error('Failed to fetch pending orders for catch-up:', err.message);
      }
    })();

    return () => { cancelled = true; };
  }, [token, startSoundLoop]);

  // Auto-dismiss the batch/bulk toast queue after 9 seconds (unrelated to new-order modal)
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismiss, 9000);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  const handleRespond = async (action) => {
    if (!pendingOrder || responding) return;
    setResponding(action);
    try {
      const { data } = await api.put(`/orders/${pendingOrder.orderId}/seller-response`, { action });
      // The endpoint is idempotent — if this order was already resolved some other way
      // (another tab, OrderDetail.jsx, an admin action) it returns 200 without applying
      // our click. Show what actually happened, not just what we clicked.
      const actualOutcome = data?.alreadyResolved ? data.data.sellerResponse : action;
      if (data?.alreadyResolved) {
        toast(`This order was already ${actualOutcome}.`, { icon: 'ℹ️' });
      }
      setResolvedAs(actualOutcome);
      setTimeout(() => {
        setResolvedAs(null);
        setResponding(null);
        removeOrderFromQueue(pendingOrder.orderId);
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to respond to order. Please try again.');
      setResponding(null);
      // Nothing was resolved — keep the sound looping and the order in the queue.
    }
  };

  return (
    <>
      <AnimatePresence>
        {current && (
          current.type === 'batch_reviewed'
            ? <BatchReviewedPopup key="br" notification={current.data} onDismiss={dismiss} />
            : <BulkOrderPopup     key="bo" notification={current.data} onDismiss={dismiss} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingOrder && !isMinimized && (
          <NewOrderModal
            key={pendingOrder.orderId}
            notification={pendingOrder}
            extraCount={orderQueue.length - 1}
            responding={responding}
            resolvedAs={resolvedAs}
            onMinimize={() => setIsMinimized(true)}
            onRespond={handleRespond}
          />
        )}
        {pendingOrder && isMinimized && (
          <PendingOrderBadge
            key="badge"
            count={orderQueue.length}
            onExpand={() => setIsMinimized(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SellerNotifications;
