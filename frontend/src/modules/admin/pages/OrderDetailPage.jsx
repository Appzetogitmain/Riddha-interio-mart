import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import {
  LuArrowLeft,
  LuPackage,
  LuTruck,
  LuClock,
  LuMapPin,
  LuUser,
  LuMail,
  LuPhone,
  LuCreditCard,
  LuPrinter,
  LuChevronDown
} from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const initialOrders = [
  {
    _id: "1",
    user: { fullName: "Rohan Sharma" },
    seller: { shopName: "Fresh Mart" },
    totalPrice: 15499,
    status: "Pending",
    createdAt: "2024-04-14",
    orderItems: [
      { name: "Carrara Marble Tiles", quantity: 2, price: 5000, image: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=400" }
    ],
    shippingAddress: { fullName: "Rohan Sharma", mobileNumber: "9999999999", pincode: "110001", city: "Delhi", fullAddress: "123 Main Street", landmark: "Near Park" },
    paymentMethod: "Online",
    isPaid: true,
    isDelivered: false,
    shippingPrice: 500
  },
  {
    _id: "2",
    user: { fullName: "Priya Patel" },
    seller: { shopName: "Daily Groceries" },
    totalPrice: 2499,
    status: "Processing",
    createdAt: "2024-04-14",
    orderItems: [
      { name: "Vitrified Tiles", quantity: 5, price: 2000, image: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=400" }
    ],
    shippingAddress: { fullName: "Priya Patel", mobileNumber: "9888888888", pincode: "400001", city: "Mumbai", fullAddress: "456 Oak Avenue", landmark: "Near Station" },
    paymentMethod: "Online",
    isPaid: true,
    isDelivered: false,
    shippingPrice: 600
  }
];

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/orders/${id}`);
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    // Update locally first
    setOrder(prev => ({ ...prev, status: newStatus }));

    try {
      const { data } = await api.put(`/orders/${id}/status`, { status: newStatus });
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      // Keep local update even if API fails
      console.log('Status updated locally to:', newStatus);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Received: 'bg-blue-100 text-blue-700 border-blue-200',
    Processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Shipped: 'bg-purple-100 text-purple-700 border-purple-200',
    "Out For Delivery": 'bg-orange-100 text-orange-700 border-orange-200',
    Delivered: 'bg-green-100 text-green-700 border-green-200',
    Cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-red-800 rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Decrypting Transaction...</p>
        </div>
      </PageWrapper>
    );
  }

  if (!order) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <p className="text-gray-400 font-bold uppercase tracking-widest">Transaction not found</p>
          <button onClick={() => navigate('/admin/orders/all')} className="mt-4 text-red-800 font-black text-xs underline uppercase italic">Return to pipeline</button>
        </div>
      </PageWrapper>
    );
  }

  const timeline = [
    { status: "Order Placed", date: new Date(order.createdAt).toLocaleString(), active: true },
    { status: "Processing", date: (order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') ? 'Internal Stage' : '', active: order.status !== 'Pending' },
    { status: "Shipped", date: (order.status === 'Shipped' || order.status === 'Delivered') ? 'Logistic Stage' : '', active: order.status === 'Shipped' || order.status === 'Delivered' },
    { status: "Delivered", date: order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : '', active: order.isDelivered }
  ];

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/orders/all')}
              className="p-3 bg-white rounded-2xl border border-soft-oatmeal text-warm-sand hover:text-deep-espresso hover:shadow-md transition-all"
            >
              <LuArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-deep-espresso">
                  ORD-{order._id.slice(-8).toUpperCase()}
                </h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-warm-sand mt-1 text-sm">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all text-xs uppercase tracking-widest"
              >
                Order Status
                <LuChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-soft-oatmeal rounded-xl shadow-lg z-50">
                  <div className="p-2">
                    {availableStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          handleStatusUpdate(status);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all mb-1 ${order.status === status
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-deep-espresso hover:bg-soft-oatmeal/20'
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="flex items-center gap-2 border border-soft-oatmeal text-deep-espresso px-5 py-2.5 rounded-xl font-bold hover:bg-soft-oatmeal/20 transition-all text-sm">
              <LuPrinter size={16} /> Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="bg-white rounded-2xl border border-soft-oatmeal overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-soft-oatmeal bg-soft-oatmeal/10 flex items-center gap-2">
                <LuPackage className="text-warm-sand" size={18} />
                <h3 className="font-bold text-deep-espresso">Ordered Items</h3>
              </div>
              <div className="divide-y divide-soft-oatmeal">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="p-6 flex items-center gap-6 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-soft-oatmeal/20 border border-soft-oatmeal relative flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-deep-espresso">{item.name}</h4>
                      <p className="text-sm text-warm-sand">Quantity: {item.quantity}</p>
                      {item.sellerType === 'Admin' && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-red-800/10 text-red-800 text-[8px] font-black uppercase tracking-widest rounded border border-red-800/20">
                          Direct Inventory
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-deep-espresso">₹{(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-xs text-warm-sand">₹{item.price.toLocaleString()} each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-soft-oatmeal/5 p-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-sand">Subtotal</span>
                  <span className="font-medium text-deep-espresso">₹{(order.itemsPrice || order.pricingBreakdown?.subtotal || order.totalPrice - (order.shippingPrice || 0) - (order.taxAmount || 0)).toLocaleString()}</span>
                </div>
                {(order.taxAmount > 0 || order.pricingBreakdown?.taxAmount > 0) && (
                  <>
                    {order.taxType === 'inter-state' ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-warm-sand">IGST</span>
                        <span className="font-medium text-deep-espresso">₹{(order.igst || order.pricingBreakdown?.igst || 0).toLocaleString()}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-warm-sand">CGST</span>
                          <span className="font-medium text-deep-espresso">₹{(order.cgst || order.pricingBreakdown?.cgst || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-warm-sand">SGST</span>
                          <span className="font-medium text-deep-espresso">₹{(order.sgst || order.pricingBreakdown?.sgst || 0).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
                {(order.taxAmount > 0 || order.pricingBreakdown?.taxAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-warm-sand">Total GST</span>
                    <span className="font-medium text-deep-espresso">₹{(order.taxAmount || order.pricingBreakdown?.taxAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                {(order.discountAmount > 0 || order.pricingBreakdown?.discountAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-warm-sand">Discount</span>
                    <span className="font-medium text-green-600">-₹{(order.discountAmount || order.pricingBreakdown?.discountAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-warm-sand">Shipping</span>
                  <span className="font-medium text-deep-espresso">₹{(order.shippingPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-soft-oatmeal">
                  <span className="font-bold text-deep-espresso">Total Amount</span>
                  <span className="font-black text-red-800">₹{order.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment & Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-deep-espresso border-b border-soft-oatmeal pb-3">
                  <LuCreditCard className="text-warm-sand" size={18} />
                  <h3 className="font-bold">Payment Method</h3>
                </div>
                <p className="text-sm text-deep-espresso font-bold uppercase tracking-wider">
                  {order.paymentMethod} Payment
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-bold text-green-600 uppercase tracking-widest">{order.isPaid ? 'Paid' : 'Pending'}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-deep-espresso border-b border-soft-oatmeal pb-3">
                  <LuMapPin className="text-warm-sand" size={18} />
                  <h3 className="font-bold">Shipping Address</h3>
                </div>
                <p className="text-sm text-deep-espresso leading-relaxed italic uppercase font-medium">
                  {order.shippingAddress ? (
                    <>
                      {order.shippingAddress.fullAddress}, {order.shippingAddress.landmark && `${order.shippingAddress.landmark}, `}
                      {order.shippingAddress.city} - {order.shippingAddress.pincode}
                    </>
                  ) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-8">
            {/* Customer Information */}
            <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-deep-espresso">
                <LuUser className="text-warm-sand" size={18} />
                <h3 className="font-bold">Customer Info</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-soft-oatmeal/10 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-deep-espresso flex items-center justify-center text-white font-black">
                    {(order.user?.fullName || "G").charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-deep-espresso text-sm">{order.user?.fullName || "Guest User"}</p>
                    <p className="text-[10px] text-warm-sand uppercase font-bold tracking-widest">Account Holder</p>
                  </div>
                </div>
                <div className="space-y-3 px-1">
                  <div className="flex items-center gap-3 text-xs text-deep-espresso font-medium">
                    <LuMail size={16} className="text-warm-sand" />
                    <span>{order.user?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-deep-espresso font-medium">
                    <LuPhone size={16} className="text-warm-sand" />
                    <span>{order.shippingAddress?.mobileNumber || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
              {/* Merchant info if exists */}
              {order.seller && (
              <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-deep-espresso border-b border-soft-oatmeal pb-3">
                  <LuPackage className="text-warm-sand" size={18} />
                  <h3 className="font-bold">Seller Information</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-deep-espresso">
                    {order.sellerType === 'Admin' ? 'Riddha Mart (Admin)' : (order.seller.shopName || order.seller.fullName || "Official Store")}
                  </p>
                  {order.sellerType === 'Admin' && (
                    <span className="inline-block px-2 py-0.5 bg-red-800/10 text-red-800 text-[9px] font-black uppercase tracking-widest rounded border border-red-800/20">
                      Mart Direct
                    </span>
                  )}
                  <p className="text-xs text-warm-sand">{order.seller.email}</p>
                </div>
              </div>
            )}

            {/* Seller Invoice (Bill A) Card */}
            <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-deep-espresso border-b border-soft-oatmeal pb-3">
                <LuPrinter className="text-warm-sand" size={18} />
                <h3 className="font-bold">Seller Invoice (Bill A)</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-warm-sand">Sharing Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    order.sellerInvoiceShared 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                    {order.sellerInvoiceShared ? 'Received ✓' : 'Pending'}
                  </span>
                </div>
                {order.sellerInvoiceSharedAt && (
                  <p className="text-[10px] text-warm-sand">
                    Received: {new Date(order.sellerInvoiceSharedAt).toLocaleString()}
                  </p>
                )}
                
                {order.sellerInvoiceShared ? (
                  <button
                    onClick={async () => {
                      try {
                        const authData = JSON.parse(localStorage.getItem('riddha_user') || '{}');
                        const token = authData?.token || authData?.user?.token || '';
                        const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
                        const downloadUrl = `${API_BASE}/invoices/orders/${order._id}/invoice/seller`;
                        
                        const response = await fetch(downloadUrl, {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                        });

                        if (!response.ok) {
                          throw new Error('Failed to download invoice');
                        }

                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        const invNum = order.sellerInvoiceNumber ? order.sellerInvoiceNumber.replace(/\//g, '-') : order._id;
                        a.download = `Seller_Invoice_${invNum}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (err) {
                        console.error('Failed to download seller invoice:', err);
                      }
                    }}
                    className="w-full py-2.5 bg-[#189D91] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#137A71] transition-all flex items-center justify-center gap-2"
                  >
                    <LuPrinter size={14} /> Download Bill A
                  </button>
                ) : (
                  <p className="text-[10px] text-warm-sand italic text-center py-2">
                    Waiting for seller to generate and share invoice.
                  </p>
                )}
              </div>
            </div>

            {/* Customer Invoice (Bill C) Card */}
            <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-deep-espresso border-b border-soft-oatmeal pb-3">
                <LuPrinter className="text-warm-sand" size={18} />
                <h3 className="font-bold">Customer Invoice (Bill C)</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-warm-sand">Email Delivery:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    order.customerInvoiceSentStatus === 'sent' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : order.customerInvoiceSentStatus === 'failed'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                    {order.customerInvoiceSentStatus || 'pending'}
                  </span>
                </div>
                {order.customerInvoiceSentAt && (
                  <p className="text-[10px] text-warm-sand">
                    Sent at: {new Date(order.customerInvoiceSentAt).toLocaleString()}
                  </p>
                )}
                
                <button
                  onClick={async () => {
                    try {
                      const authData = JSON.parse(localStorage.getItem('riddha_user') || '{}');
                      const token = authData?.token || authData?.user?.token || '';
                      const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
                      const downloadUrl = `${API_BASE}/invoices/orders/${order._id}/invoice/customer`;
                      
                      const response = await fetch(downloadUrl, {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      });

                      if (!response.ok) {
                        throw new Error('Failed to download invoice');
                      }

                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                      const a = document.createElement('a');
                      a.href = blobUrl;
                      const invNum = order.marketplaceInvoiceNumber ? order.marketplaceInvoiceNumber.replace(/\//g, '-') : order._id;
                      a.download = `Customer_Invoice_${invNum}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(blobUrl);
                    } catch (err) {
                      console.error('Failed to download customer invoice:', err);
                    }
                  }}
                  className="w-full py-2.5 bg-red-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-900 transition-all flex items-center justify-center gap-2"
                >
                  <LuPrinter size={14} /> Download Bill C
                </button>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-deep-espresso">
                <LuClock className="text-warm-sand" size={18} />
                <h3 className="font-bold">Order Timeline</h3>
              </div>
              <div className="relative space-y-8 before:absolute before:inset-0 before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-soft-oatmeal">
                {timeline.map((step, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center z-10 ${step.active ? 'bg-red-800 text-white shadow-lg shadow-red-800/20' : 'bg-soft-oatmeal text-warm-sand'}`}>
                      {step.active && idx === timeline.filter(t => t.active).length - 1 ? (
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                      ) : (
                        <FiCheckCircle size={12} />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${step.active ? 'text-deep-espresso' : 'text-warm-sand'}`}>{step.status}</p>
                      {step.date && <p className="text-[10px] text-warm-sand font-medium mt-0.5">{step.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default OrderDetailPage;
