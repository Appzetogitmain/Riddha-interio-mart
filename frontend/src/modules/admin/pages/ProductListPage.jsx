import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { LuDownload, LuUpload, LuSearch, LuPlus, LuTrash2, LuPen, LuBox, LuPackage, LuTag } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import ProductFilterBar from '../../../shared/components/ProductFilterBar';
import { EMPTY_PRODUCT_FILTERS, matchesProductFilters } from '../../../shared/utils/productListFilters';
import ProductCsvModal, { downloadProductCsv } from '../components/ProductCsvModal';
import Pagination, { usePagination } from '../../../shared/components/Pagination';

const ProductListPage = ({ status }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [commissionModal, setCommissionModal] = useState({ open: false, product: null, commission: 2, b2bCommission: 2 });
  const [csvOpen, setCsvOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [publishing, setPublishing] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(null); // { ids: [...] }
  const [sectionModal, setSectionModal] = useState({ open: false, product: null, tabs: [], loading: false, saving: false });
  const [filters, setFilters] = useState({ ...EMPTY_PRODUCT_FILTERS });
  const approvalFilter = filters.status || 'all';
  const setApprovalFilter = (v) => setFilters(f => ({ ...f, status: v === 'all' ? '' : v }));
  const [categories, setCategories] = useState([]);
  const brandOptions = useMemo(() => [...new Set(products.map(p => p.brand?.name).filter(Boolean))].sort(), [products]);

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setCategories([]));
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // We want all products for admin catalog view, including pending and inactive
      const { data } = await api.get('/products', { params: { isActive: 'all', isApproved: 'all', limit: 5000 } });
      setProducts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Could not connect to the inventory database.');
    } finally {
      setLoading(false);
    }
  };

  // Publish reviewed drafts (one or many). Prices are not touched; only the status changes.
  const publishDrafts = async (ids) => {
    if (!ids.length) return;
    setPublishing(true);
    try {
      const { data } = await api.post('/products/bulk/publish', { ids });
      const { published = 0, skipped = [] } = data.data || {};
      if (published > 0) toast.success(`${published} product${published === 1 ? '' : 's'} published.`);
      if (skipped.length > 0) {
        const detail = skipped.slice(0, 3).map(sk => `${sk.name || sk.id}: ${sk.reason}`).join('\n');
        toast.error(`${skipped.length} could not be published.\n${detail}${skipped.length > 3 ? '\n…' : ''}`, { duration: 8000 });
      }
      setSelectedIds(new Set());
      await fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish.');
    } finally {
      setPublishing(false);
      setPublishConfirm(null);
    }
  };

  const toggleSelected = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

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

  const SECTION_OPTIONS = [
    { id: 'personalized', label: 'Picks For You', hint: 'First in the homepage "Picks For You" tab' },
    { id: 'trending', label: 'Trending This Week', hint: 'Shown in the "Trending This Week" tab' },
    { id: 'cross-sell', label: 'Complete the Look', hint: 'Shown in the "Complete the Look" tab' },
  ];

  const openSectionModal = async (product) => {
    setSectionModal({ open: true, product, tabs: [], loading: true, saving: false });
    try {
      const { data } = await api.get(`/recommendations/curation/product/${product._id}`);
      setSectionModal(m => ({ ...m, tabs: data?.data?.tabs || [], loading: false }));
    } catch {
      setSectionModal(m => ({ ...m, loading: false }));
    }
  };

  const toggleSectionTab = (id) =>
    setSectionModal(m => ({ ...m, tabs: m.tabs.includes(id) ? m.tabs.filter(t => t !== id) : [...m.tabs, id] }));

  const saveSections = async () => {
    try {
      setSectionModal(m => ({ ...m, saving: true }));
      await api.put(`/recommendations/curation/product/${sectionModal.product._id}`, { tabs: sectionModal.tabs });
      setSectionModal({ open: false, product: null, tabs: [], loading: false, saving: false });
    } catch (err) {
      alert('Failed to update sections.');
      setSectionModal(m => ({ ...m, saving: false }));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      (status === 'pending' ? p.approvalStatus === 'pending' : true) &&
      matchesProductFilters(p, searchTerm, filters)
    );
  }, [searchTerm, products, status, filters]);

  const draftCount = useMemo(() => products.filter(p => p.approvalStatus === 'draft').length, [products]);
  const visibleDraftIds = useMemo(
    () => filteredProducts.filter(p => p.approvalStatus === 'draft').map(p => p._id),
    [filteredProducts]
  );
  const allVisibleDraftsSelected = visibleDraftIds.length > 0 && visibleDraftIds.every(id => selectedIds.has(id));
  const toggleAllVisibleDrafts = () => setSelectedIds(prev => {
    const next = new Set(prev);
    if (allVisibleDraftsSelected) visibleDraftIds.forEach(id => next.delete(id));
    else visibleDraftIds.forEach(id => next.add(id));
    return next;
  });
  // Only drafts that still exist can stay selected (e.g. after a refresh / publish)
  const selectedDraftIds = useMemo(
    () => products.filter(p => p.approvalStatus === 'draft' && selectedIds.has(p._id)).map(p => p._id),
    [products, selectedIds]
  );

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

  const { pageItems: pagedFilteredProducts, paginationProps: pagerFilteredProducts } = usePagination(filteredProducts, 10);
  return (
    <PageWrapper>
      <div className="w-full space-y-6">
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
          <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadProductCsv('export')}
            className="flex items-center justify-center gap-2 border border-soft-oatmeal text-deep-espresso px-4 py-3 rounded-2xl font-bold hover:bg-soft-oatmeal/20 transition-all text-xs"
          >
            <LuDownload size={16} />
            Export CSV
          </button>
          <button
            onClick={() => setCsvOpen(true)}
            className="flex items-center justify-center gap-2 border border-teal-300 bg-teal-50 text-teal-700 px-4 py-3 rounded-2xl font-bold hover:bg-teal-100 transition-all text-xs"
          >
            <LuUpload size={16} />
            Bulk Upload CSV
          </button>
          <button 
            onClick={() => navigate('/admin/inventory/add')}
            className="flex items-center justify-center gap-2 bg-brand-purple text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-deep-espresso transition-all shadow-md shadow-red-900/20 active:scale-95 text-sm"
          >
            <LuPlus size={18} />
            Add New Product
          </button>
          </div>
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
        </div>

        {/* Drafts: imported / unpublished products awaiting review */}
        {(draftCount > 0 || approvalFilter === 'draft') && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setApprovalFilter(approvalFilter === 'draft' ? 'all' : 'draft')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                approvalFilter === 'draft' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Drafts
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${approvalFilter === 'draft' ? 'bg-white/20' : 'bg-slate-100'}`}>{draftCount}</span>
            </button>
            {draftCount > 0 && <p className="text-xs text-gray-500">Drafts are hidden from customers until published.</p>}
          </div>
        )}

        {selectedDraftIds.length > 0 && (
          <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-lg">
            <p className="text-sm font-semibold">{selectedDraftIds.length} draft{selectedDraftIds.length === 1 ? '' : 's'} selected</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold">Clear</button>
              <button
                onClick={() => setPublishConfirm({ ids: selectedDraftIds })}
                disabled={publishing}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-xs font-bold"
              >
                Publish selected ({selectedDraftIds.length})
              </button>
            </div>
          </div>
        )}

        <ProductFilterBar filters={filters} onApply={setFilters} categories={categories} brands={brandOptions} />

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
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="pl-4 pr-0 py-3 w-8">
                      {visibleDraftIds.length > 0 && (
                        <input
                          type="checkbox"
                          aria-label="Select all drafts"
                          title="Select all drafts on this list"
                          checked={allVisibleDraftsSelected}
                          onChange={toggleAllVisibleDrafts}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 cursor-pointer"
                        />
                      )}
                    </th>
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
                  {pagedFilteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50/60 transition-colors group">

                      <td className="pl-4 pr-0 py-3 w-8">
                        {product.approvalStatus === 'draft' && (
                          <input
                            type="checkbox"
                            aria-label={`Select ${product.name}`}
                            checked={selectedIds.has(product._id)}
                            onChange={() => toggleSelected(product._id)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 cursor-pointer"
                          />
                        )}
                      </td>

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
                            : product.approvalStatus === 'draft'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {product.approvalStatus === 'approved' ? 'Approved' : product.approvalStatus === 'rejected' ? 'Rejected' : product.approvalStatus === 'draft' ? 'Draft' : 'Pending'}
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
                          {product.approvalStatus === 'draft' && (
                            <button
                              onClick={() => setPublishConfirm({ ids: [product._id], name: product.name })}
                              disabled={publishing}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-semibold rounded-lg transition-colors"
                            >
                              Publish
                            </button>
                          )}
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
                            onClick={() => openSectionModal(product)}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap"
                          >
                            Add to Section
                          </button>
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
            <Pagination {...pagerFilteredProducts} />
            </>
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
      {csvOpen && (
        <ProductCsvModal
          onClose={() => setCsvOpen(false)}
          onDone={fetchProducts}
          onReviewDrafts={() => { setCsvOpen(false); setApprovalFilter('draft'); setSearchTerm(''); }}
        />
      )}

      {/* Publish confirmation (single + bulk) */}
      {publishConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !publishing && setPublishConfirm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-800">
              {publishConfirm.ids.length === 1 ? 'Publish this product?' : `Publish ${publishConfirm.ids.length} products?`}
            </h3>
            <p className="text-sm text-gray-500">
              {publishConfirm.ids.length === 1 && publishConfirm.name ? `"${publishConfirm.name}" will` : 'They will'} become visible to customers right away. Prices stay exactly as you set them.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPublishConfirm(null)} disabled={publishing} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={() => publishDrafts(publishConfirm.ids)} disabled={publishing} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Homepage Section Modal */}
      {sectionModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Add to Homepage Section</h3>
              <p className="text-sm text-gray-500 mt-1 truncate">{sectionModal.product?.name}</p>
            </div>
            <div className="space-y-2">
              {SECTION_OPTIONS.map(opt => {
                const checked = sectionModal.tabs.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={sectionModal.loading}
                      onChange={() => toggleSectionTab(opt.id)}
                      className="mt-1 accent-teal-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{opt.label}</span>
                      <span className="block text-xs text-gray-500">{opt.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400">The product appears in the selected tabs once it is approved and in stock. Untick a section to remove it.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSectionModal({ open: false, product: null, tabs: [], loading: false, saving: false })}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveSections}
                disabled={sectionModal.loading || sectionModal.saving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                {sectionModal.saving ? 'Saving…' : 'Save'}
              </button>
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
