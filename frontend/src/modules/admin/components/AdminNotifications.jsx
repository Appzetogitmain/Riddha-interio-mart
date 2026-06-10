import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiX, FiArrowRight, FiTruck, FiLayers } from 'react-icons/fi';
import { connectSocket, disconnectSocket } from '../../../shared/utils/socket';
import { useNavigate } from 'react-router-dom';

import { playNotificationSound } from '../../../shared/utils/notificationSound';

const AdminNotifications = ({ token }) => {
  const [activeNotification, setActiveNotification] = useState(null);
  const navigate = useNavigate();

  const playSound = useCallback(() => {
    playNotificationSound();
  }, []);

  useEffect(() => {
    if (!token) {
      console.log('No token for AdminNotifications socket.');
      return;
    }

    console.log('Connecting Admin socket for notifications...');
    const socket = connectSocket({ token });

    socket.on('connect', () => {
      console.log('Admin socket connected successfully. Socket ID:', socket.id);
    });

    socket.on('order:new', (payload) => {
      console.log('ORDER:NEW received in Admin panel:', payload);
      playSound();
      setActiveNotification({ ...payload, type: 'order' });
    });

    socket.on('product:new_request', (payload) => {
      console.log('PRODUCT:NEW_REQUEST received in Admin panel:', payload);
      playSound();
      setActiveNotification({ ...payload, type: 'product' });
    });

    socket.on('delivery:new_registration', (payload) => {
      console.log('DELIVERY:NEW_REGISTRATION received in Admin panel:', payload);
      playSound();
      setActiveNotification({ ...payload, type: 'delivery_reg' });
    });

    socket.on('delivery:response', (payload) => {
      console.log('DELIVERY:RESPONSE received in Admin panel:', payload);
      playSound();
      setActiveNotification({ ...payload, type: 'delivery_resp' });
    });

    socket.on('batch:new', (payload) => {
      console.log('BATCH:NEW received in Admin panel:', payload);
      playSound();
      setActiveNotification({ ...payload, type: 'batch' });
    });

    socket.on('connect_error', (err) => {
      console.error('Admin socket connection error:', err.message);
      if (err.message === 'AUTH_INVALID_TOKEN' || err.message === 'AUTH_TOKEN_REQUIRED' || err.message === 'AUTH_INVALID') {
        console.warn('Socket authentication failed. This might be due to an expired or invalid token.');
      }
    });

    return () => {
      console.log('Cleaning up Admin socket listeners...');
      socket.off('order:new');
      socket.off('product:new_request');
      socket.off('delivery:new_registration');
      socket.off('delivery:response');
      socket.off('batch:new');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [token, playSound]);

  const getIcon = () => {
     if (activeNotification.type === 'batch') return <FiLayers size={28} className="animate-bounce" />;
     if (activeNotification.type === 'product') return <FiPackage size={28} className="animate-bounce" />;
     if (activeNotification.type === 'delivery_reg' || activeNotification.type === 'delivery_resp') return <FiTruck size={28} className="animate-bounce" />;
     return <FiPackage size={28} className="animate-bounce" />;
  };

  const getTheme = () => {
     if (activeNotification.type === 'batch') return 'bg-violet-50 text-violet-600';
     if (activeNotification.type === 'product') return 'bg-amber-50 text-amber-600';
     if (activeNotification.type === 'delivery_reg') return 'bg-blue-50 text-blue-600';
     if (activeNotification.type === 'delivery_resp') return activeNotification.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
     return 'bg-brand-pink/5 text-red-800';
  };

  return (
    <AnimatePresence mode="wait">
      {activeNotification ? (
        <motion.div
          key={activeNotification.type + (activeNotification.orderId || activeNotification.id || '')}
          initial={{ opacity: 0, scale: 0.8, y: 50, x: '-50%' }}
          animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, scale: 0.8, y: 20, x: '-50%' }}
          className="fixed bottom-10 left-1/2 z-[9999] w-[90%] max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-soft-oatmeal p-6 flex items-start gap-4 overflow-hidden group"
        >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${
              activeNotification.type === 'batch' ? 'bg-violet-600' :
              activeNotification.type === 'delivery_reg' ? 'bg-blue-600' :
              activeNotification.type === 'delivery_resp' ? (activeNotification.status === 'Accepted' ? 'bg-emerald-500' : 'bg-rose-500') :
              activeNotification.type === 'product' ? 'bg-amber-500' :
              'bg-gradient-to-r from-red-800 to-deep-espresso'
            }`} />

            {/* Icon Wrapper */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${getTheme()}`}>
               {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-deep-espresso">
                    {activeNotification.type === 'batch' ? 'New Product Batch' :
                     activeNotification.type === 'product' ? 'Product Approval' :
                     activeNotification.type === 'delivery_reg' ? 'New Fleet Request' :
                     activeNotification.type === 'delivery_resp' ? 'Delivery Response' :
                     'Incoming Order'}
                  </h3>
                  <button 
                    onClick={() => setActiveNotification(null)}
                    className="p-1 hover:bg-soft-oatmeal rounded-full transition-colors text-brand-teal"
                  >
                    <FiX size={18} />
                  </button>
               </div>
               <p className="text-xl font-display font-bold text-deep-espresso leading-tight">
                  {activeNotification.type === 'batch'
                    ? `${activeNotification.totalProducts} product${activeNotification.totalProducts !== 1 ? 's' : ''} need review`
                    : activeNotification.type === 'product' ? activeNotification.message
                    : activeNotification.type === 'delivery_reg' ? `${activeNotification.fullName} wants to join`
                    : activeNotification.type === 'delivery_resp' ? `Order ${activeNotification.status}`
                    : `₹${activeNotification.totalPrice?.toLocaleString()} Order Received`}
               </p>
               <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-teal font-medium mt-2">
                  <span className="flex items-center gap-1">
                     <span className={`w-1.5 h-1.5 rounded-full ${
                       activeNotification.type === 'batch' ? 'bg-violet-500' :
                       activeNotification.type === 'product' ? 'bg-amber-500' :
                       activeNotification.type === 'delivery_reg' ? 'bg-blue-500' :
                       activeNotification.type === 'delivery_resp' ? (activeNotification.status === 'Accepted' ? 'bg-emerald-500' : 'bg-rose-500') :
                       'bg-green-500'
                     }`}></span>
                     {activeNotification.type === 'batch' ? (activeNotification.shopName || activeNotification.sellerName) :
                      activeNotification.type === 'product' ? activeNotification.sellerName :
                      activeNotification.type === 'delivery_reg' ? activeNotification.vehicleType :
                      activeNotification.type === 'delivery_resp' ? activeNotification.deliveryBoyName :
                      (activeNotification.customerName || 'Premium Client')}
                  </span>
                  <span className="opacity-30">•</span>
                  <span>{activeNotification.type === 'batch' ? 'Batch Submission' :
                         activeNotification.type === 'product' ? 'Draft Product' :
                         activeNotification.type === 'delivery_reg' ? activeNotification.phone :
                         activeNotification.type === 'delivery_resp' ? `Order ID: ...${activeNotification.orderId?.slice(-6)}` :
                         (activeNotification.shippingCity || 'Global')}</span>
                  {activeNotification.type === 'order' && (
                    <>
                      <span className="opacity-30">•</span>
                      <span>{activeNotification.itemsCount} Items</span>
                    </>
                  )}
               </div>

               <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => {
                        if (activeNotification.type === 'batch') {
                          navigate('/admin/product-batches');
                        } else if (activeNotification.type === 'product') {
                          navigate('/admin/inventory');
                        } else if (activeNotification.type === 'delivery_reg') {
                          navigate('/admin/delivery/pending');
                        } else {
                          navigate(`/admin/orders/view/${activeNotification.orderId}`);
                        }
                        setActiveNotification(null);
                    }}
                    className={`flex-1 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                      activeNotification.type === 'batch' ? 'bg-violet-600 text-white hover:bg-violet-700' :
                      activeNotification.type === 'product' ? 'bg-amber-600 text-white hover:bg-amber-700' :
                      activeNotification.type === 'delivery_reg' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                      activeNotification.type === 'delivery_resp' ? (activeNotification.status === 'Accepted' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') :
                      'bg-deep-espresso text-white hover:bg-red-900'
                    }`}
                  >
                    {activeNotification.type === 'batch' ? 'Review Batch' :
                     activeNotification.type === 'product' ? 'Review Product' :
                     activeNotification.type === 'delivery_reg' ? 'Review Partner' :
                     activeNotification.type === 'delivery_resp' ? 'View Order' :
                     'Process Now'} <FiArrowRight size={14} />
                  </button>
                  <button 
                    onClick={() => setActiveNotification(null)}
                    className="px-6 py-3 border border-soft-oatmeal rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-teal hover:bg-soft-oatmeal transition-all"
                  >
                    Dismiss
                  </button>
               </div>
            </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default AdminNotifications;
