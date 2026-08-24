import React, { useState } from 'react';
import { 
  LuMapPin, 
  LuPhone, 
  LuPackage, 
  LuClock, 
  LuCheck, 
  LuX, 
  LuNavigation, 
  LuZap,
  LuExternalLink,
  LuChevronRight,
  LuActivity,
  LuFileText,
  LuTimer,
  LuCamera
} from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import StatusBadge from './StatusBadge';
import InvoiceViewerModal from './InvoiceViewerModal';

const OrderCard = ({ order, onAccept, onReject, onUpdateStatus, onVerifyOtp, onResendOtp }) => {
  const navigate = useNavigate();
  const [showTracking, setShowTracking] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showEwayBill, setShowEwayBill] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [deliveryProofImages, setDeliveryProofImages] = useState([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  
  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendClick = async () => {
    if (resendCooldown > 0) return;
    if (onResendOtp) {
      const success = await onResendOtp(order.id);
      if (success) {
        setResendCooldown(30);
      }
    }
  };

  const handleProofImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (deliveryProofImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setUploadingProof(true);
    const newImages = [...deliveryProofImages];
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data.success) newImages.push(res.data.url);
      } catch (err) {
        toast.error('Failed to upload image');
      }
    }
    setDeliveryProofImages(newImages);
    setUploadingProof(false);
  };

  const isAvailable = ['None', 'Pending', 'Rejected'].includes(order.status);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col"
    >
      {/* Dynamic Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#189D91] group-hover:bg-[#189D91] group-hover:text-white transition-colors">
             <LuPackage size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Order ID</p>
            <p className="text-sm font-bold text-slate-900 tracking-tight">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Operations Content */}
      <div className="p-4 space-y-4 flex-1">
        {/* Logistics Path */}
        <div className="space-y-4 relative">
          <div className="absolute left-[13px] top-[28px] bottom-[28px] w-[2px] bg-gradient-to-b from-[#189D91] to-slate-200"></div>
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-7 h-7 rounded-full bg-teal-50 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
               <div className="w-1.5 h-1.5 rounded-full bg-[#189D91]"></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-0.5">Pickup Location</p>
              <p className="text-sm font-bold text-slate-900">{order.sellerLocation}</p>
            </div>
          </div>

          <div className="flex gap-4 items-start relative z-10">
            <div className="w-7 h-7 rounded-full bg-[#189D91] border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
               <LuMapPin size={12} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                 <p className="text-xs font-bold text-[#189D91] mb-0.5">Delivery Address</p>
                 {order.distanceKm != null && (
                   <span className="text-xs font-semibold text-slate-500">{order.distanceKm} KM</span>
                 )}
              </div>
              <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
              <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                 {order.address}
              </p>
            </div>
          </div>
        </div>

        {/* Cargo Manifest */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-2">
             <p className="text-[11px] font-bold text-slate-500">Order Items</p>
             <span className="text-[11px] font-bold text-[#189D91]">{order.items.length} Items</span>
          </div>
          <div className="space-y-1.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-700">{item.quantity}x {item.name}</span>
                <span className="text-xs font-bold text-slate-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500">Total Amount</span>
            <span className="text-base font-bold text-slate-900 tracking-tight">₹{order.totalBill}</span>
          </div>
        </div>

        {/* Intelligence Overlays */}
        <div className="flex items-center justify-between gap-3">
           <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
              <LuClock size={12} className="text-[#189D91]" />
              <span className="text-[10px] font-bold">{order.dateTime}</span>
           </div>
           <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-50 rounded-lg text-[#189D91]">
              <LuZap size={12} />
              <span className="text-[10px] font-bold">{order.paymentMode}</span>
           </div>
        </div>

        {/* Estimated Delivery — only known once the order has actually gone Out for Delivery */}
        {order.expectedDeliveryTime && (
          <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
            <div className="flex items-center gap-1.5 text-amber-700">
              <LuTimer size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wide">Estimated Delivery</span>
            </div>
            <span className="text-xs font-black text-amber-900">
              {new Date(order.expectedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Directives Area */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        {isAvailable ? (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onReject(order.id)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LuX size={14} /> Decline
            </button>
            <button 
              onClick={() => onAccept(order.id)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#189D91] text-white text-xs font-bold hover:bg-[#137A71] transition-all shadow-sm"
            >
              <LuCheck size={14} /> Accept
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
               <a
                 href={`tel:${order.phone}`}
                 className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#189D91] transition-all group"
               >
                 <div className="p-1.5 bg-white rounded-lg border border-slate-200 group-hover:border-teal-100 group-hover:bg-teal-50 shadow-sm transition-colors">
                    <LuPhone size={14} />
                 </div>
                 Call Customer
               </a>
               {order.status !== 'Delivered' && (
                 <button
                   onClick={() => navigate('/delivery/route-management')}
                   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#189D91] bg-teal-50 hover:bg-[#189D91] hover:text-white rounded-lg transition-all"
                 >
                   <LuMapPin size={14} /> Track
                 </button>
               )}
            </div>
            <div className="grid grid-cols-2 gap-2">
               <button
                 type="button"
                 onClick={() => setShowInvoice(true)}
                 className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all"
               >
                 <LuExternalLink size={14} /> Invoice
               </button>
               <button
                 type="button"
                 onClick={() => setShowEwayBill(true)}
                 className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all"
               >
                 <LuFileText size={14} /> E-Way Bill
               </button>
            </div>
            
            {order.status === 'Accepted' && (
              <button 
                onClick={() => onUpdateStatus(order.id, 'Picked')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#189D91] text-white text-xs font-bold hover:bg-[#137A71] transition-all shadow-sm"
              >
                <LuPackage size={16} /> Mark as Picked
              </button>
            )}
            
            {order.status === 'Picked' && (
              <button 
                onClick={() => onUpdateStatus(order.id, order.isReturn ? 'Out for Return Delivery' : 'Out for Delivery')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#189D91] text-white text-xs font-bold hover:bg-[#137A71] transition-all shadow-sm"
              >
                <LuNavigation size={16} className="animate-pulse" /> {order.isReturn ? 'Start Return Journey' : 'Start Delivery'}
              </button>
            )}

            {order.status === 'Out for Delivery' && !order.isReturn && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex flex-col gap-2">
                  <label className="text-xs font-bold text-amber-800 uppercase tracking-widest text-center">Verify Delivery OTP</label>
                  <input 
                    type="text"
                    placeholder="Enter 4-digit OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm text-center tracking-[0.5em] font-black focus:ring-2 focus:ring-amber-500 outline-none"
                    maxLength={4}
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[9px] text-amber-600 text-center font-semibold">OTP has been sent to customer's email</p>
                    <button
                      type="button"
                      onClick={handleResendClick}
                      disabled={resendCooldown > 0}
                      className={`text-[10px] font-bold tracking-wide transition-all px-2 py-0.5 rounded ${
                        resendCooldown > 0 
                          ? 'text-slate-400 cursor-not-allowed' 
                          : 'text-[#189D91] hover:text-[#137A71] hover:underline'
                      }`}
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest text-center">Delivery Photo Proof</label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {deliveryProofImages.map((img, i) => (
                      <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                        <img src={img} alt="delivery proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setDeliveryProofImages(deliveryProofImages.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <LuX size={10} />
                        </button>
                      </div>
                    ))}
                    {deliveryProofImages.length < 5 && (
                      <label className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-100 text-slate-400">
                        {uploadingProof ? (
                          <LuActivity size={16} className="animate-spin" />
                        ) : (
                          <LuCamera size={18} />
                        )}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleProofImageUpload} disabled={uploadingProof} />
                      </label>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 text-center font-semibold">Capture a photo of the handover as delivery proof.</p>
                </div>

                <button
                  onClick={() => {
                    if (!otp || otp.length !== 4) return alert('Please enter 4-digit OTP');
                    if (deliveryProofImages.length === 0) return alert('Please upload at least one delivery photo');
                    if (order.paymentMode === 'COD') {
                      const confirmCollect = window.confirm(`Please collect cash of ₹${order.totalBill.toLocaleString()} before completing the delivery. Proceed?`);
                      if (!confirmCollect) return;
                    }
                    if (onVerifyOtp) onVerifyOtp(order.id, otp, deliveryProofImages);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm ${
                    order.paymentMode === 'COD' 
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  }`}
                >
                  <LuCheck size={16} /> 
                  {order.paymentMode === 'COD' ? `Deliver & Collect Cash (₹${order.totalBill.toLocaleString()})` : 'Verify OTP & Complete Delivery'}
                </button>
              </div>
            )}
            
            {order.status === 'Out for Return Delivery' && order.isReturn && (
              <button 
                onClick={() => onUpdateStatus(order.id, 'Returned')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm mt-3"
              >
                <LuCheck size={16} /> Complete Return Drop-off
              </button>
            )}

            {order.status === 'Delivered' && (
              <div className="bg-emerald-50 text-emerald-600 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-100">
                <LuCheck size={16} /> Delivered
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      <AnimatePresence>
        {showTracking && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setShowTracking(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-t-3xl md:rounded-3xl z-50 w-full md:w-[600px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 text-slate-900">
                  <LuNavigation className="text-[#189D91]" />
                  <h3 className="font-bold">Live Tracking</h3>
                </div>
                <button onClick={() => setShowTracking(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100">
                  <LuX size={16} />
                </button>
              </div>
              <div className="flex-1 p-0 relative min-h-[400px] bg-slate-100">
                {/* Fallback mockup overlay representing a map interface */}
                <div className="absolute inset-0 bg-emerald-50/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                   <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-[#189D91] mb-4 relative">
                      <LuMapPin size={24} />
                      <div className="absolute inset-0 bg-[#189D91] rounded-full animate-ping opacity-20"></div>
                   </div>
                   <h4 className="text-lg font-bold text-slate-900 mb-2">GPS Active</h4>
                   <p className="text-sm font-medium text-slate-600 mb-6 max-w-xs">
                     Navigating to: <span className="text-slate-900 font-bold">{order.address}</span>
                   </p>
                   
                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm space-y-3">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500 font-semibold">Distance Remaining</span>
                       <span className="font-bold text-slate-900">{order.distanceKm != null ? `${order.distanceKm} km` : '—'}</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                       <div className="bg-[#189D91] h-2 rounded-full w-2/3"></div>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500 font-semibold">ETA</span>
                       <span className="font-bold text-[#189D91]">
                         {order.expectedDeliveryTime
                           ? new Date(order.expectedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                           : '—'}
                       </span>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showInvoice && (
        <InvoiceViewerModal orderId={order.id} docType="customer" onClose={() => setShowInvoice(false)} />
      )}
      {showEwayBill && (
        <InvoiceViewerModal orderId={order.id} docType="label" onClose={() => setShowEwayBill(false)} />
      )}
    </motion.div>
  );
};

export default OrderCard;
