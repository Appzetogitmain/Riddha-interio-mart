import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import ProofUploadModal from '../components/ProofUploadModal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LuArrowLeft,
  LuPackage,
  LuTruck,
  LuClock,
  LuPrinter,
  LuDownload,
  LuMapPin,
  LuPhone,
  LuUser,
  LuCalendar,
  LuCreditCard,
  LuCheck,
  LuX,
  LuRefreshCw,
  LuShare2,
} from 'react-icons/lu';
import { FiCheckCircle, FiBox } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const statusConfig = {
  Pending:    { color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Processing: { color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Packed:     { color: 'bg-violet-50 text-violet-700 border-violet-200' },
  Shipped:    { color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  Delivered:  { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Cancelled:  { color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const STATUS_ACTIONS = {
  Pending:    [{ label: 'Accept Order',    next: 'Processing', style: 'bg-seller-primary text-white hover:opacity-90' },
               { label: 'Cancel Order',    next: 'Cancelled',  style: 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50' }],
  Processing: [{ label: 'Mark as Packed',  next: 'Packed',     style: 'bg-seller-primary text-white hover:opacity-90' }],
  Packed:     [{ label: 'Mark as Shipped', next: 'Shipped',    style: 'bg-seller-primary text-white hover:opacity-90' }],
  Shipped:    [{ label: 'Mark Delivered',  next: 'Delivered',  style: 'bg-emerald-600 text-white hover:bg-emerald-700' }],
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofTargetStatus, setProofTargetStatus] = useState(null);
  const [isPickupProof, setIsPickupProof] = useState(true);

  const fetchOrderDetail = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      if (data.success) setOrder(data.data);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrderDetail(); }, [id]);

  const handleStatusUpdate = async (nextStatus) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { status: nextStatus });
      await fetchOrderDetail();
      toast.success(`Order marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliveryStatusUpdate = async (nextStatus) => {
    if (nextStatus === 'Picked') {
      setProofTargetStatus(nextStatus);
      setIsPickupProof(true);
      setIsProofModalOpen(true);
      return;
    }
    if (nextStatus === 'Delivered') {
      setProofTargetStatus(nextStatus);
      setIsPickupProof(false);
      setIsProofModalOpen(true);
      return;
    }
    
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/seller-delivery-status`, { status: nextStatus });
      await fetchOrderDetail();
      toast.success(`Delivery marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update delivery status');
    } finally {
      setUpdating(false);
    }
  };

  const submitProof = async ({ images, video, otp }) => {
    setUpdating(true);
    try {
      const payload = { status: proofTargetStatus };
      if (proofTargetStatus === 'Picked') {
        payload.pickupProofImages = images;
        payload.pickupProofVideo = video;
      }
      if (proofTargetStatus === 'Delivered') {
        payload.deliveryProofImages = images;
        payload.otp = otp;
      }

      await api.put(`/orders/${id}/seller-delivery-status`, payload);
      await fetchOrderDetail();
      toast.success(`Delivery marked as ${proofTargetStatus}`);
      // Only close on success — keep the modal open on failure (e.g. wrong OTP)
      // so the seller can retry without re-uploading proof images.
      setIsProofModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to submit proof');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateOrPrintInvoice = async () => {
    setUpdating(true);
    try {
      toast.loading('Preparing invoice...', { id: 'pdf-download' });
      
      const authData = JSON.parse(localStorage.getItem('riddha_user') || '{}');
      const token = authData?.token || authData?.user?.token || '';
      const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
      const downloadUrl = `${API_BASE}/invoices/orders/${id}/invoice/seller`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      const invNum = order?.sellerInvoiceNumber ? order.sellerInvoiceNumber.replace(/\//g, '-') : id?.slice(-8).toUpperCase();
      a.download = `Seller_Invoice_${invNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success('Invoice downloaded!', { id: 'pdf-download' });
      fetchOrderDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to download invoice', { id: 'pdf-download' });
    } finally {
      setUpdating(false);
    }
  };

  const handleShareInvoice = async () => {
    setUpdating(true);
    try {
      toast.loading('Sharing invoice with Riddha...', { id: 'share' });
      const { data } = await api.post(`/invoices/orders/${id}/invoice/share`);
      if (data.success) {
        toast.success('Invoice shared successfully with Riddha!', { id: 'share' });
        fetchOrderDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share invoice', { id: 'share' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadLabel = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      toast.loading('Preparing shipping label & e-way bill...', { id: 'label-download' });
      
      const authData = JSON.parse(localStorage.getItem('riddha_user') || '{}');
      const token = authData?.token || authData?.user?.token || '';
      const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
      const downloadUrl = `${API_BASE}/invoices/orders/${id}/invoice/label`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `shipping_label_eway_bill_${id?.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success('E-Way Bill & Labels downloaded!', { id: 'label-download' });
    } catch (err) {
      toast.error(err.message || 'Failed to download labels. Please make sure invoice is shared.', { id: 'label-download' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-seller-primary rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading…</p>
        </div>
      </PageWrapper>
    );
  }

  if (!order) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Order not found</p>
          <button onClick={() => navigate('/seller/orders')} className="mt-3 text-seller-primary font-black text-xs underline uppercase">
            Return to Orders
          </button>
        </div>
      </PageWrapper>
    );
  }

  const steps = [
    { label: 'Placed',     status: 'Pending',    icon: FiBox,         date: order.createdAt },
    { label: 'Processing', status: 'Processing', icon: LuClock,       date: order.processingAt },
    { label: 'Packed',     status: 'Packed',     icon: LuPackage,     date: order.packedAt },
    { label: 'Shipped',    status: 'Shipped',    icon: LuTruck,       date: order.shippedAt },
    { label: 'Delivered',  status: 'Delivered',  icon: FiCheckCircle, date: order.deliveredAt },
  ];

  const statusOrder = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIdx = statusOrder.indexOf(order.status);
  const addr = order.shippingAddress || {};
  const actions = STATUS_ACTIONS[order.status] || [];
  const cfg = statusConfig[order.status] || statusConfig.Pending;

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto pb-10 space-y-4">

        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => navigate('/seller/orders')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-all">
              <LuArrowLeft size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Orders</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateOrPrintInvoice}
              disabled={updating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <LuDownload size={13} /> Download Invoice
            </button>
            
            {order?.sellerInvoiceShared ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 transition-all opacity-90 cursor-not-allowed"
              >
                Invoice Shared ✓
              </button>
            ) : (
              <button
                onClick={handleShareInvoice}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#189D91] border border-[#189D91] text-xs font-bold text-white hover:bg-[#137A71] transition-all disabled:opacity-50"
              >
                <LuShare2 size={13} /> Share Invoice
              </button>
            )}

            <button
              onClick={handleDownloadLabel}
              disabled={(!order?.labelDownloadEnabled && !order?.sellerInvoiceShared) || updating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                (!order?.labelDownloadEnabled && !order?.sellerInvoiceShared)
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={(!order?.labelDownloadEnabled && !order?.sellerInvoiceShared) ? 'Share invoice first to unlock shipping labels & E-Way bills' : 'Download shipping labels & E-Way bills'}
            >
              {(!order?.labelDownloadEnabled && !order?.sellerInvoiceShared) ? (
                <span className="text-[10px]">🔒</span>
              ) : (
                <LuDownload size={13} />
              )} Download Label
            </button>
          </div>
        </div>

        {/* Page grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT: products + stepper */}
          <div className="lg:col-span-2 space-y-4">

            {/* Order header */}
            <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order ID</p>
                  <h2 className="text-sm font-black text-slate-900 mt-0.5">#{order._id.slice(-8).toUpperCase()}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.color}`}>
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><LuCalendar size={9} /> Date</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{fmt(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><LuUser size={9} /> Customer</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{addr.fullName || 'Guest'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><LuCreditCard size={9} /> Payment</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5 capitalize">{order.paymentMethod}</p>
                  <span className={`text-[9px] font-black uppercase ${order.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">₹{order.totalPrice?.toLocaleString()}</p>
                </div>
                {order.deliveryTimeline?.expectedDeliveryTime && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><LuClock size={9} /> Est. Delivery</p>
                    <p className="text-xs font-bold text-indigo-700 mt-0.5">
                      {new Date(order.deliveryTimeline.expectedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-50">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                  Items ({order.orderItems?.length || 0})
                </p>
              </div>
              <div className="divide-y divide-slate-50">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-black text-slate-800 shrink-0">₹{item.price?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Order Total</span>
                <span className="text-sm font-black text-slate-900">₹{order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>

            {/* Stepper */}
            <div className="bg-white rounded-2xl border border-slate-100 px-5 py-5">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-5">Order Progress</p>
              <div className="relative">
                {/* horizontal line */}
                <div className="hidden sm:block absolute top-4 left-4 right-4 h-0.5 bg-slate-100 -z-0">
                  <div
                    className="h-full bg-seller-primary transition-all duration-700"
                    style={{ width: currentStepIdx >= 0 ? `${(currentStepIdx / (steps.length - 1)) * 100}%` : '0%' }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-between relative z-10 gap-4 sm:gap-0">
                  {steps.map((step, idx) => {
                    const done = idx <= currentStepIdx && currentStepIdx >= 0;
                    const StepIcon = step.icon;
                    return (
                      <div key={idx} className="flex sm:flex-col items-center gap-3 sm:gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 ${
                          done ? 'bg-seller-primary border-seller-primary text-white' : 'bg-white border-slate-200 text-slate-300'
                        }`}>
                          <StepIcon size={14} />
                        </div>
                        <div className="text-left sm:text-center">
                          <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${done ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                            {step.date ? fmt(step.date) : '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: info cards */}
          <div className="space-y-4">

            {/* Status actions */}
            {actions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Update Status</p>
                <div className="space-y-2">
                  {actions.map((action) => (
                    <button
                      key={action.next}
                      disabled={updating}
                      onClick={() => handleStatusUpdate(action.next)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${action.style} disabled:opacity-50`}
                    >
                      {updating ? <LuRefreshCw size={13} className="animate-spin" /> : <LuCheck size={13} />}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery actions (Seller Managed) */}
            {order.deliveryType === 'seller-managed' && !['Delivered', 'Cancelled'].includes(order.status) && (
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Self Delivery Updates</p>
                <div className="space-y-2">
                  {!['Picked', 'Out for Delivery', 'Delivered'].includes(order.deliveryStatus) && (
                    <button
                      disabled={updating}
                      onClick={() => handleDeliveryStatusUpdate('Picked')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {updating ? <LuRefreshCw size={13} className="animate-spin" /> : <LuPackage size={13} />}
                      Mark Picked (Upload Pickup Photos)
                    </button>
                  )}
                  {order.deliveryStatus === 'Picked' && (
                    <button
                      disabled={updating}
                      onClick={() => handleDeliveryStatusUpdate('Out for Delivery')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {updating ? <LuRefreshCw size={13} className="animate-spin" /> : <LuTruck size={13} />}
                      Mark Out for Delivery
                    </button>
                  )}
                  {order.deliveryStatus === 'Out for Delivery' && (
                    <button
                      disabled={updating}
                      onClick={() => handleDeliveryStatusUpdate('Delivered')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {updating ? <LuRefreshCw size={13} className="animate-spin" /> : <LuCheck size={13} />}
                      Mark Delivered (Enter OTP)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Shipping address */}
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <LuMapPin size={12} className="text-seller-primary" /> Shipping Address
              </p>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800">{addr.fullName || '—'}</p>
                <p className="font-semibold">{addr.address || '—'}</p>
                <p className="font-semibold">{[addr.city, addr.state].filter(Boolean).join(', ')}{addr.pincode ? ` - ${addr.pincode}` : ''}</p>
                {addr.phone && (
                  <p className="flex items-center gap-1 font-semibold text-slate-500">
                    <LuPhone size={10} /> {addr.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Payment summary */}
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Payment Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Subtotal</span>
                  <span className="font-bold text-slate-700">₹{(order.itemsPrice ?? order.totalPrice)?.toLocaleString()}</span>
                </div>
                {order.shippingPrice != null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Shipping</span>
                    <span className="font-bold text-slate-700">₹{order.shippingPrice?.toLocaleString()}</span>
                  </div>
                )}
                {order.taxPrice != null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Tax</span>
                    <span className="font-bold text-slate-700">₹{order.taxPrice?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-black text-slate-800">Total</span>
                  <span className="font-black text-slate-900">₹{order.totalPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Method</span>
                  <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${order.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {order.paymentMethod} · {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-4">
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Quick Actions</p>
              <div className="space-y-2">
                <button
                  onClick={handleGenerateOrPrintInvoice}
                  disabled={updating}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  <LuPrinter size={13} className="text-slate-400" /> {order?.invoiceUrl ? 'Print Invoice' : 'Generate Invoice'}
                </button>
                <button
                  onClick={handleDownloadLabel}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <LuDownload size={13} className="text-slate-400" /> Download Shipping Label
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isProofModalOpen && (
        <ProofUploadModal
          onClose={() => setIsProofModalOpen(false)}
          onSubmit={submitProof}
          isPickup={isPickupProof}
        />
      )}
    </PageWrapper>
  );
};

export default OrderDetail;
