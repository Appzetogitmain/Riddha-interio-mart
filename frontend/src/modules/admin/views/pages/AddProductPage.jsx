import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { FiArrowLeft, FiImage, FiSave, FiInfo, FiTag, FiDollarSign, FiType } from 'react-icons/fi';
import { adminCategories } from '../../models/adminCategories';

import DimensionsInput from '../../../../shared/components/DimensionsInput';
const AddProductPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(adminCategories);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('admin_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCategories(parsed);
      if (parsed.length > 0) {
        setFormData(prev => ({ ...prev, category: parsed[0].name }));
      }
    } else {
      setFormData(prev => ({ ...prev, category: 'Tiles' }));
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    console.log('Product Added:', formData);
    navigate('/admin/catalog');
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => navigate('/admin/catalog')}
          className="flex items-center gap-2 text-warm-sand font-bold hover:text-deep-espresso transition-colors group text-xs md:text-sm"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Catalog
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">Add New Product</h1>
            <p className="text-warm-sand text-sm md:text-base font-medium">Populate your catalog with premium items.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 pb-12">
          {/* Main Form Card */}
          <div className="bg-white rounded-3xl md:rounded-[32px] border border-soft-oatmeal shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
             {/* Left: Image Preview Area */}
             <div className="p-6 md:p-8 bg-soft-oatmeal/10 border-b lg:border-r lg:border-b-0 border-soft-oatmeal flex flex-col items-center justify-center space-y-4">
                <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-soft-oatmeal flex flex-col items-center justify-center overflow-hidden bg-white/50 relative group">
                   {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                      <div className="flex flex-col items-center gap-2 text-warm-sand">
                         <FiImage size={48} className="opacity-20" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Image Preview</span>
                      </div>
                   )}
                   <div className="absolute inset-0 bg-deep-espresso/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20">Edit Image URL</span>
                   </div>
                </div>
                <div className="w-full space-y-2">
                   <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                      <FiImage size={12} /> Image URL
                   </label>
                   <input 
                      type="url" 
                      required
                      placeholder="https://example.com/item.jpg"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      className="w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                   />
                </div>
             </div>

             {/* Right: Detailed Fields */}
             <div className="lg:col-span-2 p-6 md:p-10 lg:p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                         <FiType size={12} /> Product Name
                      </label>
                      <input 
                        type="text" required placeholder="Italian White Marble"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                         <FiTag size={12} /> Product Code (SKU)
                      </label>
                      <input 
                        type="text" required placeholder="TLE-MAR-012"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-mono"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all cursor-pointer"
                      >
                         {categories.map(cat => (
                           <option key={cat.id} value={cat.name}>{cat.name}</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                         <FiDollarSign size={12} /> Base Price (₹)
                      </label>
                      <input 
                        type="number" required placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                      <FiInfo size={12} /> Detailed Description
                   </label>
                   <textarea 
                     rows="4" 
                     placeholder="Enter product description, key features, and heritage information..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all resize-none"
                   ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-soft-oatmeal/50">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Material</label>
                      <input 
                        type="text" placeholder="e.g. Carrara Marble"
                        value={formData.material}
                        onChange={(e) => setFormData({...formData, material: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Dimensions</label>
                      <DimensionsInput value={formData.dimensions} onChange={(v) => setFormData(prev => ({ ...prev, dimensions: v }))} categoryText={`${formData.name || ''} ${formData.category || ''}`} />
                   </div>
                </div>

                <div className="pt-6 flex justify-end">
                   <button 
                     type="submit"
                     className="w-full md:w-auto bg-deep-espresso text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-xs px-10 py-4.5 rounded-2xl hover:bg-dusty-cocoa transition-all shadow-xl shadow-deep-espresso/20 flex items-center justify-center gap-3"
                   >
                      <FiSave size={16} /> Save Product
                   </button>
                </div>
             </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default AddProductPage;
