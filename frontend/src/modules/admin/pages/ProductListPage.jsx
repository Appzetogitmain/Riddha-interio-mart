import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { LuSearch, LuPlus, LuTrash2, LuPen, LuFilter, LuBox, LuPackage, LuTag, LuX } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';

const ProductListPage = ({ status }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [commissionModal, setCommissionModal] = useState({ open: false, product: null, commission: 2, b2bCommission: 2 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // We want all products for admin catalog view, including pending and inactive
      const { data } = await api.get('/products', { params: { isActive: 'all', isApproved: 'all' } });
      setProducts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Could not connect to the inventory database.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, status, commission = 0, b2bCommission = 0) => {
    try {
      await api.put(`/products/${id}/approval`, { 
        approvalStatus: status,
        adminCommission: commission,
        b2bAdminCommission: b2bCommission
      });
      setCommissionModal({ open: false, product: null, commission: 2, b2bCommission: 2 });
      fetchProducts(); // Refresh list
    } catch (err) {
      console.error('Approval error:', err);
      alert('Failed to update product status.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRouteStatus = status === 'pending' ? p.approvalStatus === 'pending' : true;
      const matchesApproval = approvalFilter === 'all' || p.approvalStatus === approvalFilter;
      const isAdminSupply = p.sellerType === 'Admin';
      const matchesSeller =
        sellerFilter === 'all' ||
        (sellerFilter === 'admin' && isAdminSupply) ||
        (sellerFilter === 'marketplace' && !isAdminSupply);
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in_stock' && (p.countInStock || 0) > 0) ||
        (stockFilter === 'out_of_stock' && (p.countInStock || 0) === 0);

      return matchesSearch && matchesRouteStatus && matchesApproval && matchesSeller && matchesStock;
    });
  }, [searchTerm, products, status, approvalFilter, sellerFilter, stockFilter]);

  const hasActiveFilters =
    approvalFilter !== 'all' || sellerFilter !== 'all' || stockFilter !== 'all' || searchTerm.trim().length > 0;

  const resetFilters = () => {
    setSearchTerm('');
    setApprovalFilter('all');
    setSellerFilter('all');
    setStockFilter('all');
    setIsFilterOpen(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      setDeleteId(null);
      toast.success('Product deleted successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete product.');
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {status === 'pending' ? 'Pending Approval' : 'Product List'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {status === 'pending' ? 'Review and approve seller product submissions.' : 'All products in your inventory.'}
            </p>
          </div>
          <button 
            onClick={() => navigate('/admin/inventory/add')}
            className="flex items-center justify-center gap-2 bg-brand-purple text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-deep-espresso transition-all shadow-md shadow-red-900/20 active:scale-95 text-sm"
          >
            <LuPlus size={18} />
            Add New Product
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-grow">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(v => !v)}
            className={`flex items-center justify-center gap-2 px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${
              isFilterOpen || hasActiveFilters
                ? 'border-[#240046] bg-purple-50 text-[#240046]'
                : 'border-soft-oatmeal text-deep-espresso hover:bg-soft-oatmeal/20'
            }`}
          >
            <LuFilter size={16} />
            Filters {hasActiveFilters ? '(Active)' : ''}
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 px-5 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              <LuX size={16} />
              Reset
            </button>
          )}
        </div>

        {isFilterOpen && (
          <div className="bg-white p-6 rounded-2xl border border-soft-oatmeal shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Approval Status</label>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Seller Source</label>
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">All Sellers</option>
                <option value="admin">Admin Stock</option>
                <option value="marketplace">Marketplace Sellers</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Stock Status</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer font-medium"
              >
                <option value="all">All Items</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        )}

        {/* Product List Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Loading inventory…</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-center px-6">
              <LuPackage size={32} className="text-gray-300" />
              <p className="text-sm font-semibold text-gray-500">No products found</p>
              <p className="text-xs text-gray-400">{searchTerm ? 'Try a different search term.' : 'Add your first product to get started.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">SKU / Brand</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Seller Price</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">Commission</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Final Price</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50/60 transition-colors group">

                      {/* Product & Seller */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || 'https://via.placeholder.com/150'}
                            alt={product.name}
                            className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-snug">{product.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{product.seller?.shopName || product.seller?.fullName || 'Internal'}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Brand */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-700 font-mono">{product.sku || '—'}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <LuTag size={10} />
                          {product.brand?.name || 'No Brand'}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-700">{product.category}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {product.unitValue} {product.unit} · {product.countInStock} left
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          product.approvalStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : product.approvalStatus === 'rejected'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {product.approvalStatus === 'approved' ? 'Approved' : product.approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </td>

                      {/* Seller Price */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">B2C</span>
                            <span className="text-sm font-semibold text-gray-800">₹{(product.sellerPrice || product.price)?.toLocaleString()}</span>
                          </div>
                          {product.sellerB2bPrice && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">B2B</span>
                              <span className="text-sm font-semibold text-indigo-700">₹{product.sellerB2bPrice?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Commission */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">B2C</span>
                            <span className="text-sm font-semibold text-gray-700">{product.adminCommission || 0}%</span>
                          </div>
                          {product.sellerB2bPrice && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">B2B</span>
                              <span className="text-sm font-semibold text-indigo-700">{product.b2bAdminCommission || 0}%</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Final Price */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">B2C</span>
                            <span className="text-sm font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
                          </div>
                          {product.b2bPrice && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">B2B</span>
                              <span className="text-sm font-bold text-indigo-700">₹{product.b2bPrice?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {product.approvalStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => setCommissionModal({ open: true, product, commission: 2, b2bCommission: 2 })}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprove(product._id, 'rejected')}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold rounded-lg transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/admin/inventory/edit/${product._id}`)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <LuPen size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(product._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <LuTrash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Commission Approval Modal */}
      {commissionModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-espresso/20 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-soft-oatmeal overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />
            
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold text-deep-espresso">Set Commission</h3>
                <p className="text-brand-teal text-sm">Configure the markup for <span className="font-bold text-emerald-600">{commissionModal.product.name}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-soft-oatmeal/20 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest mb-1">Seller Price</p>
                    <p className="text-xl font-display font-bold text-deep-espresso">₹{(commissionModal.product.sellerPrice || commissionModal.product.price)?.toLocaleString()}</p>
                 </div>
                 <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Final Price</p>
                    <p className="text-xl font-display font-bold text-[#240046]">
                       ₹{Math.round((commissionModal.product.sellerPrice || commissionModal.product.price) * (1 + commissionModal.commission / 100)).toLocaleString()}
                    </p>
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest ml-1">B2C Commission (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={commissionModal.commission}
                    onChange={(e) => setCommissionModal({...commissionModal, commission: Number(e.target.value)})}
                    className="w-full bg-soft-oatmeal/30 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 text-lg font-bold text-deep-espresso outline-none transition-all"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">%</span>
                </div>
              </div>

              {(commissionModal.product.sellerB2bPrice || commissionModal.product.b2bPrice) && (
                <>
                  <hr className="border-soft-oatmeal" />
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-soft-oatmeal/20 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest mb-1">Seller B2B Price</p>
                        <p className="text-xl font-display font-bold text-deep-espresso">₹{(commissionModal.product.sellerB2bPrice || commissionModal.product.b2bPrice)?.toLocaleString()}</p>
                     </div>
                     <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Final B2B Price</p>
                        <p className="text-xl font-display font-bold text-[#240046]">
                           ₹{Math.round((commissionModal.product.sellerB2bPrice || commissionModal.product.b2bPrice) * (1 + commissionModal.b2bCommission / 100)).toLocaleString()}
                        </p>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest ml-1">B2B Commission (%)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={commissionModal.b2bCommission}
                        onChange={(e) => setCommissionModal({...commissionModal, b2bCommission: Number(e.target.value)})}
                        className="w-full bg-soft-oatmeal/30 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-6 py-4 text-lg font-bold text-deep-espresso outline-none transition-all"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">%</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setCommissionModal({ open: false, product: null, commission: 2, b2bCommission: 2 })}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-deep-espresso bg-soft-oatmeal/50 hover:bg-soft-oatmeal/70 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleApprove(commissionModal.product._id, 'approved', commissionModal.commission, commissionModal.b2bCommission)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
                >
                  Confirm & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-espresso/20 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl border border-soft-oatmeal text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[30px] flex items-center justify-center mx-auto mb-2">
              <LuTrash2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-bold text-deep-espresso">Are you sure?</h3>
              <p className="text-brand-teal text-sm">This action will permanently remove this product from the inventory. This cannot be undone.</p>
            </div>
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-deep-espresso bg-soft-oatmeal/50 hover:bg-soft-oatmeal/70 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 active:scale-95"
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

export default ProductListPage;
