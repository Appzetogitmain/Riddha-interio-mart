import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { LuPercent, LuSearch, LuFilter, LuPen, LuRefreshCw } from 'react-icons/lu';
import api from '../../../shared/utils/api';

const Taxes = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({ gstRate: '18' });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get('/products/my-products');
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch seller products for tax overrides:', err);
      setErrorMsg('Failed to load products list. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setFormData({ gstRate: product.gstRate !== undefined ? String(product.gstRate) : '18' });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        productId: currentProduct._id,
        gstRate: Number(formData.gstRate)
      };

      const response = await api.post('/tax/product', payload);

      if (response.data.success) {
        setShowModal(false);
        setCurrentProduct(null);
        setFormData({ gstRate: '18' });
        // Refresh products list to show new rate
        fetchProducts();
      }
    } catch (err) {
      console.error('Failed to configure product GST rate override:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to save product GST rate override. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(prod => 
    prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prod.sku && prod.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageWrapper>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">Tax Management</h1>
            <p className="text-warm-sand text-sm md:text-base">Configure explicit GST overrides for your product listings.</p>
          </div>
          <button 
            onClick={fetchProducts}
            className="flex items-center justify-center gap-2 border border-soft-oatmeal text-deep-espresso px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-soft-oatmeal/20 transition-all active:scale-95 bg-white shadow-sm"
          >
            <LuRefreshCw className={loading ? "animate-spin" : ""} size={16} />
            Sync Products
          </button>
        </div>

        {errorMsg && !showModal && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-xs font-bold shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-grow">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={18} />
            <input 
              type="text" 
              placeholder="Search by product name or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all text-sm font-medium"
            />
          </div>
          <button className="flex items-center justify-center gap-2 border border-soft-oatmeal text-deep-espresso px-6 py-3 md:py-0 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-soft-oatmeal/20 transition-all">
            <LuFilter size={16} />
            Filters
          </button>
        </div>

        {/* Products Table */}
        {loading && products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md p-16 text-center animate-pulse">
            <div className="w-10 h-10 border-4 border-soft-oatmeal border-t-red-800 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-warm-sand">Syncing Active Listings...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Product Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">SKU</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">GST Rate</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-oatmeal/50">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((prod) => (
                      <tr key={prod._id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-deep-espresso">{prod.name}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-deep-espresso/70">
                          {prod.sku || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-deep-espresso/60 bg-soft-oatmeal/30 px-2 py-1 rounded border border-soft-oatmeal uppercase tracking-wider">
                            {prod.category || 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 font-black text-deep-espresso">
                            <span className="text-sm">{prod.gstRate !== undefined ? prod.gstRate : 18}</span>
                            <LuPercent size={14} className="text-warm-sand" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditClick(prod)}
                              className="p-2.5 text-deep-espresso hover:bg-soft-oatmeal rounded-xl transition-colors"
                              title="Edit Product GST Rate Override"
                            >
                              <LuPen size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-xs font-bold text-warm-sand uppercase tracking-widest italic">
                        No product listings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && currentProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-espresso/20 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-soft-oatmeal animate-in fade-in zoom-in duration-300 space-y-6">
              <div className="space-y-1 border-b border-soft-oatmeal pb-4">
                <h3 className="text-xl font-display font-bold text-deep-espresso">
                  Product GST Override
                </h3>
                <p className="text-[10px] font-bold text-warm-sand uppercase tracking-wider">
                  Product: <span className="text-red-800">{currentProduct.name}</span>
                </p>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-[10px] font-bold leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-warm-sand pl-1">GST Rate (%)</label>
                  <select 
                    value={formData.gstRate}
                    onChange={(e) => setFormData({...formData, gstRate: e.target.value})}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all font-bold text-deep-espresso cursor-pointer"
                  >
                     <option value="0">0% (GST Exempt)</option>
                     <option value="5">5% GST</option>
                     <option value="12">12% GST</option>
                     <option value="18">18% GST</option>
                     <option value="28">28% GST</option>
                  </select>
                  <p className="text-[9px] font-medium text-warm-sand italic leading-normal pl-1">
                    Setting an explicit rate overrides the default GST rate inherited from the {currentProduct.category} category.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setCurrentProduct(null);
                    }}
                    disabled={submitting}
                    className="flex-1 px-5 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-deep-espresso bg-soft-oatmeal/30 hover:bg-soft-oatmeal/50 transition-all border border-soft-oatmeal/50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-5 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-white bg-red-800 hover:bg-deep-espresso transition-all shadow-md shadow-red-900/20 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : null}
                    {submitting ? 'Applying Override...' : 'Apply Rate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Taxes;
