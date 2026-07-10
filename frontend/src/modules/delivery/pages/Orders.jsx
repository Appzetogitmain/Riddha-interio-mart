import React from 'react';
import PageWrapper from '../components/PageWrapper';
import OrderCard from '../components/OrderCard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LuPackage, 
  LuRefreshCw, 
  LuSearch, 
  LuFilter, 
  LuActivity,
  LuLayoutGrid,
  LuZap
} from 'react-icons/lu';
import { useUser } from '../../user/data/UserContext';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import ProofUploadModal from '../components/ProofUploadModal';

const Orders = () => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const [activeTab, setActiveTab] = React.useState(filterParam === 'pickups' ? 'pickups' : 'my');
  const [orders, setOrders] = React.useState([]);
  const [returnTasks, setReturnTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [isProofModalOpen, setIsProofModalOpen] = React.useState(false);
  const [proofTargetOrder, setProofTargetOrder] = React.useState(null);
  const [proofTargetStatus, setProofTargetStatus] = React.useState(null);
  const [isPickupProof, setIsPickupProof] = React.useState(false);
  const { user } = useUser();

  // Keep tab state synchronized with sidebar navigation changes
  React.useEffect(() => {
    if (filterParam === 'pickups') {
      setActiveTab('pickups');
    } else if (filterParam === 'available') {
      setActiveTab('available');
    } else {
      setActiveTab('my');
    }
  }, [filterParam]);

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/returns/delivery')
      ]);
      
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data || []);
      }
      
      if (returnsRes.data.success) {
        setReturnTasks(returnsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      if (!isBackground) toast.error('Logistics Sync Failure');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
    const handleNewAssignment = () => {
      fetchOrders(true);
      toast.success('New Deployment Detected', { icon: '🚀' });
    };
    window.addEventListener('delivery:assigned', handleNewAssignment);
    return () => window.removeEventListener('delivery:assigned', handleNewAssignment);
  }, []);

  const submitProof = async ({ images, video }) => {
    setIsProofModalOpen(false);
    const loadingToast = toast.loading(`Updating Mission State: ${proofTargetStatus}`);
    try {
      const payload = { status: proofTargetStatus };
      if (proofTargetStatus === 'Picked' || proofTargetStatus === 'Returned') {
        if (proofTargetStatus === 'Picked') {
          payload.pickupProofImages = images;
          if (video) payload.pickupProofVideo = video;
        } else {
          payload.dropoffProofImages = images;
        }
      }
      
      const isReturn = returnTasks.some(rt => rt._id === proofTargetOrder);
      const endpoint = isReturn ? `/returns/${proofTargetOrder}/status` : `/orders/${proofTargetOrder}/status`;
      
      const { data } = await api.put(endpoint, payload);
      
      if (data.success) {
        toast.success(`Mission State: ${proofTargetStatus} Validated`, { id: loadingToast });
        fetchOrders(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Validation Failure', { id: loadingToast });
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (newStatus === 'Picked' || newStatus === 'Returned') {
      setProofTargetOrder(orderId);
      setProofTargetStatus(newStatus);
      setIsPickupProof(newStatus === 'Picked');
      setIsProofModalOpen(true);
      return;
    }
    
    const loadingToast = toast.loading(`Updating Mission State: ${newStatus}`);
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (data.success) {
        toast.success(`Mission State: ${newStatus} Validated`, { id: loadingToast });
        fetchOrders(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Validation Failure', { id: loadingToast });
    }
  };

  const handleVerifyOtp = async (orderId, otp) => {
    const loadingToast = toast.loading('Verifying OTP...');
    try {
      const { data } = await api.post(`/orders/${orderId}/verify-otp`, { otp });
      if (data.success) {
        toast.success(data.message || 'OTP Verified & Delivered', { id: loadingToast });
        fetchOrders(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP', { id: loadingToast });
    }
  };

  const handleDeliveryResponse = async (orderId, status) => {
    const loadingToast = toast.loading(`${status === 'Accepted' ? 'Authorizing' : 'Declining'} Deployment...`);
    try {
      const { data } = await api.put(`/orders/${orderId}/delivery-response`, { status });
      if (data.success) {
        toast.success(`Deployment ${status} Successfully`, { id: loadingToast });
        fetchOrders(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authorization Failure', { id: loadingToast });
    }
  };

  const handleResendOtp = async (orderId) => {
    const loadingToast = toast.loading('Resending Delivery OTP...');
    try {
      const { data } = await api.post(`/orders/${orderId}/resend-otp`);
      if (data.success) {
        toast.success(data.message || 'New OTP sent successfully!', { id: loadingToast });
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP', { id: loadingToast });
      return false;
    }
  };

  const availableOrders = orders.filter(o => 
    (o.deliveryStatus === 'None' || o.deliveryStatus === 'Rejected') && 
    o.status === 'Processing'
  );

  const myOrders = orders.filter(o => o.deliveryBoy?._id === user?._id || o.deliveryBoy === user?._id);
  
  // Filter for pending pickups (assigned to courier but not yet picked up from merchant)
  const pendingPickups = myOrders.filter(o => o.deliveryStatus === 'Accepted');
  
  const activeReturnTasks = returnTasks.filter(r => r.deliveryStatus !== 'Returned' && r.deliveryStatus !== 'Rejected' && r.deliveryStatus !== 'None');

  const displayedOrders = 
    activeTab === 'available' ? availableOrders : 
    activeTab === 'pickups' ? pendingPickups : 
    activeTab === 'returns' ? activeReturnTasks :
    myOrders;

  return (
    <PageWrapper>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
        
        {/* Operations Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#189D91] rounded-full"></div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Active Deliveries
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
               <LuActivity className="text-[#189D91]" />
               Track and manage your ongoing deliveries
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => fetchOrders(false)}
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#189D91] transition-all shadow-sm"
            >
              <LuRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 flex-wrap sm:flex-nowrap gap-1">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'available' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Available Orders 
                <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'available' ? 'bg-slate-100' : 'bg-slate-200'}`}>
                   {availableOrders.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('pickups')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'pickups' 
                    ? 'bg-[#2A458A] text-white shadow-md' 
                    : 'text-slate-500 hover:text-[#2A458A]'
                }`}
              >
                Pending Pickups
                <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'pickups' ? 'bg-white/20' : 'bg-slate-200'}`}>
                   {pendingPickups.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'my' 
                    ? 'bg-[#189D91] text-white shadow-md' 
                    : 'text-slate-500 hover:text-[#189D91]'
                }`}
              >
                My Deliveries
                <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'my' ? 'bg-white/20' : 'bg-slate-205'}`}>
                   {myOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('returns')}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'returns' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                Return Tasks
                <span className={`px-2 py-0.5 rounded-md text-xs ${activeTab === 'returns' ? 'bg-white/20' : 'bg-slate-205'}`}>
                   {activeReturnTasks.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Deployment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-[2.5rem] h-[400px] animate-pulse border border-slate-100"></div>
              ))
            ) : displayedOrders.length > 0 ? (
              displayedOrders.map(order => {
                const isReturnTask = order.hasOwnProperty('reason');
                
                return (
                  <div key={order._id}>
                    <OrderCard 
                      order={{
                        id: order._id,
                        customerName: isReturnTask ? order.user?.fullName : order.shippingAddress?.fullName,
                        status: order.deliveryStatus || 'None',
                        dateTime: new Date(order.createdAt).toLocaleString(),
                        address: isReturnTask ? order.order?.shippingAddress?.fullAddress : `${order.shippingAddress?.fullAddress}, ${order.shippingAddress?.city}`,
                        phone: isReturnTask ? order.user?.phone : order.shippingAddress?.mobileNumber,
                        sellerLocation: isReturnTask ? order.seller?.shopName : "Operations Hub - 1",
                        items: isReturnTask ? [{
                           name: order.product?.name,
                           quantity: 1,
                           price: order.refundAmount
                        }] : (order.orderItems || []).map(item => ({
                           name: item.name,
                           quantity: item.quantity,
                           price: item.price
                        })),
                        totalBill: isReturnTask ? order.refundAmount : order.totalPrice,
                        paymentMode: isReturnTask ? 'REFUND' : order.paymentMethod,
                        otp: order.deliveryOtp,
                        invoiceUrl: order.invoiceUrl,
                        isReturn: isReturnTask
                      }} 
                      onAccept={(id) => handleDeliveryResponse(id, 'Accepted')}
                      onReject={(id) => handleDeliveryResponse(id, 'Rejected')}
                      onUpdateStatus={(id, status) => handleUpdateStatus(id, status)} 
                      onVerifyOtp={(id, otp) => handleVerifyOtp(id, otp)}
                      onResendOtp={handleResendOtp}
                    />
                  </div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-32 text-center bg-white rounded-3xl border border-slate-200 shadow-sm"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#189D91]">
                  <LuZap size={40} />
                </div>
                <div className="max-w-md mx-auto px-6">
                  <h3 className="text-xl font-bold text-slate-900">No Orders Found</h3>
                  <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                    There are currently no active deliveries in this section. Refresh to check for new ones.
                  </p>
                  <button
                    onClick={() => fetchOrders(false)}
                    className="mt-6 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Refresh Orders
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ProofUploadModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        onSubmit={submitProof}
        isPickup={isPickupProof}
      />
    </PageWrapper>
  );
};

export default Orders;
