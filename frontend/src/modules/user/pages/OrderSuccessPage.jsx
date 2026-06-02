import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiCheck, 
  FiArrowRight, 
  FiShoppingBag, 
  FiMapPin, 
  FiAlertCircle, 
  FiCopy, 
  FiCheckCircle, 
  FiCalendar, 
  FiCreditCard, 
  FiPackage,
  FiInfo
} from 'react-icons/fi';
import Button from '../../../shared/components/Button';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [orderIds, setOrderIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noOrder, setNoOrder] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        let ids = [];
        const savedIds = localStorage.getItem('last_order_ids');
        if (savedIds) {
          ids = JSON.parse(savedIds);
        } else {
          const oldId = localStorage.getItem('last_order_id');
          if (oldId) {
            ids = [oldId];
          }
        }

        if (!ids || ids.length === 0) {
          setNoOrder(true);
          setLoading(false);
          return;
        }

        setOrderIds(ids);

        // Parallel fetching of real order details from database
        const fetched = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await api.get(`/orders/${id}`);
              return res.data?.data || res.data;
            } catch (err) {
              console.error(`Failed to fetch order ${id}:`, err);
              return null;
            }
          })
        );

        const validOrders = fetched.filter(Boolean);

        if (validOrders.length === 0) {
          // If orders are missing from the backend/deleted, trigger graceful missing order fallback
          setNoOrder(true);
        } else {
          setOrders(validOrders);
        }
      } catch (e) {
        console.error('Error fetching order context:', e);
        setNoOrder(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, []);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Order Reference copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExit = (targetPath) => {
    // Clear temporary transaction states only when explicitly leaving the success screen
    localStorage.removeItem('last_order_ids');
    localStorage.removeItem('last_order_id');
    navigate(targetPath);
  };

  // Graceful state fallback for direct URL access or missing orders
  if (noOrder && !loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500 border border-amber-100 shadow-sm animate-bounce">
          <FiAlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Order Transaction Found</h2>
        <p className="text-gray-400 mb-8 text-xs font-semibold uppercase tracking-wider max-w-sm leading-relaxed">
          It looks like you accessed this page directly without placing an active checkout transaction or your order session has expired.
        </p>
        <button 
          onClick={() => navigate('/products')} 
          className="px-10 py-4 bg-[#189D91] hover:bg-black text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#189D91]/15 active:scale-[0.98]"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  // Elegant loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-[#189D91]/20 border-t-[#189D91] rounded-full animate-spin mb-6" />
        <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Verifying Secure Transaction</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5">Securing luxury resources...</p>
      </div>
    );
  }

  // Aggregated calculations based on verified database orders
  const totalAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const firstOrder = orders[0] || {};
  const paymentMethod = firstOrder.paymentMethod || 'Online';
  
  // Format aggregate payment status nicely
  const isAllPaid = orders.every(o => o.isPaid || o.paymentStatus === 'paid');
  const compositePaymentStatus = isAllPaid 
    ? 'Paid & Captured' 
    : paymentMethod === 'COD' 
      ? 'COD Pending' 
      : 'Payment Pending';

  // Format Order Date Dynamic
  const orderDateFormatted = firstOrder.createdAt 
    ? new Date(firstOrder.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 md:p-8 text-center pb-24">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#189D91]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Success Animation Orb */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-20 h-20 bg-[#189D91] rounded-full flex items-center justify-center shadow-xl shadow-[#189D91]/25 mb-8"
      >
        <FiCheck className="text-white text-4xl stroke-[3]" />
      </motion.div>

      {/* Dynamic Title */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 max-w-lg"
      >
        <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 tracking-tight uppercase">
          {orders.length > 1 ? 'Orders Secured!' : 'Order Secured!'}
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.08em] leading-relaxed px-4">
          Your payment was processed successfully. Our sellers are preparing your white-glove luxury elements.
        </p>
      </motion.div>

      {/* Premium Glassmorphic Summary Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 w-full max-w-xl bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left"
      >
        {/* Aggregated Transaction Metadata */}
        <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">DATE OF PURCHASE</p>
            <div className="flex items-center gap-1.5 text-slate-800">
              <FiCalendar className="text-gray-400 text-xs shrink-0" />
              <span className="text-xs font-bold">{orderDateFormatted}</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">TOTAL TRANSACTION AMOUNT</p>
            <div className="flex items-center gap-1.5 text-slate-900">
              <span className="text-xs font-black">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">PAYMENT FLOW</p>
            <div className="flex items-center gap-1.5 text-slate-800">
              <FiCreditCard className="text-gray-400 text-xs shrink-0" />
              <span className="text-xs font-bold uppercase">{paymentMethod}</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">PAYMENT STATUS</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              isAllPaid 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {compositePaymentStatus}
            </span>
          </div>
        </div>

        {/* Dynamic Individual Orders Display */}
        <div className="space-y-4">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">ORDER REFERENCES ({orders.length})</p>
          <div className="space-y-3">
            {orders.map((order, idx) => (
              <div 
                key={order._id}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-gray-100/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#189D91] border border-gray-100">
                    <span className="text-xs font-black">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">#{order._id}</span>
                      <button 
                        onClick={() => handleCopy(order._id)}
                        className="text-gray-400 hover:text-[#189D91] transition-colors p-1"
                        title="Copy Order ID"
                      >
                        {copiedId === order._id ? (
                          <FiCheckCircle className="text-emerald-500 text-xs" />
                        ) : (
                          <FiCopy className="text-xs" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      {order.orderItems?.length || 0} {order.orderItems?.length === 1 ? 'item' : 'items'} • Seller: <span className="text-slate-600 font-bold">{order.seller?.shopName || 'Riddha Seller'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-800">₹{order.totalPrice?.toLocaleString('en-IN')}</span>
                  <p className="text-[9px] text-[#189D91] font-black uppercase tracking-wider mt-0.5">{order.status || 'Confirmed'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Interactive Timeline */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">ORDER TIMELINE PREVIEW</p>
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {/* Step 1 */}
            <div className="relative flex gap-4 items-start">
              <span className="absolute -left-[20px] top-1 w-[12px] h-[12px] rounded-full bg-[#189D91] border-2 border-white ring-4 ring-[#189D91]/15" />
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Order Securely Placed</p>
                <p className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">Your payment was confirmed on {orderDateFormatted}.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="relative flex gap-4 items-start">
              <span className={`absolute -left-[20px] top-1 w-[12px] h-[12px] rounded-full border-2 border-white ring-4 ${
                isAllPaid || paymentMethod === 'COD'
                  ? 'bg-[#189D91] ring-[#189D91]/15'
                  : 'bg-amber-400 ring-amber-400/15'
              }`} />
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {paymentMethod === 'COD' ? 'COD Verification Completed' : 'Payment Verified'}
                </p>
                <p className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">
                  {paymentMethod === 'COD' ? 'Order validated and approved for payment on delivery.' : 'Transaction captured securely via digital payment gateway.'}
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="relative flex gap-4 items-start">
              <span className="absolute -left-[20px] top-1 w-[12px] h-[12px] rounded-full bg-[#189D91] border-2 border-white ring-4 ring-[#189D91]/15 animate-pulse" />
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  Seller Processing <span className="inline-block w-1.5 h-1.5 bg-[#189D91] rounded-full animate-ping" />
                </p>
                <p className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">The luxury collection pieces are being packed carefully for white-glove delivery.</p>
              </div>
            </div>
            {/* Step 4 */}
            <div className="relative flex gap-4 items-start opacity-50">
              <span className="absolute -left-[20px] top-1 w-[12px] h-[12px] rounded-full bg-gray-200 border-2 border-white" />
              <div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Out For Delivery</p>
                <p className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">A secure delivery courier agent will be dispatched to your location with an OTP code.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Delivery Information Banner */}
        <div className="flex gap-4 p-4 bg-slate-50 border border-gray-100 rounded-2xl items-center mt-4">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#189D91] shadow-sm border border-gray-100 shrink-0">
            <FiPackage size={18} />
          </div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ESTIMATED DISPATCH</p>
            <p className="text-xs font-bold text-slate-800 leading-tight">Your items will be dispatched within 24-48 Hours</p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10 w-full max-w-xl space-y-4"
      >
        <Button 
          onClick={() => handleExit('/')}
          className="w-full h-16 rounded-2xl bg-[#189D91] text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#189D91]/20 flex items-center justify-center gap-3 active:scale-[0.99] transition-transform"
        >
          CONTINUE SHOPPING <FiArrowRight className="text-lg" />
        </Button>
        <button 
          onClick={() => handleExit('/orders')}
          className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-[#189D91] transition-colors"
        >
          View My Orders
        </button>
      </motion.div>
    </div>
  );
};

export default OrderSuccessPage;
