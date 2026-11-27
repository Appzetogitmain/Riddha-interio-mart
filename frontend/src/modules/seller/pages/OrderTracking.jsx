import React from "react";
import PageWrapper from "../components/PageWrapper";
import { LuSearch, LuFilter, LuTruck, LuPackage, LuClock, LuMapPin, LuNavigation2 } from "react-icons/lu";
import { FiCheckCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/utils/api";
import { motion, AnimatePresence } from "framer-motion";

const OrderTracking = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      if (data.success) {
        // Only show orders that have some delivery activity (not 'None')
        const trackingOrders = (data.data || []).filter(o => 
          o.deliveryStatus !== 'None' && o.status !== 'Delivered' && o.status !== 'Cancelled'
        );
        setOrders(trackingOrders);
      }
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
    const onUpdate = () => fetchOrders();
    window.addEventListener('delivery:response_received', onUpdate);
    return () => window.removeEventListener('delivery:response_received', onUpdate);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Accepted': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Picked': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Out for Delivery': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'Delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case 'Pending': return '15%';
      case 'Accepted': return '40%';
      case 'Picked': return '65%';
      case 'Out for Delivery': return '85%';
      case 'Delivered': return '100%';
      default: return '0%';
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight uppercase italic">
              Live <span className="text-red-800">Tracking</span>
            </h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">
              Monitor your active shipments in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">In Transit</p>
              <p className="text-xl font-black text-gray-900">{orders.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-900 rounded-2xl shadow-lg shadow-black/10 flex items-center justify-center text-white">
              <LuNavigation2 size={24} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Track by ID or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-3xl pl-14 pr-6 py-5 focus:outline-none focus:ring-4 focus:ring-red-800/5 transition-all text-sm font-bold shadow-sm"
          />
          <LuSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {/* Tracking List */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-red-800 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Connecting to satellites...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                <LuTruck size={40} />
             </div>
             <h3 className="text-2xl font-bold text-gray-900">No active shipments</h3>
             <p className="text-gray-400 text-sm mt-2">Orders you assign to partners will appear here for tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={order._id}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/10 overflow-hidden group hover:border-red-800/20 transition-all p-8"
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Status & Info Column */}
                  <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-50 pb-8 lg:pb-0 lg:pr-8">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Tracking ID</p>
                         <h4 className="text-lg font-black text-gray-900 tracking-tighter uppercase">#{order._id.slice(-8).toUpperCase()}</h4>
                       </div>
                       <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${getStatusColor(order.deliveryStatus)}`}>
                         {order.deliveryStatus}
                       </span>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-800">
                            <LuPackage size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Customer</p>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{order.shippingAddress.fullName}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-800">
                            <LuMapPin size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Destination</p>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">
                              {order.shippingAddress.city}, {order.shippingAddress.fullAddress}
                            </p>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Tracking Progress Column */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="space-y-8">
                       <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Shipment Progress</p>
                            <p className="text-sm font-black text-gray-900 uppercase">
                              {order.deliveryStatus === 'Pending' ? 'Waiting for partner response' : 
                               order.deliveryStatus === 'Accepted' ? 'Partner preparing for pickup' :
                               order.deliveryStatus === 'Picked' ? 'Package collected' :
                               order.deliveryStatus === 'Out for Delivery' ? 'Nearing destination' : 'Package Delivered'}
                            </p>
                         </div>
                         <p className="text-xl font-black text-gray-900 italic tracking-tighter">
                           {getProgressWidth(order.deliveryStatus)}
                         </p>
                       </div>

                       {/* Progress Bar */}
                       <div className="h-4 bg-gray-50 rounded-full overflow-hidden p-1 border border-gray-100 flex items-center">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: getProgressWidth(order.deliveryStatus) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-red-800 rounded-full shadow-lg shadow-red-900/20"
                          />
                       </div>

                       {/* Stepper */}
                       <div className="grid grid-cols-4 gap-2">
                          {['Accepted', 'Picked', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                             const steps = ['Accepted', 'Picked', 'Out for Delivery', 'Delivered'];
                             const currentIdx = steps.indexOf(order.deliveryStatus);
                             const isCompleted = currentIdx >= idx;
                             
                             return (
                               <div key={idx} className="flex flex-col items-center text-center">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                    isCompleted ? 'bg-red-800 text-white shadow-lg' : 'bg-gray-100 text-gray-300'
                                  }`}>
                                    <FiCheckCircle size={14} />
                                  </div>
                                  <p className={`text-[8px] font-black uppercase mt-2 tracking-widest ${
                                    isCompleted ? 'text-gray-900' : 'text-gray-300'
                                  }`}>{step}</p>
                               </div>
                             );
                          })}
                       </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white">
                           <LuTruck size={14} />
                         </div>
                         <p className="text-[10px] font-black text-gray-900 uppercase">
                           Partner Assigned: <span className="text-red-800 ml-1">{order.deliveryBoy ? 'Tracking Live' : 'N/A'}</span>
                         </p>
                       </div>
                       <button
                         onClick={() => navigate(`/seller/order/${order._id}`)}
                         className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-800 transition-colors"
                       >
                         View Details
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) }
      </div>
    </PageWrapper>
  );
};

export default OrderTracking;
