import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiX, FiEdit3, FiTrash2, FiImage, FiSave, FiChevronDown, FiInfo } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const SubcategoryModal = ({ category, subcategory, isOpen, onClose, onSave, isSaving }) => {
  const [sub, setSub] = useState({ name: '', image: '', description: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (subcategory) {
      setSub(subcategory);
    } else {
      setSub({ name: '', image: '', description: '' });
    }
  }, [subcategory, isOpen]);

  if (!isOpen || !category) return null;

  const handleChange = (field, value) => {
    setSub(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert('Image too large (max 5MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-deep-espresso/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border border-soft-oatmeal/30 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-soft-oatmeal flex items-center justify-between bg-soft-oatmeal/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-warm-sand/5 rounded-full -mr-16 -mt-16" />
           <div className="relative z-10 flex items-center gap-5">
             <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0">
               <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
             </div>
             <div>
               <h2 className="text-2xl font-display font-bold text-deep-espresso">
                 {subcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
               </h2>
                <p className="text-warm-sand text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                  Parent Category: <span className="text-deep-espresso/80">{category.name}</span>
                </p>
             </div>
           </div>
           <button onClick={onClose} disabled={isSaving} className="relative z-10 p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-warm-sand/60 disabled:opacity-50">
             <FiX size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-soft-oatmeal/5">
          <div className="bg-white p-8 rounded-[32px] border border-soft-oatmeal/40 shadow-sm relative">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4">
                <input 
                  type="file" accept="image/*" className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  disabled={isSaving}
                />
                <div 
                  onClick={() => !isSaving && fileInputRef.current.click()}
                  className={`aspect-square w-full rounded-2xl bg-soft-oatmeal/10 border-2 border-dashed border-soft-oatmeal/40 flex flex-col items-center justify-center cursor-pointer hover:bg-soft-oatmeal/20 transition-all overflow-hidden relative ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {sub.image ? (
                    <img src={sub.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-3">
                      <FiImage size={28} className="mx-auto mb-2 opacity-30" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-warm-sand/60">Upload Photo</span>
                    </div>
                  )}
                  {sub.image && !isSaving && (
                    <div className="absolute inset-0 bg-deep-espresso/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Change Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Subcategory Name</label>
                    <input 
                      type="text" value={sub.name} onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Chandeliers" 
                      disabled={isSaving}
                      className="w-full bg-white border border-soft-oatmeal/40 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-warm-sand/20 outline-none transition-all font-medium disabled:opacity-50"
                    />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Description</label>
                  <textarea 
                    rows="4" value={sub.description} onChange={(e) => handleChange('description', e.target.value)}
                    disabled={isSaving}
                    className="w-full bg-white border border-soft-oatmeal/40 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-warm-sand/20 outline-none transition-all font-medium resize-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-soft-oatmeal flex gap-4">
          <button onClick={onClose} disabled={isSaving} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-warm-sand hover:text-red-500 transition-colors disabled:opacity-50">Discard</button>
          <button 
            onClick={() => onSave(sub)}
            disabled={!sub.name.trim() || isSaving}
            className="px-16 bg-deep-espresso text-white py-4 rounded-[20px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-dusty-cocoa disabled:bg-soft-oatmeal/40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 min-w-[200px]"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <FiSave size={18} /> {subcategory ? 'Save Changes' : 'Add Record'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CategoryImage = ({ src, name, className = "" }) => {
  const [error, setError] = useState(false);
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  
  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-soft-oatmeal to-warm-sand/20 text-deep-espresso font-display font-black text-[10px] shadow-inner ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      onError={() => setError(true)}
      className={`object-cover ${className}`} 
    />
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, categoryName }) => {
  if (!isOpen) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-deep-espresso/60 backdrop-blur-xl z-[150] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 border border-soft-oatmeal/30 text-center space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-8 -mt-8 opacity-50" />
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <FiTrash2 size={28} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-display font-bold text-deep-espresso">Delete Category?</h3>
          <p className="text-xs text-warm-sand leading-relaxed font-medium">
            Are you sure you want to delete <span className="text-deep-espresso font-bold">"{categoryName}"</span>? This action cannot be undone and will fail if active inventory items are assigned to this category.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] border border-soft-oatmeal rounded-xl text-warm-sand hover:bg-soft-oatmeal/20 transition-all font-bold"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all font-bold"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AlertModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-deep-espresso/60 backdrop-blur-xl z-[160] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 border border-soft-oatmeal/30 text-center space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 opacity-50" />
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <FiInfo size={28} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-display font-bold text-deep-espresso">{title}</h3>
          <p className="text-xs text-warm-sand leading-relaxed font-medium">
            {message}
          </p>
        </div>
        <div className="pt-2">
          <button 
            onClick={onClose} 
            className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] bg-deep-espresso text-white rounded-xl shadow-lg hover:bg-dusty-cocoa transition-all font-bold"
          >
            Acknowledge
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ManageCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSubcategory, setEditingSubcategory] = useState({ category: null, sub: null, index: -1 });
  const [expandedIds, setExpandedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, categoryId: null, categoryName: null });
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' });
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    setDeleteConfirm({ isOpen: true, categoryId: id, categoryName: name });
  };

  const confirmDelete = async () => {
    const { categoryId } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: null });
    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories(categories.filter((c) => c._id !== categoryId));
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to delete category. Please check if active products are associated with it.';
      setErrorModal({
        isOpen: true,
        title: 'Delete Failed',
        message: errMsg
      });
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const isExpanded = prev.includes(id);
      return isExpanded ? prev.filter(i => i !== id) : [...prev, id];
    });
  };

  const expandAll = () => setExpandedIds(categories.map(c => c._id));
  const collapseAll = () => setExpandedIds([]);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateSubcategories = async (categoryId, updatedSubs) => {
    setIsSavingSubcategory(true);
    try {
      const response = await api.put(`/categories/${categoryId}`, {
        subcategories: updatedSubs
      });
      if (response.data.success) {
        setCategories(categories.map(c => c._id === categoryId ? response.data.data : c));
        setEditingSubcategory({ category: null, sub: null, index: -1 });
      }
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update subcategories');
    } finally {
      setIsSavingSubcategory(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Control Bar */}
        <div className="bg-white p-3 rounded-2xl border border-soft-oatmeal/30 shadow-sm flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate('/admin/manage-categories/add')}
            className="px-5 py-2.5 bg-deep-espresso text-white rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest hover:bg-dusty-cocoa transition-all shadow-md active:scale-95"
          >
            <FiPlus size={16} /> Add Category
          </button>

          <div className="flex-1 min-w-[200px] relative">
            <input 
              type="text" 
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal/30 rounded-xl pl-4 pr-10 py-2.5 text-xs font-medium focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2">
           <button onClick={expandAll} className="px-4 py-1.5 bg-white border border-soft-oatmeal/40 rounded-lg text-[8px] font-black uppercase tracking-widest text-warm-sand hover:text-deep-espresso transition-all">Expand All</button>
           <button onClick={collapseAll} className="px-4 py-1.5 bg-white border border-soft-oatmeal/40 rounded-lg text-[8px] font-black uppercase tracking-widest text-warm-sand hover:text-deep-espresso transition-all">Collapse All</button>
        </div>

        {loading ? (
          <div className="py-20 text-center font-display text-warm-sand animate-pulse">Loading Categories...</div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((cat) => {
                const isExpanded = expandedIds.includes(cat._id);
                
                return (
                  <div key={cat._id} className="space-y-1">
                    <div 
                      onClick={() => toggleExpand(cat._id)}
                      className="bg-white p-3 rounded-2xl border border-soft-oatmeal/40 shadow-sm flex items-center gap-6 group cursor-pointer hover:border-warm-sand/20 transition-all"
                    >
                       <div className="w-16 h-16 rounded-xl overflow-hidden border border-soft-oatmeal/30 shadow-inner flex-shrink-0">
                          <CategoryImage src={cat.image} name={cat.name} className="w-full h-full" />
                       </div>

                       <div className="flex-1 min-w-0 flex items-center gap-8">
                          <div className="w-64">
                            <h3 className="text-sm font-display font-bold text-deep-espresso truncate">{cat.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[7px] font-black uppercase tracking-widest text-warm-sand/60">
                                {cat.subcategories?.length || 0} Subcategories
                              </span>
                              <FiChevronDown size={14} className={`text-warm-sand/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingSubcategory({ category: cat, sub: null, index: -1 }); }} className="p-2 hover:bg-soft-oatmeal rounded-lg text-warm-sand"><FiPlus size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/manage-categories/edit/${cat._id}`); }} className="p-2 hover:bg-soft-oatmeal rounded-lg text-warm-sand"><FiEdit3 size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(cat._id, cat.name); }} className="p-2 hover:bg-red-50 text-red-400 rounded-lg"><FiTrash2 size={14} /></button>
                       </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && cat.subcategories?.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-soft-oatmeal/5 rounded-2xl border border-soft-oatmeal/20 ml-12 mb-4">
                           <div className="p-3 space-y-2">
                              {cat.subcategories.map((sub, sIdx) => (
                                <div key={sIdx} className="bg-white p-2.5 rounded-xl border border-soft-oatmeal/30 shadow-sm flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-md overflow-hidden bg-soft-oatmeal/10">
                                         <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                                      </div>
                                      <h4 className="text-[11px] font-bold text-deep-espresso">{sub.name}</h4>
                                   </div>
                                   <div className="flex items-center gap-1.5">
                                      <button onClick={() => setEditingSubcategory({ category: cat, sub: sub, index: sIdx })} className="p-1.5 hover:bg-soft-oatmeal/30 rounded-lg text-warm-sand"><FiEdit3 size={12} /></button>
                                      <button onClick={() => {
                                        if (window.confirm('Delete subcategory?')) {
                                          const newSubs = cat.subcategories.filter((_, i) => i !== sIdx);
                                          handleUpdateSubcategories(cat._id, newSubs);
                                        }
                                      }} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><FiTrash2 size={12} /></button>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingSubcategory.category && (
          <SubcategoryModal 
            category={editingSubcategory.category}
            subcategory={editingSubcategory.sub}
            isOpen={!!editingSubcategory.category}
            isSaving={isSavingSubcategory}
            onClose={() => setEditingSubcategory({ category: null, sub: null, index: -1 })}
            onSave={(updatedSub) => {
              const cat = editingSubcategory.category;
              const idx = editingSubcategory.index;
              let updatedSubs;
              if (idx === -1) updatedSubs = [...(cat.subcategories || []), updatedSub];
              else updatedSubs = cat.subcategories.map((s, i) => i === idx ? updatedSub : s);
              handleUpdateSubcategories(cat._id, updatedSubs);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <DeleteConfirmationModal
            isOpen={deleteConfirm.isOpen}
            categoryName={deleteConfirm.categoryName}
            onClose={() => setDeleteConfirm({ isOpen: false, categoryId: null, categoryName: null })}
            onConfirm={confirmDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorModal.isOpen && (
          <AlertModal
            isOpen={errorModal.isOpen}
            title={errorModal.title}
            message={errorModal.message}
            onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default ManageCategories;
