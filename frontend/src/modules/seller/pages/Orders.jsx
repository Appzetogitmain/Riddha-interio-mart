import React, { useState, useEffect } from "react";
import PageWrapper from "../components/PageWrapper";
import {
  Search,
  Filter,
  Eye,
  Clock,
  Package,
  Truck,
  User,
  X,
  CheckCircle2,
  XCircle,
  MapPin,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Download,
  MoreVertical,
  Activity,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import OrderCard from "../components/OrderCard";
import { toast } from "react-hot-toast";

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState('select-type');
  const [activeTab, setActiveTab] = useState('All');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const exportToExcel = async () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders available to export.");
      return;
    }
    try {
      // xlsx is CommonJS — unwrap .default when imported via ESM/Vite
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default ?? xlsxModule;
      const dataToExport = filteredOrders.map(order => ({
        'Order ID': order._id ? `#ORD-${order._id.slice(-8).toUpperCase()}` : '-',
        'Date': new Date(order.createdAt).toLocaleDateString('en-GB'),
        'Customer Name': order.shippingAddress?.fullName || 'Guest',
        'City': order.shippingAddress?.city || '-',
        'Total Price (₹)': order.totalPrice || 0,
        'Payment Method': order.paymentMethod || '-',
        'Status': order.status || '-'
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, `Seller_Orders_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      toast.success("Orders exported successfully!");
    } catch (err) {
      console.error('Failed to export orders:', err);
      toast.error('Failed to export orders report.');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders');
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/orders');
      if (data.success) {
        setOrders(data.data || []);
        toast.success('Orders refreshed');
      }
    } catch (err) {
      toast.error('Failed to refresh orders');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAvailableDeliveryBoys = async () => {
    try {
      const { data } = await api.get('/delivery/available');
      if (data.success) {
        setDeliveryBoys(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch partners:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAvailableDeliveryBoys();
    
    const onNewOrder = () => fetchOrders();
    window.addEventListener('seller:new-order', onNewOrder);
    return () => window.removeEventListener('seller:new-order', onNewOrder);
  }, []);

  const handleAssignInit = (order) => {
    setSelectedOrderForAssign(order);
    setAssignmentMode('select-type');
    setShowAssignModal(true);
  };

  const handleInAppSelect = async () => {
    setAssignmentMode('in-app');
    try {
      const { data } = await api.get(`/delivery/available?pincode=${selectedOrderForAssign?.shippingAddress?.pincode || ''}`);
      if (data.success) {
        setDeliveryBoys(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch delivery boys:', err);
    }
  };

  const handleSellerManagedSelect = async () => {
    setAssigning(true);
    try {
      const { data } = await api.put(`/orders/${selectedOrderForAssign._id}/assign-delivery`, {
        deliveryType: 'seller-managed'
      });
      if (data.success) {
        setShowAssignModal(false);
        fetchOrders();
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Assignment failed. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignProcess = async (dbId) => {
    setAssigning(true);
    try {
      const { data } = await api.put(`/orders/${selectedOrderForAssign._id}/assign-delivery`, {
        deliveryBoyId: dbId,
        deliveryType: 'in-app'
      });
      if (data.success) {
        setShowAssignModal(false);
        fetchOrders();
      }
    } catch (err) {
      console.error('Assignment failed:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Assignment failed. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || order.status === activeTab;
    
    let matchesDate = true;
    if (startDate) {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0,0,0,0);
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      matchesDate = matchesDate && (orderDate >= start);
    }
    if (endDate) {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(23,59,59,999);
      const end = new Date(endDate);
      end.setHours(23,59,59,999);
      matchesDate = matchesDate && (orderDate <= end);
    }
    return matchesSearch && matchesTab && matchesDate;
  });

  const tabs = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Shipped': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        
        {/* Header Section - Compact */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage partner transactions</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active</p>
                <p className="text-lg font-black text-slate-900 leading-none">{orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}</p>
              </div>
              <div className="w-8 h-8 bg-seller-primary/10 rounded-lg flex items-center justify-center text-seller-primary">
                <Activity size={16} />
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh orders"
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-seller-primary hover:border-seller-primary hover:bg-seller-primary/5 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Status Tabs - Compact */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-seller-primary text-white shadow-md shadow-seller-primary/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Actions Toolbar - Ultra Compact */}
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <div className="relative flex-grow w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-seller-primary transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-seller-primary/30 focus:ring-4 focus:ring-seller-primary/5 transition-all text-[11px] font-bold"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <div className="flex-1 md:flex-none flex items-center gap-1">
              <button
                onClick={() => setShowRangeModal(true)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm ${startDate || endDate ? 'border-seller-primary text-seller-primary ring-2 ring-seller-primary/10' : 'border-slate-200 text-slate-700'}`}
              >
                <Calendar size={12} />
                {startDate || endDate ? 'Filter Active' : 'Range'}
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  title="Clear date filter"
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-seller-primary/10 text-seller-primary hover:bg-seller-primary hover:text-white transition-all shadow-sm shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={exportToExcel}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-seller-primary text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20"
            >
              <Download size={12} />
              Export
            </button>
          </div>
        </div>

        {/* Orders Content */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center space-y-3">
               <div className="w-8 h-8 border-4 border-slate-100 border-t-seller-primary rounded-full animate-spin mx-auto"></div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">No orders found</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Try another filter</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden p-3 space-y-2.5">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onClick={() => navigate(`/seller/orders/${order._id}`)}
                    onAssign={handleAssignInit}
                  />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-seller-primary/10 group-hover:text-seller-primary transition-all">
                              <Clock size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 leading-none">#{order._id.slice(-8).toUpperCase()}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-seller-light flex items-center justify-center text-seller-primary font-black text-[10px] border border-seller-primary/10">
                              {String(order.shippingAddress?.fullName || "G").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{order.shippingAddress?.fullName}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{order.shippingAddress?.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-xs font-black text-slate-900">₹{order.totalPrice.toLocaleString()}</p>
                          <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">{order.paymentMethod}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${getStatusStyles(order.status)}`}>
                            <div className="w-1 h-1 rounded-full bg-current" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/seller/orders/${order._id}`)}
                              className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-seller-primary hover:border-seller-primary rounded-lg transition-all shadow-sm"
                            >
                              <Eye size={14} />
                            </button>
                            {order.status === 'Processing' && !order.deliveryBoy && (
                              <button
                                onClick={() => handleAssignInit(order)}
                                className="p-2 bg-seller-primary text-white rounded-lg hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20"
                                title="Assign Partner"
                              >
                                <Truck size={14} />
                              </button>
                            )}
                            {order.deliveryBoy && (
                              <div className="flex items-center gap-1.5 p-1.5 px-3 bg-seller-light/50 rounded-lg border border-seller-primary/20" title={`Delivery Partner: ${order.deliveryBoy?.fullName || 'Assigned'}`}>
                                 <Truck size={12} className="text-seller-primary" />
                                 <span className="text-[9px] font-black text-seller-primary uppercase tracking-widest">{order.deliveryStatus || 'Assigned'}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Assignment Modal Overlay */}
        <AnimatePresence>
          {showAssignModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAssignModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden z-10 border border-slate-100"
                onClick={e => e.stopPropagation()}
              >
                {assignmentMode === 'select-type' ? (
                  <>
                    <div className="px-5 py-4 md:p-8 border-b border-slate-50 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">Delivery Method</h3>
                        <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">Order #{selectedOrderForAssign?._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} className="text-slate-400" />
                      </button>
                    </div>
                    <div className="p-5 md:p-8 space-y-4">
                      {/* Option 1: In App Delivery */}
                      <button
                        onClick={handleInAppSelect}
                        className="w-full p-5 rounded-2xl border border-slate-200 hover:border-seller-primary/50 transition-all flex items-center gap-4 group text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-seller-primary/10 text-seller-primary flex items-center justify-center group-hover:bg-seller-primary group-hover:text-white transition-all shrink-0">
                          <Truck size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">In-App Delivery Network</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Assign to available delivery boys in your region</p>
                        </div>
                      </button>
                      
                      {/* Option 2: Seller Managed */}
                      <button
                        onClick={handleSellerManagedSelect}
                        disabled={assigning}
                        className="w-full p-5 rounded-2xl border border-slate-200 hover:border-seller-primary/50 transition-all flex items-center gap-4 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-all shrink-0">
                          <User size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Self / Seller-Managed</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">You will manage this delivery and update status manually</p>
                        </div>
                      </button>

                      {/* Option 3: Shiprocket */}
                      <button
                        disabled
                        className="w-full p-5 rounded-2xl border border-slate-200 opacity-60 bg-slate-50 flex items-center gap-4 text-left cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                          <Package size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Shiprocket</h4>
                            <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-2 py-1 rounded-md uppercase">Pending</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Automated shipping via Shiprocket API</p>
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-5 py-4 md:p-8 border-b border-slate-50 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">Assign Partner</h3>
                        <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">Available partners in your region</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAssignmentMode('select-type')} className="px-3 py-1.5 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Back
                        </button>
                        <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                          <X size={20} className="text-slate-400" />
                        </button>
                      </div>
                    </div>

                    <div className="px-4 py-3 md:p-8 max-h-[55vh] overflow-y-auto custom-scrollbar space-y-2.5 md:space-y-4">
                      {deliveryBoys.length === 0 ? (
                        <div className="text-center py-8 space-y-3">
                           <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                              <User size={28} />
                           </div>
                           <p className="text-sm font-bold text-slate-400">No active delivery partners online.</p>
                        </div>
                      ) : deliveryBoys.map((boy) => (
                        <div
                          key={boy._id}
                          className="p-3.5 md:p-5 rounded-xl md:rounded-3xl border border-slate-100 hover:border-seller-primary/30 hover:bg-seller-light/10 transition-all flex items-center justify-between group cursor-pointer"
                          onClick={() => handleAssignProcess(boy._id)}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-seller-primary flex items-center justify-center text-white relative border-2 border-white shadow-sm shrink-0">
                              <User size={17} />
                              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{boy.fullName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{boy.vehicleType}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-[10px] font-bold text-slate-400">{boy.phone}</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-seller-primary group-hover:text-white transition-all shrink-0">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 py-3 md:p-8 bg-slate-50/50 border-t border-slate-100 text-center">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Partner selection is prioritized by real-time distance and capacity.</p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Date Range Modal */}
        <AnimatePresence>
          {showRangeModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRangeModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden z-10 border border-slate-100"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-5 py-4 md:p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight">Select Date Range</h3>
                    <p className="text-xs md:text-sm font-medium text-slate-500 mt-0.5">Filter orders by transaction date</p>
                  </div>
                  <button onClick={() => setShowRangeModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="px-5 py-4 md:p-8 space-y-4 md:space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block pl-1">Start Date</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-seller-primary/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block pl-1">End Date</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-seller-primary/30 transition-all"
                    />
                  </div>
                </div>

                <div className="px-5 py-4 md:p-8 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setShowRangeModal(false);
                    }}
                    className="flex-1 py-3 md:py-4 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Reset & Clear
                  </button>
                  <button
                    onClick={() => setShowRangeModal(false)}
                    className="flex-1 py-3 md:py-4 bg-seller-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20"
                  >
                    Apply Filter
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default Orders;
