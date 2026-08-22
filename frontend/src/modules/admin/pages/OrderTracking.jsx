import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  LuMapPin, LuSearch, LuTruck, LuPackage, LuCircleCheck, LuNavigation, LuX, LuExternalLink,
  LuRefreshCw, LuWifi, LuWifiOff, LuClock, LuFileText
} from 'react-icons/lu';
import api from '../../../shared/utils/api';

const POLL_INTERVAL = 15000; // 15 seconds

const OrderTracking = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef(null);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsPolling(true);

      const res = await api.get('/orders');
      const activeOrders = res.data.data.filter(o => 
        ['Shipped', 'Out for Delivery', 'Processing'].includes(o.status) || 
        (o.deliveryBoy && o.deliveryStatus !== 'None' && o.status !== 'Delivered')
      );
      setOrders(activeOrders);
      setLastSync(new Date());

      // If a modal is open, also refresh the selected order live data
      if (selectedOrder) {
        const refreshed = activeOrders.find(o => o._id === selectedOrder._id);
        if (refreshed) setSelectedOrder(refreshed);
      }
    } catch (err) {
      console.error('Failed to fetch orders for tracking:', err);
      if (!silent) toast.error('Failed to load tracking data');
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  };

  // Initial fetch + 15-second polling
  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(() => fetchOrders(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  const filteredOrders = orders.filter(o => 
    o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenMap = (order) => {
    setSelectedOrder(order);
    setShowMap(true);
  };

  /**
   * Priority 1: Use the courier's real GPS coordinates if available and recent (< 30 min old)
   * Priority 2: Fall back to the delivery address text search
   */
  const getMapConfig = (order) => {
    if (!order) return { url: '', isLive: false };

    const loc = order.deliveryBoy?.currentLocation;
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    if (
      loc &&
      typeof loc.latitude === 'number' &&
      typeof loc.longitude === 'number' &&
      loc.updatedAt &&
      new Date(loc.updatedAt) > thirtyMinsAgo
    ) {
      // Real-time GPS embed — shows the courier's actual live position
      const url = `https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      return { url, isLive: true, lat: loc.latitude, lng: loc.longitude, updatedAt: loc.updatedAt };
    }

    // Fallback: show delivery destination on map
    const address = `${order.shippingAddress?.fullAddress || ''} ${order.shippingAddress?.city || ''} ${order.shippingAddress?.pincode || ''}`;
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    return { url, isLive: false };
  };

  const formatLastSync = (date) => {
    if (!date) return 'Never';
    const diff = Math.round((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  const mapConfig = selectedOrder ? getMapConfig(selectedOrder) : { url: '', isLive: false };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <LuNavigation className="text-[var(--color-primary)]" size={20} /> Live Order Tracking
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Active shipment telemetry · Auto-refreshes every 15s
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live Sync Indicator */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              {isPolling ? (
                <LuRefreshCw size={13} className="text-[var(--color-primary)] animate-spin" />
              ) : (
                <LuWifi size={13} className="text-emerald-500" />
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Synced {formatLastSync(lastSync)}
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search Order ID or Customer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 focus:bg-white focus:outline-none focus:border-[var(--color-primary)] transition-all text-xs font-semibold text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-slate-100 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">Syncing logistics coordinates...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center shadow-sm">
             <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-slate-400">
                <LuNavigation size={22} />
             </div>
             <h3 className="text-sm font-bold text-slate-800 mb-1">No active shipments in transit</h3>
             <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">All active order cycles are currently settled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map((order) => {
              const hasLiveGps = (() => {
                const loc = order.deliveryBoy?.currentLocation;
                const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
                return loc && typeof loc.latitude === 'number' && loc.updatedAt && new Date(loc.updatedAt) > thirtyMinsAgo;
              })();

              return (
                <div
                  key={order._id}
                  onClick={() => navigate(`/admin/orders/view/${order._id}`)}
                  className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-300 group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-teal-50 text-[var(--color-primary)] rounded-lg flex items-center justify-center">
                          <LuTruck size={16} />
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 leading-none">Order ID</p>
                          <h3 className="text-xs font-bold text-slate-800 mt-1">#{order.orderId || order._id.slice(-8).toUpperCase()}</h3>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        order.status === 'Shipped' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-amber-50 text-amber-600 border-amber-100/50'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-[11px] leading-tight">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Receiver</p>
                        <p className="font-semibold text-slate-700 truncate">{order.user?.fullName || 'Guest User'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Dispatcher</p>
                        <p className="font-semibold text-slate-700 truncate">{order.deliveryBoy?.fullName || 'Awaiting Partner'}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 mb-4 flex items-start gap-2">
                      <LuMapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Delivery Address</p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                          {order.shippingAddress?.fullAddress}, {order.shippingAddress?.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* GPS Status + Track Button */}
                  <div className="space-y-2">
                    {/* GPS Quality Indicator */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                      hasLiveGps 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasLiveGps ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      {hasLiveGps ? 'Live GPS Available' : 'GPS Unavailable · Address Only'}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenMap(order); }}
                        className="w-full py-2 bg-[var(--color-primary)] hover:opacity-90 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                      >
                        <LuMapPin size={13} />
                        {hasLiveGps ? 'Live Map' : 'Map'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/view/${order._id}`); }}
                        className="w-full py-2 bg-white border border-slate-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-slate-600 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                      >
                        <LuFileText size={13} />
                        Full Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Map Modal */}
      <AnimatePresence>
        {showMap && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMap(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[75vh] border border-slate-200"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center shadow-sm">
                    <LuNavigation size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-none">
                      Tracking <span className="text-[var(--color-primary)]">#{selectedOrder.orderId || selectedOrder._id.slice(-8).toUpperCase()}</span>
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                      {mapConfig.isLive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Courier GPS · Updates every 15s
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Destination Map · Courier GPS not broadcasting
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMap(false)}
                  className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <LuX size={18} />
                </button>
              </div>

              {/* Map View */}
              <div className="flex-1 bg-slate-50 relative">
                <iframe
                  title="Live Tracking Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={mapConfig.url}
                  className="filter grayscale-[0.05]"
                />
                
                {/* Floating Info Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row gap-3">
                  <div className="bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200/60 flex-1 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-teal-50 text-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0">
                      <LuMapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Destination Address</p>
                      <p className="text-[11px] font-bold text-slate-700 truncate">{selectedOrder.shippingAddress?.fullAddress}, {selectedOrder.shippingAddress?.city}</p>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg shadow-lg flex items-center gap-3 sm:min-w-[240px] shrink-0 ${mapConfig.isLive ? 'bg-slate-900 text-white' : 'bg-amber-50 border border-amber-100'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mapConfig.isLive ? 'bg-white/10' : 'bg-amber-100'}`}>
                      <LuTruck size={16} className={mapConfig.isLive ? 'text-white' : 'text-amber-600'} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[8px] font-bold uppercase tracking-wider ${mapConfig.isLive ? 'text-slate-300' : 'text-amber-600'}`}>
                        {mapConfig.isLive ? 'Courier Position' : 'No Live GPS'}
                      </p>
                      <p className={`text-[11px] font-bold truncate ${mapConfig.isLive ? 'text-white' : 'text-amber-700'}`}>
                        {mapConfig.isLive 
                          ? `${selectedOrder.deliveryBoy?.fullName || 'En Route'}`
                          : 'Partner not broadcasting'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default OrderTracking;
