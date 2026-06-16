import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import {
  Search,
  AlertCircle,
  RefreshCcw,
  Package,
  ArrowDownCircle,
  CheckCircle2,
  Filter,
  ChevronDown,
  ArrowRight,
  Plus,
  Zap,
  TrendingDown,
  BarChart3,
  X,
  Check
} from 'lucide-react';
import api from '../../../shared/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const StockManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, low, out
  const [stockEdit, setStockEdit] = useState({ id: null, value: '' }); // inline stock edit

  useEffect(() => {
    fetchStockData();
  }, []);

  const handleStockUpdate = async (productId) => {
    const qty = Number(stockEdit.value);
    if (isNaN(qty) || qty < 0) { toast.error('Enter a valid quantity'); return; }
    try {
      await api.patch(`/products/${productId}`, { countInStock: qty });
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, countInStock: qty } : p));
      setStockEdit({ id: null, value: '' });
      toast.success('Stock updated');
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const fetchStockData = async (isManualRefresh = false) => {
    try {
      setLoading(true);
      const response = await api.get('/auth/seller/stock-status');
      setProducts(response.data.data || []);
      if (isManualRefresh) {
        toast.success('Inventory synced successfully', { icon: '🔄' });
      }
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
      if (isManualRefresh) {
        toast.error('Failed to sync inventory');
      }
    } finally {
      setLoading(false);
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
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Inventory Health</h1>
            <p className="text-sm font-medium text-slate-500">Monitor stock levels and replenishment needs</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => fetchStockData(true)}
               disabled={loading}
               className={`p-3 bg-white border border-slate-200 rounded-xl transition-all shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50 hover:text-seller-primary'}`}
               title="Refresh Inventory"
             >
               <RefreshCcw size={20} className={loading ? 'animate-spin text-seller-primary' : ''} />
             </button>
             <button 
               onClick={() => navigate('/seller/product/add')}
               className="flex items-center gap-2 px-6 py-3 bg-seller-primary text-white rounded-xl font-semibold text-sm hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20">
               <Plus size={18} />
               Add Stock
             </button>
          </div>
        </div>

        {/* Inventory KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all duration-300">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
              <Package size={26} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-1">Total Catalog Items</p>
              <h3 className="text-2xl font-semibold text-slate-900">{stats.totalItems}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
              <Zap size={26} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-600/60 mb-1">Low Stock Alerts</p>
              <h3 className="text-2xl font-semibold text-amber-600">{stats.lowStock}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all duration-300 border-l-4 border-l-red-500">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-500 group-hover:text-white transition-all duration-500">
              <TrendingDown size={26} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-red-600/60 mb-1">Out of Stock</p>
              <h3 className="text-2xl font-semibold text-red-600">{stats.outOfStock}</h3>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products by name or SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all"
              />
            </div>
            <div className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
               <BarChart3 size={14} className="text-slate-400" />
               <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{filteredProducts.length} results</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Items', icon: Package },
              { id: 'low', label: 'Low Stock', icon: Zap },
              { id: 'out', label: 'Out of Stock', icon: TrendingDown },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <f.icon size={14} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 text-center space-y-4">
               <div className="w-12 h-12 border-4 border-seller-light border-t-seller-primary rounded-full animate-spin mx-auto"></div>
               <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Analyzing Stock Levels...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Package size={40} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">No inventory matches</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your filters or search terms to find specific stock items.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Product Details</th>
                    <th className="px-8 py-5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-8 py-5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Health Status</th>
                    <th className="px-8 py-5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Available Stock</th>
                    <th className="px-8 py-5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const isLow = product.countInStock > 0 && product.countInStock <= 10;
                    const isOut = product.countInStock === 0;

                    return (
                      <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                              <img 
                                src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 group-hover:text-seller-primary transition-colors truncate">{product.name}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  {product.sku || 'N/A'}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 italic truncate">
                                  {product.brand?.name || 'Store Brand'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg">{product.category}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex justify-center">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-semibold uppercase tracking-wider border border-red-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-semibold uppercase tracking-wider border border-amber-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-semibold uppercase tracking-wider border border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Healthy
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className={`text-2xl font-semibold tracking-tight ${isOut ? 'text-red-600' : isLow ? 'text-amber-500' : 'text-slate-900'}`}>
                            {product.countInStock}
                            <span className="text-[11px] font-semibold text-slate-400 ml-2 uppercase tracking-widest">Units</span>
                          </div>
                          {isLow && <p className="text-[10px] font-semibold text-amber-600/70 mt-1 uppercase">Needs Restock</p>}
                          {isOut && <p className="text-[10px] font-semibold text-red-600 mt-1 uppercase">Sold Out</p>}
                        </td>
                        <td className="px-8 py-6 text-right">
                          {stockEdit.id === product._id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={stockEdit.value}
                                onChange={e => setStockEdit(s => ({ ...s, value: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') handleStockUpdate(product._id); if (e.key === 'Escape') setStockEdit({ id: null, value: '' }); }}
                                autoFocus
                                className="w-20 px-2 py-1.5 text-sm font-bold text-slate-900 bg-slate-50 border border-seller-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-seller-primary/20 text-right"
                              />
                              <button onClick={() => handleStockUpdate(product._id)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                                <Check size={13} />
                              </button>
                              <button onClick={() => setStockEdit({ id: null, value: '' })} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setStockEdit({ id: product._id, value: String(product.countInStock) })}
                              className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-seller-primary/10 text-seller-primary rounded-lg hover:bg-seller-primary hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                              <Plus size={12} /> Add Stock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 opacity-50">
           <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Merchant Inventory Management System v1.0</p>
           <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Live Sync Active</span>
           </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default StockManagement;
