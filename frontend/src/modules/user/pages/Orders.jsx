import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiShoppingBag, FiChevronRight, FiClock, FiCheckCircle, FiTruck } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import ReviewFeedbackModal from '../components/ReviewFeedbackModal';
import ExistingReviewCard from '../components/ExistingReviewCard';
import { FiMessageCircle } from 'react-icons/fi';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();

  // Feedback Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [modalInitialData, setModalInitialData] = useState(null);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/reviews/me');
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user reviews:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const { data } = await api.get('/orders/my-orders');
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    fetchReviews();
  }, []);

  const openFeedbackModal = (orderId, product, existingReview = null) => {
    setActiveOrder(orderId);
    setActiveProduct(product);
    setModalInitialData(existingReview);
    setIsModalOpen(true);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-50 text-green-700 border-green-100';
      case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Shipped': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8 md:py-20 font-sans"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 md:mb-16"
        >
          <div className="flex items-center gap-2 text-teal-600 mb-3">
            <FiPackage className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Order History</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Your <span className="text-teal-600">Orders</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Review and track the journey of your premium interiors.
          </p>
        </motion.div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4" />
            <p className="text-xs font-medium text-gray-400">Loading your history...</p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 md:py-24 bg-white border border-gray-200 rounded-2xl shadow-sm"
          >
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <FiShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-sm mb-8 text-center max-w-xs px-6">
              You haven't placed any orders yet. Start your premium collection today.
            </p>
            <Link
              to="/products"
              className="bg-gray-900 text-white rounded-xl px-10 py-3.5 font-bold text-xs hover:bg-teal-600 transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              Browse Products
            </Link>
          </motion.div>
        ) : (
          /* Order List */
          <div className="space-y-4 md:space-y-6">
            <AnimatePresence>
              {orders.map((order, idx) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-teal-200 transition-all group"
                >
                  <div className="p-5 md:p-8">
                    {/* Header: ID, Status & Price */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gray-50 items-center justify-center text-gray-400 border border-gray-100">
                          <FiClock size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Order ID</p>
                          <p className="text-sm font-bold text-gray-900 tracking-tight">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                        <p className="text-lg font-bold text-gray-900">₹{order.totalPrice.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4 mb-6">
                       {order.orderItems.map((item, i) => {
                          const existingReview = reviews.find(r => r.product && (r.product._id === item.product || r.product === item.product));
                          
                          return (
                            <div key={i} className="flex flex-col">
                              <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                 <div className="flex items-center gap-3">
                                   <img 
                                     src={item.image} 
                                     alt={item.name} 
                                     className="w-12 h-12 object-cover rounded-lg shadow-sm"
                                   />
                                   <div>
                                      <p className="text-xs font-bold text-gray-900 truncate max-w-[150px] md:max-w-[250px]">{item.name}</p>
                                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Qty: {item.quantity} • ₹{item.price.toLocaleString()}</p>
                                   </div>
                                 </div>
                                 
                                 <div className="flex flex-col gap-2 shrink-0">
                                   {order.status === 'Delivered' && !existingReview && (
                                     <button
                                       onClick={() => openFeedbackModal(order._id, item)}
                                       className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-teal-600 rounded-lg hover:bg-teal-50 hover:border-teal-200 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                                     >
                                       <FiMessageCircle size={12} />
                                       Feedback
                                     </button>
                                   )}
                                 </div>
                              </div>

                              {existingReview && (
                                <ExistingReviewCard 
                                  review={existingReview} 
                                  onEdit={() => openFeedbackModal(order._id, item, existingReview)}
                                  onDelete={fetchReviews}
                                />
                              )}
                            </div>
                          );
                       })}
                    </div>

                    {/* Footer: Date & Actions */}
                    <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                       <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          <button
                            onClick={() => navigate(`/order/invoice/${order._id}`)}
                            className="text-xs font-bold text-gray-500 hover:text-teal-600 transition-colors"
                          >
                            Invoice
                          </button>
                          <button
                           onClick={() => navigate(`/track-order/${order._id}`)}
                           className="flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2 rounded-xl hover:bg-teal-600 transition-all active:scale-95 shadow-md shadow-gray-200"
                          >
                             <span className="text-xs font-bold">Track</span>
                             <FiChevronRight className="w-4 h-4 opacity-50" />
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ReviewFeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={activeOrder}
        product={activeProduct}
        initialData={modalInitialData}
        onStatusChange={fetchReviews}
      />

    </motion.div>
  );
};

export default Orders;
