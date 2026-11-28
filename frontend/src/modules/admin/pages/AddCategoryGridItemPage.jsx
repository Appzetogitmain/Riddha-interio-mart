import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiCheck, FiImage } from 'react-icons/fi';
import { categoryGridData } from '../data/manageCategoryGridData';

const AddCategoryGridItemPage = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [item, setItem] = useState({
    name: '',
    image: '',
    displayOrder: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);

    const newItem = {
      id: Date.now(),
      name: item.name,
      image: item.image || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80',
      displayOrder: parseInt(item.displayOrder) || 0,
    };

    // Simulate API/Storage delay
    setTimeout(() => {
      try {
        const saved = localStorage.getItem('admin_category_grid');
        const currentData = saved ? JSON.parse(saved) : categoryGridData;
        const updated = [...currentData, newItem].sort((a, b) => a.displayOrder - b.displayOrder);
        localStorage.setItem('admin_category_grid', JSON.stringify(updated));
        
        setIsSaving(false);
        setIsSaved(true);
        setTimeout(() => navigate('/admin/manage-grid'), 1000);
      } catch (err) {
        console.error('Failed to save grid item:', err);
        setIsSaving(false);
      }
    }, 800);
  };

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/manage-grid')}
            className="p-3 bg-white rounded-2xl border border-soft-oatmeal text-warm-sand hover:text-deep-espresso transition-all"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-deep-espresso">Add Grid Item</h1>
            <p className="text-warm-sand text-sm font-medium">Create a new quick-access category circle for the homepage.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-8 md:p-10 rounded-[40px] border border-soft-oatmeal shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Category Name</label>
                <input 
                  required
                  type="text"
                  value={item.name}
                  onChange={(e) => setItem({ ...item, name: e.target.value })}
                  placeholder="e.g. Cushions"
                  className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Display Order</label>
                <input 
                  type="number"
                  min="1"
                  value={item.displayOrder}
                  onChange={(e) => setItem({ ...item, displayOrder: e.target.value })}
                  placeholder="Order (e.g. 1, 2, 3)"
                  className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Image URL</label>
                <input 
                  type="text"
                  value={item.image}
                  onChange={(e) => setItem({ ...item, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Preview Card */}
            <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-soft-oatmeal/5 rounded-[32px] border border-soft-oatmeal/30">
               <span className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Live Preview</span>
               <div className="flex flex-col items-center gap-2">
                  <div className="aspect-square w-24 rounded-full overflow-hidden border-2 border-white shadow-xl bg-white">
                    {item.image ? (
                      <img src={item.image} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-soft-oatmeal">
                        <FiImage size={32} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-deep-espresso/50">
                    {item.name || 'Category'}
                  </span>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              type="button"
              onClick={() => navigate('/admin/manage-grid')}
              className="px-8 py-4 text-xs font-black uppercase tracking-widest text-warm-sand hover:text-red-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving || isSaved}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 ${
                isSaved ? 'bg-emerald-500 text-white' : 
                isSaving ? 'bg-dusty-cocoa text-white animate-pulse' : 
                'bg-deep-espresso text-white hover:bg-dusty-cocoa'
              }`}
            >
              {isSaved ? <><FiCheck /> Saved</> : isSaving ? 'Saving...' : <><FiSave /> Save Item</>}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default AddCategoryGridItemPage;
