import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '../components/PageWrapper';
import OrderCard from '../components/OrderCard';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';
import { LuPackage, LuCalendar, LuFilter, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { toast } from 'react-hot-toast';

const DeliveryHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // UI filter state (controlled inputs — doesn't trigger API until "Filter" is clicked)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Applied filter state (drives the API call)
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedEnd, setAppliedEnd] = useState('');

  const isFilterActive = appliedStart || appliedEnd;

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10, deliveryStatus: 'Delivered' });
      if (appliedStart) params.append('startDate', appliedStart);
      if (appliedEnd)   params.append('endDate', appliedEnd);

      const res = await api.get(`/orders?${params.toString()}`);
      if (res.data.success) {
        const formattedOrders = res.data.data.map(o => ({
          id: o._id,
          status: o.deliveryStatus || o.status,
          sellerLocation: o.seller?.shopAddress || 'Central Warehouse',
          customerName: o.user?.fullName || 'Customer',
          address: o.shippingAddress ? `${o.shippingAddress.fullAddress}, ${o.shippingAddress.city}` : 'No address',
          items: o.orderItems || [],
          totalBill: o.totalPrice,
          dateTime: new Date(o.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          paymentMode: o.paymentMethod,
          phone: o.shippingAddress?.phone || o.user?.phone || ''
        }));
        setOrders(formattedOrders);
        setTotalPages(res.data.totalPages || 1);
        setTotalResults(res.data.totalResults || 0);
      }
    } catch (err) {
      console.error('Failed to fetch delivery history', err);
      toast.error('Failed to load delivery history');
    } finally {
      setLoading(false);
    }
  }, [page, appliedStart, appliedEnd]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilter = (e) => {
    e.preventDefault();
    if (!startDate && !endDate) { toast.error('Please select at least one date to filter.'); return; }
    if (startDate && endDate && startDate > endDate) { toast.error('Start date cannot be after end date.'); return; }
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setPage(1);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStart('');
    setAppliedEnd('');
    setPage(1);
  };

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-deep-espresso">Delivery History</h1>
            <p className="text-warm-sand mt-2">
              View your completed deliveries ({totalResults} total)
              {isFilterActive && (
                <span className="ml-2 text-[10px] font-bold text-[#189D91] bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Filtered
                </span>
              )}
            </p>
          </div>
          
          <form onSubmit={handleFilter} className="flex flex-col sm:flex-row sm:items-end gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            {/* From date */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <LuCalendar size={10} className="text-[#189D91]" /> From
              </label>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${startDate ? 'bg-teal-50 border-[#189D91]/30' : 'bg-slate-50 border-transparent'}`}>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                />
              </div>
            </div>

            <span className="hidden sm:block text-slate-300 font-bold pb-2.5">→</span>

            {/* To date */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <LuCalendar size={10} className="text-[#189D91]" /> To
              </label>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${endDate ? 'bg-teal-50 border-[#189D91]/30' : 'bg-slate-50 border-transparent'}`}>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 sm:pb-0">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#189D91] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#15877c] active:scale-95 transition-all shadow-md shadow-[#189D91]/20"
              >
                <LuFilter size={14} /> Filter
              </button>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#189D91] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {orders.length > 0 ? (
                  orders.map(order => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <OrderCard order={order} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 text-center space-y-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm"
                  >
                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-[#189D91]">
                      <LuPackage size={36} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-deep-espresso">No deliveries found</h3>
                      <p className="text-sm text-dusty-cocoa max-w-sm mx-auto mt-2">
                        You have no completed deliveries matching the current date filter.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                    page === 1 
                      ? 'bg-white text-slate-300 border border-slate-100 cursor-not-allowed' 
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-[#189D91] hover:text-[#189D91]'
                  }`}
                >
                  <LuChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">Page {page}</span>
                  <span className="text-sm font-medium text-slate-400">of {totalPages}</span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                    page === totalPages 
                      ? 'bg-white text-slate-300 border border-slate-100 cursor-not-allowed' 
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-[#189D91] hover:text-[#189D91]'
                  }`}
                >
                  <LuChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default DeliveryHistory;
