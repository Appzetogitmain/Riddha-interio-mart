import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { 
  Filter, 
  CheckCircle2, 
  Clock, 
  Pencil, 
  Trash2, 
  LayoutGrid, 
  List, 
  X, 
  Search, 
  Plus, 
  MoreHorizontal,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Package
} from 'lucide-react';
import api from '../../../shared/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const MyProducts = () => {
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState('list'); // Defaulting to list for enterprise feel
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', category: '', price: '' });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/my-products');
      setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch seller products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const productStatus = (p.approvalStatus || p.status || (p.isActive ? 'approved' : 'pending')).toLowerCase();
    const matchesFilter = filter === 'All' || productStatus === filter.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => (p._id || p.id) !== id));
      toast.success('Product deleted successfully!');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleEditOpen = (product) => {
    setEditingProduct(product);
    setEditFormData({ 
      name: product.name, 
      category: product.category, 
      price: product.sellerPrice || product.price 
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${editingProduct._id || editingProduct.id}`, editFormData);
      toast.success('Product updated successfully!');
      fetchProducts();
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update product.');
    }
  };

  const StatusBadge = ({ product }) => {
    const status = product?.approvalStatus || 'pending';
    const inReview = status === 'pending' && !!product?.batchId;
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';

    if (inReview) {
      return (
        <div className="space-y-1">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 w-fit bg-blue-50 text-blue-600 border border-blue-100">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            In Review
          </span>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 w-fit ${
          isApproved
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            : isRejected
              ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-amber-50 text-amber-600 border border-amber-100'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-amber-500'}`} />
          <span className="capitalize">{status}</span>
        </span>
        {isRejected && product?.rejectionReason && (
          <p className="text-[10px] text-red-500 font-semibold max-w-[140px] leading-tight">
            {product.rejectionReason}
          </p>
        )}
      </div>
    );
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Primary Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage your product listings and tracking</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => window.location.href='/seller/add-product'}
               className="flex items-center gap-2 px-5 py-3 bg-seller-primary text-white rounded-xl font-bold text-sm hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20 active:scale-95"
             >
               <Plus size={18} />
               Add New Product
             </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-seller-primary/20 transition-all"
              />
            </div>
            
            <div className="relative">
               <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                 <Filter size={16} className="text-slate-400" />
                 {filter}
                 <ChevronDown size={14} className="text-slate-400" />
               </button>
               <select 
                 className="absolute inset-0 opacity-0 cursor-pointer"
                 value={filter}
                 onChange={(e) => setFilter(e.target.value)}
               >
                 <option value="All">All Status</option>
                 <option value="approved">Approved</option>
                 <option value="pending">Pending</option>
                 <option value="rejected">Rejected</option>
               </select>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setView('list')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <List size={18} />
              List
            </button>
            <button 
              onClick={() => setView('grid')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <LayoutGrid size={18} />
              Grid
            </button>
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
             <div className="w-12 h-12 border-4 border-seller-light border-t-seller-primary rounded-full animate-spin mx-auto"></div>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Syncing Inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Package size={40} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
             </div>
             <button 
               onClick={() => setSearchTerm('')}
               className="text-seller-primary font-bold text-sm hover:underline"
             >
               Clear all filters
             </button>
          </div>
        ) : view === 'list' ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(product => (
                    <tr key={product._id || product.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                            <img 
                              src={(product.image || (product.images && product.images[0]))?.startsWith('C:') 
                                ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80' 
                                : (product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80')} 
                              alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-seller-primary transition-colors">{product.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                              SKU: <span className="text-slate-600 font-bold">{product.sku || 'N/A'}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{product.category}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-900">₹{(product.sellerPrice || product.price).toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge product={product} />
                      </td>
                      <td className="px-8 py-5 text-right relative">
                        <div className="flex items-center justify-end">
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const prodId = product._id || product.id;
                                setActiveMenu(activeMenu === prodId ? null : prodId);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                              title="Actions"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            
                            <AnimatePresence>
                              {activeMenu === (product._id || product.id) && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(null);
                                    }} 
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 p-1.5 text-left"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(null);
                                        handleEditOpen(product);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                      <Pencil size={14} className="text-slate-400" />
                                      Edit Product
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(null);
                                        handleDelete(product._id || product.id);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={14} className="text-red-500" />
                                      Delete Product
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={product._id || product.id} 
                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={(product.image || (product.images && product.images[0]))?.startsWith('C:') 
                      ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' 
                      : (product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80')} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute top-4 left-4">
                    <StatusBadge product={product} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                     <button 
                       onClick={() => handleEditOpen(product)}
                       className="w-full py-3 bg-white rounded-xl text-slate-900 font-bold text-sm flex items-center justify-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                     >
                       <Pencil size={16} /> Quick Edit
                     </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-seller-primary uppercase tracking-[0.15em]">{product.category}</span>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 mt-1 group-hover:text-seller-primary transition-colors">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Price</p>
                       <p className="text-lg font-bold text-slate-900">₹{(product.sellerPrice || product.price).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleDelete(product._id || product.id)}
                         className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                onClick={() => setShowEditModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative z-10 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900">Quick Edit</h3>
                    <p className="text-sm text-slate-500">Update your product essentials</p>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Product Name</label>
                      {editingProduct?.source === 'catalog' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold border border-slate-200">
                           <AlertCircle size={10} /> Catalog Locked
                        </div>
                      )}
                    </div>
                    <input 
                      type="text" required 
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      readOnly={editingProduct?.source === 'catalog'}
                      className={`w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-semibold focus:ring-2 focus:ring-seller-primary/20 transition-all ${editingProduct?.source === 'catalog' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Selling Price (₹)</label>
                    <div className="relative">
                       <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</div>
                       <input 
                        type="number" required 
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-seller-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-seller-primary hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default MyProducts;
