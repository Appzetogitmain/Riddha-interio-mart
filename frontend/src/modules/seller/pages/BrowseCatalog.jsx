import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  CheckCircle2, 
  Clock, 
  Grid2X2, 
  LayoutList,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  PlusCircle,
  Database,
  SearchCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';
import CatalogFilterBar from '../../../shared/components/CatalogFilterBar';
import { EMPTY_FILTERS, matchesCatalogFilters, getBrandName } from '../../../shared/utils/catalogFilters';
import Pagination, { usePagination } from '../../../shared/components/Pagination';

const BrowseCatalog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const categories = useMemo(() => [...new Set(catalogProducts.map(p => p.category).filter(Boolean))].sort(), [catalogProducts]);
  const brands = useMemo(() => [...new Set(catalogProducts.map(getBrandName).filter(Boolean))].sort(), [catalogProducts]);

  useEffect(() => {
    fetchCatalog();
    fetchMyInventory();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/catalog');
      setCatalogProducts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyInventory = async () => {
    try {
      const { data } = await api.get('/products/my-products');
      setInventory(data.data || []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(p => matchesCatalogFilters(p, searchTerm, filters));
  }, [searchTerm, catalogProducts, filters]);

  const isProductInInventory = (sku) => {
    return inventory.some(p => p.sku === sku);
  };

  const { pageItems: pagedFilteredProducts, paginationProps: pagerFilteredProducts } = usePagination(filteredProducts, 10);
  return (
    <PageWrapper>
      <div className="w-full space-y-8 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Catalog</h1>
            <p className="text-sm font-medium text-slate-500">Global product database for merchant selection</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                <Database size={16} className="text-seller-primary" />
                <span className="text-xs font-bold text-slate-900">{catalogProducts.length} Products</span>
             </div>
          </div>
        </div>

        {/* Toolbar Section */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search master catalog by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3.5 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/10 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
             <button 
               onClick={() => setViewMode('list')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
             >
               <LayoutList size={16} /> List
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
             >
               <Grid2X2 size={16} /> Grid
             </button>
          </div>
        </div>

        <CatalogFilterBar filters={filters} onApply={setFilters} categories={categories} brands={brands} accent="#4f46e5" />

        {/* Catalog Content */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
             <div className="w-12 h-12 border-4 border-seller-light border-t-seller-primary rounded-full animate-spin mx-auto"></div>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Querying Global Catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center space-y-4 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <SearchCode size={40} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-900">No results found</h3>
               <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Adjust your search terms or check back later for new catalog updates.</p>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SKU Code</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedFilteredProducts.map((product) => {
                    const alreadyInShop = isProductInInventory(product.sku);
                    return (
                      <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                               <img 
                                 src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'} 
                                 alt={product.name} 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                               />
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-bold text-slate-900 truncate group-hover:text-seller-primary transition-colors">{product.name}</p>
                               <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Master</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.brand?.name || 'Standard'}</span>
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                             {product.sku || 'N/A'}
                           </span>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-[11px] font-bold text-seller-primary bg-seller-light/40 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-seller-primary/10">
                             {product.category}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           {alreadyInShop ? (
                             <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-xs">
                               <CheckCircle2 size={16} />
                               In Your Shop
                             </div>
                           ) : (
                             <button
                               onClick={() => navigate(`/seller/product/add?catalogId=${product._id}`)}
                               className="inline-flex items-center gap-2 px-5 py-2.5 bg-seller-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-seller-dark transition-all shadow-md group/btn shadow-seller-primary/20"
                             >
                               Add to Shop
                               <PlusCircle size={16} className="group-hover/btn:rotate-90 transition-transform" />
                             </button>
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...pagerFilteredProducts} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pagedFilteredProducts.map((product) => {
              const alreadyInShop = isProductInInventory(product.sku);
              return (
                <motion.div 
                  key={product._id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500"
                >
                   <div className="relative h-52 overflow-hidden">
                      <img 
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute top-4 right-4">
                         <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-900 shadow-sm">
                           {product.category}
                         </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                         {!alreadyInShop && (
                            <button 
                              onClick={() => navigate(`/seller/product/add?catalogId=${product._id}`)}
                              className="w-full py-3 bg-white rounded-xl text-slate-900 font-bold text-sm flex items-center justify-center gap-2"
                            >
                              <Plus size={18} /> Quick Import
                            </button>
                         )}
                      </div>
                   </div>
                   <div className="p-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{product.sku}</p>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-4 group-hover:text-seller-primary transition-colors">{product.name}</h3>
                      
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Master Catalog</span>
                         {alreadyInShop ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                               <CheckCircle2 size={18} />
                            </div>
                         ) : (
                            <button 
                              onClick={() => navigate(`/seller/product/add?catalogId=${product._id}`)}
                              className="w-8 h-8 rounded-full bg-seller-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-seller-primary/20"
                            >
                               <ArrowRight size={18} />
                            </button>
                         )}
                      </div>
                   </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </PageWrapper>
  );
};

export default BrowseCatalog;
