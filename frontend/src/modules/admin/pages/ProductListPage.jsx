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
  const [commissionModal, setCommissionModal] = useState({ open: false, product: null, commission: 2 });
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

  const handleApprove = async (id, status, commission = 0) => {
    try {
      await api.put(`/products/${id}/approval`, { 
        approvalStatus: status,
        adminCommission: commission
      });
      setCommissionModal({ open: false, product: null, commission: 2 });
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
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">
              {status === 'pending' ? 'Pending Approval' : 'Product List'}
            </h1>
            <p className="text-brand-teal text-sm md:text-base">
              {status === 'pending' ? 'Review and approve products from sellers.' : 'Comprehensive view of all your inventory.'}
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
        <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-soft-oatmeal border-t-red-800 rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-brand-teal">Fetching Inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center px-6">
               <div className="w-20 h-20 bg-soft-oatmeal/20 rounded-[40px] flex items-center justify-center text-brand-teal/30 mb-2">
                 <LuPackage size={40} />
               </div>
               <h3 className="text-xl font-display font-bold text-deep-espresso">No Products Found</h3>
               <p className="text-sm text-brand-teal max-w-xs">{searchTerm ? "No products match your current search criteria." : "Start by adding your first product to the catalog."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-teal uppercase tracking-widest">Product & Seller</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-teal uppercase tracking-widest">SKU & Brand</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-teal uppercase tracking-widest text-center">Category & Unit</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-teal uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-teal uppercase tracking-widest">Seller Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-teal uppercase tracking-widest text-center">Comm. %</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-teal uppercase tracking-widest">Final Price</th>
                    <th className="px-6 py-4 text-[10px] font-black text-brand-teal uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-oatmeal/50">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                            alt={product.name} 
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform border border-soft-oatmeal" 
                          />
                          <div className="space-y-0.5">
                            <p className="font-medium text-deep-espresso text-sm">{product.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-medium bg-brand-purple/5 text-brand-purple px-1.5 py-0.5 rounded border border-brand-purple/10 uppercase tracking-widest">Seller</span>
                              <p className="text-xs font-medium text-brand-teal">{product.seller?.shopName || product.seller?.fullName || 'Internal'}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-medium text-deep-espresso/60 bg-soft-oatmeal/30 px-2 py-1 rounded border border-soft-oatmeal w-fit">
                            {product.sku || 'NO-SKU'}
                          </span>
                          <p className="text-[11px] font-medium text-warm-sand flex items-center gap-1">
                            <LuTag size={12} className="opacity-50" />
                            {product.brand?.name || 'No Brand'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1.5">
                          <span className="inline-block text-[10px] font-medium text-red-800 uppercase tracking-widest bg-brand-purple/5 px-2.5 py-1 rounded-full border border-red-800/10">
                            {product.category}
                          </span>
                          <p className="text-[10px] font-medium text-brand-teal/60 uppercase tracking-widest">
                            {product.unitValue} {product.unit} • {product.countInStock} {product.countInStock > 0 ? 'Left' : 'OUT'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[9px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${
                          product.approvalStatus === 'approved' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : product.approvalStatus === 'rejected'
                          ? 'bg-brand-pink/5 text-red-600 border-red-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {product.approvalStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <p className="text-[10px] font-medium text-warm-sand uppercase tracking-widest mb-0.5">Seller Asks</p>
                         <p className="font-medium text-deep-espresso/60">₹{(product.sellerPrice || product.price)?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-emerald-600">
                          {product.adminCommission || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-medium text-[#240046] uppercase tracking-widest mb-0.5">User Price</p>
                        <p className="font-medium text-[#240046] text-sm">₹{product.price?.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {product.approvalStatus === 'pending' && (
                            <>
                              <button 
                                onClick={() => setCommissionModal({ open: true, product, commission: 2 })}
                                className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 active:scale-95"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleApprove(product._id, 'rejected')}
                                className="px-4 py-2 bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-200 transition-all active:scale-95"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => navigate(`/admin/inventory/edit/${product._id}`)}
                            className="p-2.5 text-deep-espresso hover:bg-soft-oatmeal rounded-xl transition-all hover:scale-110"
                          >
                            <LuPen size={18} />
                          </button>
                          <button 
                            onClick={() => setDeleteId(product._id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                          >
                            <LuTrash2 size={18} />
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
                    <p className="text-xl font-display font-bold text-deep-espresso">₹{commissionModal.product.price?.toLocaleString()}</p>
                 </div>
                 <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Final Price</p>
                    <p className="text-xl font-display font-bold text-[#240046]">
                       ₹{Math.round(commissionModal.product.price * (1 + commissionModal.commission / 100)).toLocaleString()}
                    </p>
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest ml-1">Commission Percentage (%)</label>
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

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setCommissionModal({ open: false, product: null, commission: 2 })}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-deep-espresso bg-soft-oatmeal/50 hover:bg-soft-oatmeal/70 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleApprove(commissionModal.product._id, 'approved', commissionModal.commission)}
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
