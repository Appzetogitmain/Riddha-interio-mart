import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  FiSearch, 
  FiAlertCircle, 
  FiArrowUp, 
  FiPackage, 
  FiTrendingDown, 
  FiShoppingCart, 
  FiClock, 
  FiPlus, 
  FiMinus, 
  FiActivity, 
  FiDatabase, 
  FiCalendar, 
  FiRefreshCw, 
  FiX, 
  FiCheckCircle 
} from 'react-icons/fi';
import api from '../../../shared/utils/api';

const StockManagement = () => {
  const [products, setProducts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, low, out
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'reservations'

  // Inline adjustment state
  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustmentValue, setAdjustmentValue] = useState('');

  // History Drawer State
  const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Batch adjustment modal state
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchInput, setBatchInput] = useState(''); // "SKU,QTY\nSKU,QTY"
  const [batchResults, setBatchResults] = useState(null);

  useEffect(() => {
    fetchStockData();
    if (activeTab === 'reservations') {
      fetchReservations();
    }
  }, [activeTab]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/admin/stock-status');
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/admin/inventory/reservations');
      setReservations(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (productId, currentStock) => {
    if (!adjustmentValue || isNaN(adjustmentValue)) {
      alert('Please enter a valid stock delta (e.g. 10 or -5)');
      return;
    }

    const delta = parseInt(adjustmentValue);
    if (currentStock + delta < 0) {
      alert('Total stock quantity cannot fall below zero!');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.put(`/auth/admin/inventory/adjust/${productId}`, {
        quantityDelta: delta
      });

      if (response.data.success) {
        // Update local state atomically
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, countInStock: response.data.data.countInStock } : p));
        setAdjustingId(null);
        setAdjustmentValue('');
      }
    } catch (err) {
      console.error('Failed to adjust stock level:', err);
      alert(err.response?.data?.error || 'Failed to update stock quantity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchAdjust = async () => {
    if (!batchInput.trim()) {
      alert('Please enter SKU and quantity delta pairs.');
      return;
    }

    const lines = batchInput.trim().split('\n');
    const adjustments = [];

    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length !== 2) {
        alert(`Invalid line format: "${line}". Must be SKU,QTY (e.g., TLE-MAR-001,15)`);
        return;
      }
      const sku = parts[0].trim();
      const delta = parseInt(parts[1].trim());
      if (!sku || isNaN(delta)) {
        alert(`Invalid quantity delta in line: "${line}"`);
        return;
      }
      adjustments.push({ sku, quantityDelta: delta });
    }

    try {
      setSubmitting(true);
      const response = await api.post('/auth/admin/inventory/batch-adjust', { adjustments });
      if (response.data.success) {
        setBatchResults(response.data.data);
        fetchStockData();
      }
    } catch (err) {
      console.error('Failed to execute batch stock adjustment:', err);
      alert(err.response?.data?.error || 'Batch adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async (product) => {
    setSelectedProductForHistory(product);
    setHistoryLogs([]);
    setLoadingHistory(true);
    try {
      const response = await api.get(`/auth/admin/inventory/history/${product._id}`);
      setHistoryLogs(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch history logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'low') return matchesSearch && p.countInStock > 0 && p.countInStock <= 10;
    if (filter === 'out') return matchesSearch && p.countInStock === 0;
    return matchesSearch;
  });

  const stats = {
    totalItems: products.length,
    lowStock: products.filter(p => p.countInStock > 0 && p.countInStock <= 10).length,
    outOfStock: products.filter(p => p.countInStock === 0).length,
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FiPackage className="text-[#189D91]" size={24} /> Stock & Inventory System
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monitor available reserves, holds, and dynamic batch updates</p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">

            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/60 flex">
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'inventory' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/30' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Stock levels
              </button>
              <button 
                onClick={() => setActiveTab('reservations')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'reservations' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/30' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Checkout Holds
              </button>
            </div>
          </div>
        </div>

        {/* Tab view logic */}
        {activeTab === 'inventory' ? (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Catalog Items */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all duration-300">
                <div className="w-12 h-12 bg-teal-50 text-[#189D91] rounded-2xl flex items-center justify-center shrink-0 border border-teal-100/50">
                  <FiPackage size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">Cataloged Items</p>
                  <h3 className="text-xl font-black text-slate-800 mt-1.5">{stats.totalItems}</h3>
                </div>
              </div>

              {/* Low Stock Warning */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-l-4 border-l-amber-500 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all duration-300">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100/50">
                  <FiAlertCircle size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-amber-600/70 leading-none">Low Stock Warnings</p>
                  <h3 className="text-xl font-black text-amber-600 mt-1.5">{stats.lowStock}</h3>
                </div>
              </div>

              {/* Out of Stock */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-l-4 border-l-rose-600 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all duration-300">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100/50">
                  <FiTrendingDown size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-rose-600/70 leading-none">Depleted Stock Out</p>
                  <h3 className="text-xl font-black text-rose-600 mt-1.5">{stats.outOfStock}</h3>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[450px]">
              {/* Toolbar Search Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={15} />
                  <input 
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#189D91] transition-all placeholder-slate-400"
                  />
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 w-fit">
                  {[
                    { label: 'All Levels', value: 'all' },
                    { label: 'Low Stock', value: 'low' },
                    { label: 'Out of Stock', value: 'out' }
                  ].map((x) => (
                    <button
                      key={x.value}
                      onClick={() => setFilter(x.value)}
                      className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        filter === x.value 
                          ? 'bg-slate-800 text-white shadow-sm' 
                          : 'text-slate-450 hover:text-slate-800 hover:bg-slate-200/60'
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30">
                      <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150">Product Details</th>
                      <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150">Seller</th>
                      <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 text-center">Status</th>
                      <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 text-center">Stock Reserves</th>
                      <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 text-right">In Stock</th>
                      <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="6" className="px-5 py-6">
                            <div className="flex gap-4 items-center">
                              <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                              <div className="space-y-2.5 flex-1">
                                <div className="h-4 bg-slate-100 rounded w-1/4" />
                                <div className="h-3 bg-slate-100 rounded w-1/6" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => {
                        const isLow = product.countInStock > 0 && product.countInStock <= 10;
                        const isOut = product.countInStock === 0;
                        const reservedCount = product.reservedStock || 0;
                        const availableStock = product.countInStock - reservedCount;

                        return (
                          <tr key={product._id} className="hover:bg-slate-50/40 transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                  <img 
                                    src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 text-xs truncate max-w-[280px]">{product.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-bold text-slate-400 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded uppercase font-mono">
                                      {product.sku || 'NO-SKU'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 italic">
                                      {product.brand?.name || 'Local Partner'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                  <FiShoppingCart size={11} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{product.seller?.shopName || 'Admin Hub'}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{product.sellerType || 'Internal'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {isOut ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-rose-100/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Critical Low
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Healthy
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-slate-700 font-mono">
                                  {reservedCount} <span className="text-[9px] font-semibold text-slate-400">Holds</span>
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                  {availableStock} Avail
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="text-xs font-black text-slate-800 font-mono">
                                {product.countInStock}
                                <span className="text-[9px] font-bold text-slate-400 ml-1 uppercase tracking-wider opacity-60">Units</span>
                              </div>
                              {isLow && <p className="text-[8px] font-bold text-amber-500/80 mt-1.5 uppercase tracking-tight">Needs Restock</p>}
                              {isOut && <p className="text-[8px] font-bold text-rose-500/80 mt-1.5 uppercase tracking-tight">Depleted</p>}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {adjustingId === product._id ? (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <input 
                                    type="text"
                                    placeholder="+10 or -5"
                                    value={adjustmentValue}
                                    onChange={(e) => setAdjustmentValue(e.target.value)}
                                    className="w-16 bg-slate-50 border border-slate-350 rounded-lg px-2 py-1 text-xs font-black text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-[#189D91]"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleAdjustStock(product._id, product.countInStock)}
                                    disabled={submitting}
                                    className="p-1 bg-[#189D91] hover:bg-[#189D91]/90 text-white rounded-lg transition-colors text-xs font-bold shrink-0 disabled:opacity-50"
                                  >
                                    Apply
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAdjustingId(null);
                                      setAdjustmentValue('');
                                    }}
                                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors text-xs shrink-0"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => setAdjustingId(product._id)}
                                    className="flex items-center gap-1 text-[9px] font-black text-slate-600 hover:text-[#189D91] bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors shrink-0"
                                  >
                                    Quick Adjust
                                  </button>
                                  <button
                                    onClick={() => handleViewHistory(product)}
                                    className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-slate-800 bg-slate-100 border border-slate-200/60 p-1.5 rounded-lg transition-colors shrink-0"
                                    title="View Audit Logs"
                                  >
                                    <FiActivity size={12} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-5 py-20 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-300">
                            <FiPackage size={40} strokeWidth={1.5} />
                            <p className="font-semibold text-xs italic">No matching catalog items discovered.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Footer Block */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                 <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                   Displaying {filteredProducts.length} of {products.length} registered assets
                 </p>
                 <button 
                   onClick={fetchStockData}
                   className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-[#189D91] transition-colors flex items-center gap-1.5"
                 >
                   Refresh Stocks <FiRefreshCw size={11} />
                 </button>
              </div>
            </div>
          </>
        ) : (
          /* Checkout Holds / Active Reservations Tab */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Active Checkout Reservations</h3>
              <span className="bg-[#189D91]/15 text-[#189D91] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#189D91]/10">
                {reservations.length} Active Holds
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150">Item Name / SKU</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150">Reserved For</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 text-center">Status</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 text-center">Reserved hold</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-150 text-right">Expiration Timer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="5" className="px-5 py-6">
                          <div className="h-4 bg-slate-100 rounded w-1/3" />
                        </td>
                      </tr>
                    ))
                  ) : reservations.length > 0 ? (
                    reservations.map((hold) => (
                      <tr key={hold._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800 text-xs">{hold.product?.name || 'Unknown Asset'}</p>
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded font-mono mt-1 inline-block uppercase">
                            {hold.product?.sku || 'NO-SKU'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold text-slate-700">{hold.user?.fullName || 'Guest Customer'}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{hold.user?.email || 'N/A'}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200/50 rounded-full text-[8px] font-black uppercase text-amber-600 tracking-widest flex items-center justify-center gap-1.5 w-fit mx-auto">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            STOCK RESERVED
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center text-xs font-black text-slate-800 font-mono">
                          {hold.quantity} Units
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-xs text-rose-600 font-black font-mono">
                            <FiClock size={12} />
                            {new Date(hold.expiresAt) > new Date() ? (
                              Math.ceil((new Date(hold.expiresAt) - new Date()) / 1000 / 60) + ' Mins left'
                            ) : (
                              'Expired, Pending Daemon release'
                            )}
                          </div>
                          <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                            Holds expires at {new Date(hold.expiresAt).toLocaleTimeString()}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-350">
                          <FiDatabase size={36} strokeWidth={1.5} />
                          <p className="font-semibold text-xs italic uppercase tracking-wider">No active stock holds currently reserved by checkout carts.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 1. Dynamic Stock Audit History Slide-over Drawer */}
      {selectedProductForHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay */}
          <div 
            onClick={() => setSelectedProductForHistory(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-[110] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-800 text-white">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#189D91]">Inventory Audit Trail</p>
                <h3 className="text-sm font-bold truncate max-w-[280px]">{selectedProductForHistory.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedProductForHistory(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Logs Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingHistory ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : historyLogs.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
                  {historyLogs.map((log) => {
                    const isManual = log.action === 'manual_adjustment';
                    const isSale = log.action === 'sale';
                    const isRelease = log.action === 'release';
                    const isReserve = log.action === 'reservation';

                    return (
                      <div key={log._id} className="relative space-y-1">
                        {/* Bullet indicator */}
                        <div className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border-2 bg-white ${
                          isManual ? 'border-[#189D91]' : isSale ? 'border-blue-500' : isReserve ? 'border-amber-500' : 'border-rose-500'
                        }`} />

                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isManual ? 'bg-teal-50 text-[#189D91]' : isSale ? 'bg-blue-50 text-blue-600' : isReserve ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                            <FiCalendar size={10} /> {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-700">{log.details}</p>
                        
                        <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                          <div>Before: <span className="font-mono text-slate-600">{log.stockBefore}</span></div>
                          <div>Qty change: <span className="font-mono text-slate-600">{(log.action === 'manual_adjustment' || log.action === 'return') ? '+' : '-'}{log.quantity}</span></div>
                          <div>Result: <span className="font-mono text-slate-600">{log.stockAfter}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                  No inventory adjustment logs recorded for this asset.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Batch Adjustments Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            onClick={() => {
              setIsBatchOpen(false);
              setBatchResults(null);
              setBatchInput('');
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl z-[110] border border-slate-200 overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-800 text-white">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FiDatabase className="text-[#189D91]" /> Batch Adjust Inventory
                </h3>
                <p className="text-[9px] text-[#189D91] font-bold uppercase tracking-widest mt-0.5">Apply atomic quantities across multiple partner products</p>
              </div>
              <button 
                onClick={() => {
                  setIsBatchOpen(false);
                  setBatchResults(null);
                  setBatchInput('');
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {!batchResults ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter adjustments (Format: SKU, DELTA)</label>
                    <p className="text-[9px] text-slate-400 italic">Example: Enter "TLE-MAR-001,20" to add 20 units, or "TLE-MAR-001,-5" to deduct 5.</p>
                    <textarea
                      rows={5}
                      placeholder="TLE-MAR-001,20&#10;TLE-MAR-002,-5&#10;TLE-ILL-092,10"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold font-mono text-slate-700 focus:outline-none focus:border-[#189D91] focus:ring-1 focus:ring-[#189D91] resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleBatchAdjust}
                      disabled={submitting}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-8 py-3.5 rounded-xl disabled:opacity-50"
                    >
                      {submitting ? 'EXECUTING ADJUSTMENTS...' : 'APPLY BATCH'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200/80 p-4 rounded-2xl">
                    <FiCheckCircle size={20} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">Adjustment process completed!</p>
                      <p className="text-[9px] font-bold text-green-600/90 uppercase tracking-widest mt-0.5">Below is the execution result summary for each item</p>
                    </div>
                  </div>

                  <div className="border border-slate-150 rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead className="bg-slate-50/50 border-b border-slate-150">
                        <tr>
                          <th className="px-4 py-2 font-bold text-slate-400 uppercase">SKU</th>
                          <th className="px-4 py-2 font-bold text-slate-400 uppercase text-center">Status</th>
                          <th className="px-4 py-2 font-bold text-slate-400 uppercase text-right">New Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {batchResults.map((res, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 font-mono">{res.sku}</td>
                            <td className="px-4 py-2 text-center">
                              {res.success ? (
                                <span className="text-green-600 font-bold uppercase">Success</span>
                              ) : (
                                <span className="text-rose-600 font-bold uppercase" title={res.error}>Failed</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {res.success ? res.newStock : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setBatchResults(null);
                        setBatchInput('');
                        setIsBatchOpen(false);
                      }}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-8 py-3.5 rounded-xl"
                    >
                      Close Summary
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default StockManagement;
