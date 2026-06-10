import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiCheckCircle, 
  FiArrowLeft, 
  FiShoppingBag, 
  FiTruck, 
  FiAlertCircle, 
  FiCalendar, 
  FiCreditCard, 
  FiCopy, 
  FiCheck 
} from 'react-icons/fi';
import Button from '../../../../views/shared/Button';
import api from '../../../../shared/utils/api';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
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

        // Fetch actual order details from backend in parallel
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
          setNoOrder(true);
        } else {
          setOrders(validOrders);
        }
      } catch (e) {
        console.error('Error fetching order content:', e);
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
    // Clear temporary transaction states on exit
    localStorage.removeItem('last_order_ids');
    localStorage.removeItem('last_order_id');
    navigate(targetPath);
  };

  // State guard for missing orders or direct URL access
  if (noOrder && !loading) {
    return (
      <div className="min-h-screen bg-soft-oatmeal/5 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500 border border-amber-100 shadow-sm">
          <FiAlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-deep-espresso mb-2">No Active Order Transaction Found</h2>
        <p className="text-deep-espresso/50 mb-8 text-xs font-semibold uppercase tracking-wider max-w-sm leading-relaxed">
          It looks like you accessed this page directly without placing an active checkout transaction.
        </p>
        <button 
          onClick={() => navigate('/products')} 
          className="px-10 py-4 bg-warm-sand hover:bg-deep-espresso text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-warm-sand/15 active:scale-[0.98]"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  // Elegant loader matching prototype style
  if (loading) {
    return (
      <div className="min-h-screen bg-soft-oatmeal/5 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="w-16 h-16 border-4 border-warm-sand/20 border-t-warm-sand rounded-full animate-spin mb-6" />
        <h3 className="text-sm font-black text-deep-espresso uppercase tracking-widest">Securing Luxury Element Records</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5">Reading database confirmations...</p>
      </div>
    );
  }

  // Computations based on fetched orders
  const totalAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const firstOrder = orders[0] || {};
  const paymentMethod = firstOrder.paymentMethod || 'Online';
  const isAllPaid = orders.every(o => o.isPaid || o.paymentStatus === 'paid');
  const paymentStatusDisplay = isAllPaid 
    ? 'Paid & Secured' 
    : paymentMethod === 'COD' 
      ? 'COD Pending Verification' 
      : 'Payment Pending';

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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-soft-oatmeal/5 flex flex-col items-center justify-center px-4 py-20"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-xl w-full bg-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl text-center border border-soft-oatmeal/20"
      >
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center ring-8 ring-green-500/10">
            <FiCheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black text-deep-espresso mb-3 uppercase tracking-tight">Order Confirmed!</h1>
        <p className="text-deep-espresso/50 font-medium mb-8 leading-relaxed text-xs max-w-md mx-auto">
          Your luxury elements have been secured. Our concierge team is now preparing your white-glove delivery experience.
        </p>

        {/* Dynamic Billing & Transaction Information */}
        <div className="grid grid-cols-2 gap-4 p-5 bg-soft-oatmeal/5 rounded-2xl border border-soft-oatmeal/10 text-left mb-6">
          <div>
            <p className="text-[8px] uppercase font-black tracking-widest text-gray-400">Order Date</p>
            <div className="flex items-center gap-1.5 mt-1 text-deep-espresso">
              <FiCalendar className="text-xs text-warm-sand" />
              <span className="text-xs font-bold">{orderDateFormatted}</span>
            </div>
          </div>
          <div>
            <p className="text-[8px] uppercase font-black tracking-widest text-gray-400">Total Price Paid</p>
            <p className="text-xs font-black text-deep-espresso mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="mt-2">
            <p className="text-[8px] uppercase font-black tracking-widest text-gray-400">Payment Gateway</p>
            <div className="flex items-center gap-1.5 mt-1 text-deep-espresso">
              <FiCreditCard className="text-xs text-warm-sand" />
              <span className="text-xs font-bold uppercase">{paymentMethod}</span>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[8px] uppercase font-black tracking-widest text-gray-400">Payment Status</p>
            <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${isAllPaid ? 'text-green-600' : 'text-amber-600'}`}>
              {paymentStatusDisplay}
            </p>
          </div>
        </div>

        {/* Dynamic Order IDs / split items */}
        <div className="space-y-3 mb-8 text-left">
          <p className="text-[8px] uppercase font-black tracking-widest text-gray-400 px-1">ORDER ID REFERENCES ({orders.length})</p>
          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
            {orders.map((order, idx) => (
              <div 
                key={order._id}
                className="flex items-center justify-between p-3 bg-white border border-soft-oatmeal/10 rounded-xl hover:bg-soft-oatmeal/5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-warm-sand/10 text-warm-sand font-black text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-deep-espresso">#{order._id}</span>
                    <button 
                      onClick={() => handleCopy(order._id)}
                      className="text-gray-400 hover:text-warm-sand transition-colors p-0.5"
                    >
                      {copiedId === order._id ? (
                        <FiCheck className="text-green-600 text-xs" />
                      ) : (
                        <FiCopy className="text-[10px]" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-deep-espresso">₹{order.totalPrice?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="flex items-center gap-4 p-4 bg-soft-oatmeal/5 rounded-2xl border border-soft-oatmeal/10 mb-8 text-left">
          <FiTruck className="h-5 w-5 text-warm-sand shrink-0" />
          <div className="text-left">
            <p className="text-[8px] uppercase font-black tracking-widest text-gray-400">Concierge Shipping Status</p>
            <p className="text-xs font-bold text-deep-espresso leading-tight">Prepared for dispatch within 24-48 Hours</p>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => handleExit('/products')}
          size="lg" 
          className="w-full h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-warm-sand/20 group"
        >
          <FiArrowLeft className="mr-3 transform group-hover:-translate-x-1 transition-transform" />
          Back to Catalog
        </Button>
      </motion.div>
      
      <p className="mt-8 text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Thank you for choosing Riddha Interio</p>
    </motion.div>
  );
};

export default CheckoutPage;
