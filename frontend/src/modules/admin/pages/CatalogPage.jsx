import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { LuSearch, LuPlus, LuTrash2, LuPen, LuFilter, LuBox, LuCheck, LuX } from 'react-icons/lu';
import { FiTrash2, FiEdit3, FiInfo } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const CatalogPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Active filters state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [uniqueCategories, setUniqueCategories] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [catalogRes, inventoryRes, categoriesRes] = await Promise.all([
        api.get('/catalog'),
        api.get('/products'),
        api.get('/categories').catch(() => ({ data: { data: [] } }))
      ]);
      
      const catalogData = catalogRes.data.data || [];
      setProducts(catalogData);
      setInventory(inventoryRes.data.data || []);

      // Extract unique categories from backend categories API or fallback to catalog attributes
      const catList = categoriesRes.data.data || [];
      if (catList.length > 0) {
        setUniqueCategories(catList.map(c => c.name));
      } else {
        const uniqueFromCatalog = [...new Set(catalogData.map(p => p.category).filter(Boolean))];
        setUniqueCategories(uniqueFromCatalog);
      }
    } catch (err) {
      console.error('Failed to fetch catalog/inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const isProductInInventory = (sku) => {
    return inventory.some(p => p.sku === sku);
  };

  // Reset pagination to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedTarget]);

  // Apply filters & search term
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchTerm || (
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesTarget = !selectedTarget || p.targetCustomer === selectedTarget;
      return matchesSearch && matchesCategory && matchesTarget;
    });
  }, [searchTerm, products, selectedCategory, selectedTarget]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  const handleDelete = async (id) => {
    try {
      setErrorMessage('');
      const res = await api.delete(`/catalog/${id}`);
      if (res.data.success) {
        setProducts(products.filter(p => p._id !== id));
        setDeleteId(null);
        toast.success('Catalog item deleted successfully.');
      }
    } catch (err) {
      console.error('Failed to delete catalog product:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to remove catalog item. Active store items exist.');
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedTarget('');
    setSearchTerm('');
  };

  // Modern Styled SVG image fallback
  const renderItemImage = (product) => {
    if (product.images && product.images.length > 0 && product.images[0]) {
      return (
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
        />
      );
    }
    return (
      <div className="w-12 h-12 bg-soft-oatmeal/40 rounded-xl flex items-center justify-center text-warm-sand border border-soft-oatmeal">
        <LuBox size={20} className="opacity-55" />
      </div>
    );
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-[#240046] tracking-tight leading-none">Product Catalog</h1>
            <p className="subtitle mt-2">Manage your inventory and product codes.</p>
          </div>
          <button 
            onClick={() => navigate('/admin/catalog/add')}
            className="flex items-center justify-center gap-2 bg-[#240046] text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-[#240046]/90 transition-all shadow-md shadow-purple-900/20 active:scale-95 text-sm"
          >
            <LuPlus size={18} />
            Add New Product
          </button>
        </div>

        {/* Toolbar & Filters Drawer */}
        <div className="space-y-4">
          <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="relative flex-grow">
              <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or SKU code..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm"
              />
            </div>
            
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={"flex items-center justify-center gap-2 border px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest transition-all " + (isFilterOpen || selectedCategory || selectedTarget ? "border-[#240046] bg-purple-50 text-[#240046]" : "border-soft-oatmeal text-deep-espresso hover:bg-soft-oatmeal/20")}
            >
              <LuFilter size={16} />
              Filters {(selectedCategory || selectedTarget) ? '(Active)' : ''}
            </button>

            {(selectedCategory || selectedTarget || searchTerm) && (
              <button 
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 px-5 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                <LuX size={16} />
                Reset
              </button>
            )}
          </div>

          {/* Collapsible Interactive Filter drawer */}
          {isFilterOpen && (
            <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-md animate-in slide-in-from-top-2 duration-200 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Filter by Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer font-medium"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Filter by Target Customer</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer font-medium"
                >
                  <option value="">All Customer Types</option>
                  <option value="individual">Individual Customers</option>
                  <option value="enterpriser">Enterprisers Only</option>
                  <option value="both">Both (Public)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Catalog List / Table */}
        <div className="space-y-4">
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Image</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Product Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Code (SKU)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Audience</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-oatmeal/50">
                  {!loading && paginatedProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                      <td className="px-6 py-4">
                        {renderItemImage(product)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-deep-espresso">{product.name}</p>
                        <p className="text-[9px] text-[#240046] font-bold uppercase tracking-wider mt-0.5">Master Catalog</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-deep-espresso/60 bg-soft-oatmeal/30 px-2 py-1 rounded border border-soft-oatmeal font-mono">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-[#240046] uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold text-warm-sand uppercase tracking-widest">
                          {product.targetCustomer || 'both'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isProductInInventory(product.sku) ? (
                            <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-tighter shadow-sm">
                              <LuCheck size={14} />
                              In Shop
                            </div>
                          ) : (
                            <button 
                              onClick={() => navigate(`/admin/inventory/add?catalogId=${product._id}`)}
                              className="p-2 text-warm-sand hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Prefill to Active Inventory"
                            >
                              <LuPlus size={18} />
                            </button>
                          )}
                          <button onClick={() => navigate(`/admin/catalog/edit/${product._id}`)} className="p-2 text-warm-sand hover:text-deep-espresso hover:bg-soft-oatmeal rounded-lg transition-all" title="Edit Catalog Item"><FiEdit3 size={18} /></button>
                          <button onClick={() => { setErrorMessage(''); setDeleteId(product._id); }} className="p-2 text-[#240046]/60 hover:text-[#240046] hover:bg-[#240046]/5 rounded-lg transition-all" title="Remove from Catalog"><FiTrash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {!loading && paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <div key={product._id} className="bg-white p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex gap-4 items-center">
                  {renderItemImage(product)}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-deep-espresso truncate">{product.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[9px] font-black text-deep-espresso/40 bg-soft-oatmeal/30 px-1.5 py-0.5 rounded font-mono">{product.sku}</span>
                      <span className="text-[9px] font-bold text-dusty-cocoa uppercase tracking-tighter">{product.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {isProductInInventory(product.sku) ? (
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
                        <LuCheck size={16} />
                      </div>
                    ) : (
                      <button 
                        onClick={() => navigate(`/admin/inventory/add?catalogId=${product._id}`)}
                        className="p-2.5 bg-warm-sand/5 text-warm-sand rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                      >
                        <LuPlus size={16} />
                      </button>
                    )}
                    <button onClick={() => navigate(`/admin/catalog/edit/${product._id}`)} className="p-2.5 bg-soft-oatmeal/20 text-warm-sand rounded-xl"><FiEdit3 size={16} /></button>
                    <button onClick={() => { setErrorMessage(''); setDeleteId(product._id); }} className="p-2.5 bg-[#240046]/5 text-[#240046] rounded-xl"><FiTrash2 size={16} /></button>
                  </div>
                </div>
              ))
            ) : null}
          </div>

          {/* Shimmer loading skeleton list */}
          {loading && (
            <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 animate-pulse border-b border-soft-oatmeal/40 last:border-0">
                  <div className="w-12 h-12 bg-soft-oatmeal/30 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-soft-oatmeal/30 rounded w-1/3" />
                    <div className="h-3 bg-soft-oatmeal/20 rounded w-1/4" />
                  </div>
                  <div className="w-24 h-8 bg-soft-oatmeal/20 rounded-lg" />
                  <div className="w-8 h-8 bg-soft-oatmeal/20 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl border border-soft-oatmeal p-12 text-center text-warm-sand shadow-sm">
              <LuBox size={48} className="mx-auto opacity-20 mb-4" />
              <p className="font-medium italic">No products matched your search or filters.</p>
            </div>
          )}
          
          {/* Footer/Active Interactive Pagination */}
          <div className="p-4 bg-white rounded-2xl border border-soft-oatmeal flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-warm-sand uppercase tracking-widest shadow-sm">
            <p>Showing {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredProducts.length, currentPage * itemsPerPage)} of {filteredProducts.length} Items</p>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 border border-soft-oatmeal rounded-xl hover:bg-soft-oatmeal/10 disabled:opacity-30 transition-all" 
                disabled={currentPage === 1}
              >
                Prev
              </button>
              
              <span className="px-3 py-1 font-black text-deep-espresso">Page {currentPage} of {totalPages}</span>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-4 py-2 border border-soft-oatmeal rounded-xl hover:bg-soft-oatmeal/10 disabled:opacity-30 transition-all" 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-deep-espresso/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-soft-oatmeal animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                <FiTrash2 size={32} />
             </div>
             <h3 className="text-xl font-display font-bold text-center text-deep-espresso mb-2">Remove Item?</h3>
             <p className="text-center text-warm-sand text-sm mb-4">This will permanently delete the product from the master catalog registry.</p>
             
             {errorMessage && (
               <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-start text-left">
                  <FiInfo size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-red-700 leading-normal">{errorMessage}</p>
               </div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setDeleteId(null); setErrorMessage(''); }}
                  className="py-4 bg-soft-oatmeal/20 rounded-2xl font-bold text-xs uppercase tracking-widest text-dusty-cocoa hover:bg-soft-oatmeal/40 transition-all"
                >
                   Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deleteId)}
                  className="py-4 bg-[#240046] rounded-2xl font-bold text-xs uppercase tracking-widest text-white hover:bg-[#240046]/90 transition-all shadow-lg shadow-purple-900/20"
                >
                   Delete
                </button>
             </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default CatalogPage;
