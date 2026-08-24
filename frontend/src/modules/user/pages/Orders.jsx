import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiShoppingBag, FiChevronRight, FiClock, FiCheckCircle, FiTruck, FiArrowLeft, FiSearch } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../shared/utils/api';
import ReviewFeedbackModal from '../components/ReviewFeedbackModal';
import ExistingReviewCard from '../components/ExistingReviewCard';
import ReturnRequestModal from '../components/ReturnRequestModal';
import { FiMessageCircle, FiRefreshCw } from 'react-icons/fi';

const PAGE_SIZE = 10;

const STATUS_TABS = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'pending', label: 'Pending', statuses: ['Pending', 'Processing', 'Packed'] },
  { id: 'shipped', label: 'Shipped', statuses: ['Shipped'] },
  { id: 'completed', label: 'Completed', statuses: ['Delivered'] },
  { id: 'cancelled', label: 'Cancelled', statuses: ['Cancelled'] }
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Feedback Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [modalInitialData, setModalInitialData] = useState(null);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnItem, setReturnItem] = useState(null);

  const openReturnModal = (order, item) => {
    setReturnOrder(order);
    setReturnItem(item);
    setIsReturnModalOpen(true);
  };

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

  const fetchMyOrders = async (pageToFetch, tabId) => {
    try {
      setLoading(true);
      const tab = STATUS_TABS.find((t) => t.id === tabId) || STATUS_TABS[0];
      const params = { page: pageToFetch, limit: PAGE_SIZE };
      if (tab.statuses) params.status = tab.statuses.join(',');
      const { data } = await api.get('/orders/my-orders', { params });
      if (data.success) {
        setOrders(data.data);
        setPage(data.page || pageToFetch);
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.totalResults ?? data.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders(1, activeTab);
    setSearchTerm('');
  }, [activeTab]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    fetchMyOrders(nextPage, activeTab);
  };

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

  // Client-side filter over the already-fetched page — searches product name, order id, and
  // price (either the order total or any single item's price).
  const term = searchTerm.trim().toLowerCase();
  const filteredOrders = !term ? orders : orders.filter((order) => {
    const matchesId = order._id.slice(-8).toLowerCase().includes(term);
    const matchesTotal = String(order.totalPrice).includes(term);
    const matchesItem = (order.orderItems || []).some((item) =>
      item.name?.toLowerCase().includes(term) || String(item.price).includes(term)
    );
    return matchesId || matchesTotal || matchesItem;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8 md:py-20 font-sans"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors"
          >
            <FiArrowLeft size={16} /> <span className="text-sm font-semibold">Back</span>
          </button>
        </div>
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

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!loading && orders.length > 0 && (
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, price, or order ID..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
            />
          </div>
        )}

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
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === 'all' ? 'No orders found' : `No ${STATUS_TABS.find((t) => t.id === activeTab)?.label} orders`}
            </h3>
            <p className="text-gray-500 text-sm mb-8 text-center max-w-xs px-6">
              {activeTab === 'all'
                ? "You haven't placed any orders yet. Start your premium collection today."
                : 'Try a different filter tab to see your other orders.'}
            </p>
            <Link
              to="/products"
              className="bg-gray-900 text-white rounded-xl px-10 py-3.5 font-bold text-xs hover:bg-teal-600 transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              Browse Products
            </Link>
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          /* No search results */
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <FiSearch className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No matching orders</h3>
            <p className="text-gray-500 text-sm">Try a different product name, price, or order ID.</p>
          </div>
        ) : (
          /* Order List */
          <div className="space-y-3 md:space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order, idx) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-teal-200 transition-all group"
                >
                  <div className="p-4 md:p-5">
                    {/* Header: ID, Status & Price */}
                    <div className="flex items-start justify-between gap-4 mb-4">
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
                        {order.deliveryTimeline?.expectedDeliveryTime && !['Delivered', 'Cancelled'].includes(order.status) && (
                          <p className="text-[10px] font-bold text-teal-700 flex items-center gap-1">
                            <FiClock size={10} />
                            Est. Delivery: {new Date(order.deliveryTimeline.expectedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2.5 mb-4">
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
                                   {order.status === 'Delivered' && item.returnStatus === 'None' && (
                                     <button
                                       onClick={() => openReturnModal(order, item)}
                                       className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-orange-600 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                                     >
                                       <FiRefreshCw size={12} />
                                       Return
                                     </button>
                                   )}
                                   {item.returnStatus !== 'None' && (
                                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-center border border-orange-100">
                                        Return {item.returnStatus}
                                      </span>
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
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
                           {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                             <button
                              onClick={() => navigate(`/track-order/${order._id}`)}
                              className="flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2 rounded-xl hover:bg-teal-600 transition-all active:scale-95 shadow-md shadow-gray-200"
                             >
                                <span className="text-xs font-bold">Track</span>
                                <FiChevronRight className="w-4 h-4 opacity-50" />
                             </button>
                           )}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs font-semibold text-gray-500">
                  Page {page} of {totalPages} &middot; {totalResults} order{totalResults === 1 ? '' : 's'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:border-teal-300 hover:text-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:border-teal-300 hover:text-teal-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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

      {returnOrder && returnItem && (
        <ReturnRequestModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          order={returnOrder}
          orderItem={returnItem}
          onSuccess={() => fetchMyOrders(page, activeTab)}
        />
      )}

    </motion.div>
  );
};

export default Orders;
