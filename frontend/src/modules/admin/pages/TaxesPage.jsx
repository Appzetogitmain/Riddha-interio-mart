import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import { LuPercent, LuSearch, LuFilter, LuPen, LuRefreshCw } from 'react-icons/lu';
import api from '../../../shared/utils/api';

const TaxesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({ defaultGstRate: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories for tax panel:', err);
      setErrorMsg('Failed to load categories and tax rates. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEditClick = (category) => {
    setCurrentCategory(category);
    setFormData({ defaultGstRate: category.defaultGstRate !== undefined ? category.defaultGstRate : 18 });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentCategory) return;
    
    try {
      setSubmitting(true);
      setErrorMsg('');
      
      const payload = {
        categoryName: currentCategory.name,
        defaultGstRate: Number(formData.defaultGstRate)
      };

      const response = await api.post('/tax/category', payload);
      
      if (response.data.success) {
        setShowModal(false);
        setCurrentCategory(null);
        setFormData({ defaultGstRate: '' });
        // Refresh the categories list to show the updated rate
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to configure category GST rate:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to save GST rate configuration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">Tax Management</h1>
            <p className="text-warm-sand text-sm md:text-base">Configure and manage category-level default GST rates.</p>
          </div>
          <button 
            onClick={fetchCategories}
            className="flex items-center justify-center gap-2 border border-soft-oatmeal text-deep-espresso px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-soft-oatmeal/20 transition-all active:scale-95 bg-white shadow-sm"
          >
            <LuRefreshCw className={loading ? "animate-spin" : ""} size={16} />
            Sync Rates
          </button>
        </div>

        {errorMsg && !showModal && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-soft-oatmeal shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-grow">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand" size={18} />
            <input 
              type="text" 
              placeholder="Search by category name..." 
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

        {/* Taxes Table */}
        {loading && categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md p-16 text-center animate-pulse">
            <div className="w-10 h-10 border-4 border-soft-oatmeal border-t-red-800 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-warm-sand">Syncing Category Ledger...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-soft-oatmeal shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-soft-oatmeal/20 border-b border-soft-oatmeal">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Category Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Default GST Rate</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-warm-sand uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-oatmeal/50">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <tr key={cat._id} className="hover:bg-soft-oatmeal/5 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-deep-espresso">{cat.name}</p>
                          {cat.description && (
                            <p className="text-[10px] text-warm-sand font-medium truncate max-w-sm mt-0.5">{cat.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 font-black text-deep-espresso">
                            <span className="text-sm">{cat.defaultGstRate !== undefined ? cat.defaultGstRate : 18}</span>
                            <LuPercent size={14} className="text-warm-sand" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border text-green-700 bg-green-50 border-green-700/10">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditClick(cat)}
                              className="p-2.5 text-deep-espresso hover:bg-soft-oatmeal rounded-xl transition-colors"
                              title="Edit Category GST Rate"
                            >
                              <LuPen size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-xs font-bold text-warm-sand uppercase tracking-widest italic">
                        No categories found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && currentCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-espresso/20 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-soft-oatmeal animate-in fade-in zoom-in duration-300 space-y-6">
              <div className="space-y-1 border-b border-soft-oatmeal pb-4">
                <h3 className="text-lg md:text-xl font-display font-bold text-deep-espresso">
                  Configure Category GST
                </h3>
                <p className="text-[10px] font-bold text-warm-sand uppercase tracking-wider">
                  Category: <span className="text-red-800">{currentCategory.name}</span>
                </p>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-[10px] font-bold leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-warm-sand pl-1">Default GST Rate (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required 
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="e.g. 18"
                      value={formData.defaultGstRate}
                      onChange={(e) => setFormData({...formData, defaultGstRate: e.target.value})}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all pr-10 font-bold text-deep-espresso"
                    />
                    <LuPercent className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-sand" size={16} />
                  </div>
                  <p className="text-[9px] font-medium text-warm-sand italic leading-normal pl-1">
                    Changing this will instantly update the default tax rate for all active products belonging to the {currentCategory.name} category.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setCurrentCategory(null);
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
                    {submitting ? 'Configuring...' : 'Apply Rate'}
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

export default TaxesPage;
