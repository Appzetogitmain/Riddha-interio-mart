import React, { useState, useEffect } from 'react';
import { FiX, FiPackage, FiPhone, FiUser, FiMessageSquare, FiSend, FiChevronRight, FiPlus, FiTrash2, FiSearch, FiCheckCircle, FiMail } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';

const BulkOrderModal = ({ isOpen, onClose }) => {
  const [selectionMode, setSelectionMode] = useState('single');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [availableProducts, setAvailableProducts] = useState({});
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleModeChange = (mode) => {
    setSelectionMode(mode);
    setSelectedCategoryIds([]);
    setOrderItems([]);
  };

  const toggleCategory = async (catId) => {
    let newSelection;
    if (selectionMode === 'single') {
      newSelection = [catId];
    } else {
      newSelection = selectedCategoryIds.includes(catId)
        ? selectedCategoryIds.filter(id => id !== catId)
        : [...selectedCategoryIds, catId];
    }
    setSelectedCategoryIds(newSelection);

    if (newSelection.includes(catId) && !availableProducts[catId]) {
      try {
        setLoading(true);
        const catName = categories.find(c => c._id === catId).name;
        const res = await api.get(`/products?category=${catName}`);
        setAvailableProducts(prev => ({ ...prev, [catId]: res.data.data }));
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const addProductToOrder = (product, catId) => {
    if (orderItems.find(item => item.id === product._id)) return;
    const category = categories.find(c => c._id === catId)?.name || 'General';
    setOrderItems([...orderItems, { 
      id: product._id, 
      name: product.name, 
      qty: 1, 
      price: product.price, 
      image: product.images?.[0],
      category: category
    }]);
  };

  const removeOrderItem = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    setOrderItems(orderItems.map(item => item.id === id ? { ...item, qty: parseInt(newQty) } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderItems.length === 0) return alert('Please add at least one product');
    
    if (!formData.name || !formData.phone || !formData.email) {
      return alert('Name, Phone, and Email are mandatory fields.');
    }
    if (formData.phone.length < 10 || formData.phone.length > 12) {
      return alert('Phone number must be 10–12 digits.');
    }

    setStatus('sending');
    
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        items: orderItems.map(item => ({
          product: item.id,
          name: item.name,
          quantity: item.qty,
          category: item.category
        })),
        message: formData.message
      };

      await api.post('/bulk-orders', payload);
      
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setOrderItems([]);
        setSelectedCategoryIds([]);
        setFormData({ name: '', phone: '', email: '', message: '' });
      }, 3000);
    } catch (err) {
      console.error('Failed to submit bulk order:', err);
      alert('Failed to submit inquiry. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="bg-white rounded-[24px] w-full max-w-[550px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative"
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/85 hover:bg-white/20 z-50 transition-all border border-white/10"
            >
              <FiX size={16} />
            </button>

            {/* Header */}
            <div className="bg-[#189D91] p-6 text-white shrink-0">
               <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                    <FiPackage className="w-5.5 h-5.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white leading-snug">Bulk Order Center</h2>
                    <p className="text-teal-50/75 text-[10px] font-medium tracking-wider uppercase">Premium Corporate & Volume Solutions</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              {status === 'success' ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <FiCheckCircle size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Inquiry Logged</h3>
                  <p className="text-gray-500 text-xs font-semibold">Our B2B team will contact you shortly.</p>
                </div>
              ) : (
                <form id="bulkForm" onSubmit={handleSubmit} className="space-y-5">
                  {/* Step 1: Info */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        required
                        placeholder="Full Name *"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})}
                        className="w-full bg-gray-50/80 border border-gray-150 focus:border-[#189D91] focus:bg-white rounded-xl py-3 pl-11 pr-4 outline-none text-xs font-semibold text-gray-800 transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          required
                          type="tel"
                          placeholder="Phone Number *"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 12)})}
                          className="w-full bg-gray-50/80 border border-gray-150 focus:border-[#189D91] focus:bg-white rounded-xl py-3 pl-11 pr-4 outline-none text-xs font-semibold text-gray-800 transition-all placeholder:text-gray-400"
                        />
                      </div>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input 
                          required 
                          type="email"
                          placeholder="Email Address *" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                          className="w-full bg-gray-50/80 border border-gray-150 focus:border-[#189D91] focus:bg-white rounded-xl py-3 pl-11 pr-4 outline-none text-xs font-semibold text-gray-800 transition-all placeholder:text-gray-400" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Mode Toggle */}
                  <div className="flex items-center justify-between p-1 bg-gray-50/80 rounded-xl border border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => handleModeChange('single')} 
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${selectionMode === 'single' ? 'bg-white text-[#189D91] shadow-sm border border-gray-100/50' : 'text-gray-500'}`}
                    >
                      Single Category
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleModeChange('multiple')} 
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${selectionMode === 'multiple' ? 'bg-white text-[#189D91] shadow-sm border border-gray-100/50' : 'text-gray-500'}`}
                    >
                      Multiple Categories
                    </button>
                  </div>

                  {/* Step 3: Category Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-500">Select {selectionMode === 'single' ? 'Category' : 'Categories'}</label>
                    </div>

                    {/* Category Search Bar */}
                    <div className="relative group">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search categories (e.g. Marble, Tiles...)"
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        className="w-full bg-gray-50/80 border border-gray-150 focus:border-[#189D91] focus:bg-white rounded-xl py-2.5 pl-11 pr-4 outline-none text-xs font-semibold text-gray-800 transition-all placeholder:text-gray-400"
                      />
                      {categorySearchTerm && (
                        <button 
                          type="button"
                          onClick={() => setCategorySearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <FiX size={14} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-2 custom-scrollbar">
                      {categories
                        .filter(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                        .map(cat => {
                          const isSelected = selectedCategoryIds.includes(cat._id);
                          return (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => toggleCategory(cat._id)}
                              className={`px-3.5 py-1.5 rounded-xl text-[10.5px] font-semibold transition-all border ${
                                isSelected 
                                  ? 'bg-[#189D91] border-[#189D91] text-white shadow-sm' 
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                              }`}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      {categorySearchTerm && !categories.some(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())) && (
                        <p className="text-[10px] font-semibold text-gray-400 tracking-wide py-2">No matching categories</p>
                      )}
                    </div>
                  </div>

                  {/* Step 4: Product Selection */}
                  <AnimatePresence>
                    {selectedCategoryIds.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-500">Available Products</label>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative group">
                          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            type="text"
                            placeholder="Quick search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-150 focus:border-[#189D91] focus:bg-white rounded-xl py-2.5 pl-11 pr-4 outline-none text-xs font-semibold text-gray-800 transition-all placeholder:text-gray-400"
                          />
                          {searchTerm && (
                            <button 
                              type="button"
                              onClick={() => setSearchTerm('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <FiX size={14} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                          {selectedCategoryIds.map(catId => {
                            const products = availableProducts[catId]?.filter(p => 
                              p.name.toLowerCase().includes(searchTerm.toLowerCase())
                            ) || [];
                            
                            if (products.length === 0 && searchTerm) return null;

                            return (
                              <div key={catId} className="space-y-2">
                                {products.map(prod => {
                                  const isSelected = orderItems.some(i => i.id === prod._id);
                                  return (
                                    <div key={prod._id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl hover:bg-white border border-transparent hover:border-gray-150 transition-all">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white overflow-hidden shadow-sm border border-gray-200">
                                          <img src={prod.images?.[0]} className="w-full h-full object-cover" alt={prod.name} />
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[200px]">{prod.name}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => addProductToOrder(prod, catId)}
                                        className={`p-1.5 rounded-lg transition-all ${
                                          isSelected 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-white text-[#189D91] border border-gray-200 hover:border-[#189D91] shadow-sm hover:scale-105'
                                        }`}
                                      >
                                        {isSelected ? <FiCheckCircle size={13} /> : <FiPlus size={13} />}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                          {searchTerm && !selectedCategoryIds.some(catId => availableProducts[catId]?.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))) && (
                            <div className="py-6 text-center">
                              <p className="text-[10px] font-semibold text-gray-400 tracking-wide">No matching products found</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 5: Order List */}
                  <AnimatePresence>
                    {orderItems.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 border-t border-dashed border-gray-150 pt-5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-gray-500">Order Items ({orderItems.length})</label>
                          <button type="button" onClick={() => setOrderItems([])} className="text-[10px] font-bold text-red-500 tracking-wide">Clear All</button>
                        </div>
                        <div className="space-y-2">
                          {orderItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2.5 bg-[#189D91]/5 rounded-xl">
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-semibold text-gray-800 truncate max-w-[150px]">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center bg-white rounded-lg border border-[#189D91]/20 p-0.5">
                                  <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} className="w-5 h-5 flex items-center justify-center text-[#189D91] font-bold text-sm">-</button>
                                  <input 
                                    type="number" 
                                    value={item.qty} 
                                    onChange={e => updateQty(item.id, e.target.value)}
                                    className="w-8 text-center text-xs font-bold bg-transparent outline-none" 
                                  />
                                  <button type="button" onClick={() => updateQty(item.id, item.qty + 1)} className="w-5 h-5 flex items-center justify-center text-[#189D91] font-bold text-sm">+</button>
                                </div>
                                <button type="button" onClick={() => removeOrderItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                  <FiTrash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <FiMessageSquare className="absolute left-4 top-3 text-gray-400 text-sm" />
                    <textarea 
                      placeholder="Notes / Special Requirements" 
                      rows="2" 
                      value={formData.message} 
                      onChange={e => setFormData({...formData, message: e.target.value})} 
                      onFocus={e => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      className="w-full bg-gray-50/80 border border-gray-150 focus:border-[#189D91] focus:bg-white rounded-xl py-2.5 pl-11 pr-4 outline-none text-xs font-semibold text-gray-800 transition-all placeholder:text-gray-400 resize-none" 
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {status !== 'success' && (
              <div className="p-6 bg-gray-50 border-t border-gray-150 shrink-0">
                <button
                  form="bulkForm"
                  disabled={loading || orderItems.length === 0 || status === 'sending'}
                  type="submit"
                  className="w-full bg-[#189D91] text-white py-3.5 rounded-[12px] font-bold tracking-wider text-xs hover:bg-[#14847a] transition-all shadow-md shadow-[#189D91]/10 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {status === 'sending' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Submit Bulk Inquiry <FiChevronRight size={13} /></>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkOrderModal;
